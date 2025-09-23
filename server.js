const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static(__dirname));

// Serve the main game files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Game state management
class GameRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];
        this.gameState = {
            phase: 'lobby',
            category: null,
            word: null,
            blufferIndex: -1,
            clues: [],
            votes: [],
            currentPlayerIndex: 0,
            gameStarted: false
        };
        this.wordLists = {
            movies: [
                'The Matrix', 'Titanic', 'Avatar', 'Star Wars', 'Jaws', 'E.T.', 'Casablanca', 'The Godfather',
                'Pulp Fiction', 'Forrest Gump', 'The Lion King', 'Jurassic Park', 'Inception', 'The Dark Knight',
                'Frozen', 'Finding Nemo', 'Shrek', 'Iron Man', 'Spider-Man', 'Batman', 'Superman', 'Wonder Woman',
                'Black Panther', 'Avengers', 'Toy Story', 'The Incredibles', 'Monsters Inc', 'Cars', 'Wall-E',
                'Up', 'Brave', 'Moana', 'Encanto', 'Coco', 'Soul', 'Luca', 'Turning Red'
            ],
            singers: [
                'Taylor Swift', 'Beyoncé', 'Ed Sheeran', 'Adele', 'Bruno Mars', 'Ariana Grande', 'Drake',
                'Justin Bieber', 'Rihanna', 'Lady Gaga', 'Katy Perry', 'The Weeknd', 'Billie Eilish',
                'Dua Lipa', 'Post Malone', 'Olivia Rodrigo', 'Harry Styles', 'Shawn Mendes', 'Selena Gomez',
                'Demi Lovato', 'John Legend', 'Alicia Keys', 'John Mayer', 'Coldplay', 'Maroon 5',
                'OneRepublic', 'Imagine Dragons', 'Twenty One Pilots', 'The Chainsmokers', 'Calvin Harris',
                'David Guetta', 'Marshmello', 'Zedd', 'Skrillex', 'Diplo'
            ],
            historical: [
                'Napoleon Bonaparte', 'Albert Einstein', 'Leonardo da Vinci', 'William Shakespeare', 'Cleopatra',
                'Julius Caesar', 'Alexander the Great', 'George Washington', 'Abraham Lincoln', 'Winston Churchill',
                'Mahatma Gandhi', 'Martin Luther King Jr.', 'Nelson Mandela', 'Marie Curie', 'Isaac Newton',
                'Charles Darwin', 'Galileo Galilei', 'Christopher Columbus', 'Marco Polo', 'Joan of Arc',
                'King Arthur', 'Robin Hood', 'Mozart', 'Beethoven', 'Picasso', 'Van Gogh', 'Michelangelo',
                'Frida Kahlo', 'Edgar Allan Poe', 'Mark Twain', 'Jane Austen', 'Charles Dickens'
            ],
            animals: [
                'Lion', 'Tiger', 'Elephant', 'Giraffe', 'Zebra', 'Kangaroo', 'Panda', 'Koala', 'Penguin',
                'Dolphin', 'Whale', 'Shark', 'Eagle', 'Owl', 'Parrot', 'Flamingo', 'Peacock', 'Butterfly',
                'Bee', 'Ladybug', 'Spider', 'Snake', 'Lizard', 'Frog', 'Turtle', 'Rabbit', 'Squirrel',
                'Fox', 'Wolf', 'Bear', 'Deer', 'Horse', 'Cow', 'Pig', 'Sheep', 'Goat', 'Chicken',
                'Duck', 'Turkey', 'Cat', 'Dog', 'Hamster', 'Guinea Pig', 'Fish', 'Octopus'
            ],
            countries: [
                'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'United Kingdom', 'France', 'Germany',
                'Italy', 'Spain', 'Russia', 'China', 'Japan', 'South Korea', 'India', 'Australia', 'Egypt',
                'South Africa', 'Nigeria', 'Kenya', 'Morocco', 'Turkey', 'Greece', 'Norway', 'Sweden',
                'Switzerland', 'Netherlands', 'Belgium', 'Austria', 'Poland', 'Czech Republic', 'Hungary',
                'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'New Zealand'
            ]
        };
    }

    addPlayer(socket, playerName) {
        if (this.players.length >= 8) {
            return { success: false, error: 'Room is full' };
        }

        if (this.players.some(p => p.name === playerName)) {
            return { success: false, error: 'Name already taken' };
        }

        const player = {
            id: socket.id,
            name: playerName,
            isHost: this.players.length === 0,
            isBluffer: false,
            clue: '',
            vote: '',
            hasSubmittedClue: false,
            hasVoted: false
        };

        this.players.push(player);
        return { success: true, player };
    }

    removePlayer(socketId) {
        const playerIndex = this.players.findIndex(p => p.id === socketId);
        if (playerIndex !== -1) {
            const removedPlayer = this.players.splice(playerIndex, 1)[0];
            
            // If host left, make someone else host
            if (removedPlayer.isHost && this.players.length > 0) {
                this.players[0].isHost = true;
            }
            
            return true;
        }
        return false;
    }

    startGame(category) {
        if (this.players.length < 4) {
            return { success: false, error: 'Need at least 4 players' };
        }

        this.gameState.category = category;
        this.gameState.phase = 'roles';
        this.gameState.gameStarted = true;

        // Assign bluffer
        this.gameState.blufferIndex = Math.floor(Math.random() * this.players.length);
        this.players.forEach((player, index) => {
            player.isBluffer = index === this.gameState.blufferIndex;
        });

        // Select random word
        const words = this.wordLists[category];
        this.gameState.word = words[Math.floor(Math.random() * words.length)];

        // Reset game state
        this.gameState.clues = [];
        this.gameState.votes = [];
        this.gameState.currentPlayerIndex = 0;
        this.players.forEach(player => {
            player.hasSubmittedClue = false;
            player.hasVoted = false;
        });

        return { success: true };
    }

    submitClue(playerId, clue) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || player.hasSubmittedClue) {
            return { success: false, error: 'Invalid player or already submitted' };
        }

        player.clue = clue;
        player.hasSubmittedClue = true;

        this.gameState.clues.push({
            playerName: player.name,
            clue: clue,
            isBluffer: player.isBluffer
        });

        // Check if all players submitted clues
        if (this.gameState.clues.length === this.players.length) {
            this.gameState.phase = 'clues-display';
        }

        return { success: true };
    }

    submitVote(playerId, votedPlayerName) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || player.hasVoted) {
            return { success: false, error: 'Invalid player or already voted' };
        }

        player.vote = votedPlayerName;
        player.hasVoted = true;

        this.gameState.votes.push({
            voter: player.name,
            votedFor: votedPlayerName
        });

        // Check if all players voted
        if (this.gameState.votes.length === this.players.length) {
            this.calculateVotingResults();
        }

        return { success: true };
    }

    calculateVotingResults() {
        const voteCount = {};
        this.gameState.votes.forEach(vote => {
            voteCount[vote.votedFor] = (voteCount[vote.votedFor] || 0) + 1;
        });

        let maxVotes = 0;
        let mostVotedPlayer = '';
        let isTie = false;

        Object.entries(voteCount).forEach(([player, votes]) => {
            if (votes > maxVotes) {
                maxVotes = votes;
                mostVotedPlayer = player;
                isTie = false;
            } else if (votes === maxVotes && maxVotes > 0) {
                isTie = true;
            }
        });

        const blufferName = this.players[this.gameState.blufferIndex].name;

        if (isTie || maxVotes === 0) {
            this.gameState.phase = 'bluffer-guess';
        } else if (mostVotedPlayer === blufferName) {
            this.gameState.phase = 'results';
            this.gameState.winner = 'innocents';
            this.gameState.winMessage = 'The bluffer was caught!';
        } else {
            this.gameState.phase = 'bluffer-guess';
        }

        this.gameState.voteResults = voteCount;
    }

    submitBlufferGuess(guess) {
        if (guess.toLowerCase() === this.gameState.word.toLowerCase()) {
            this.gameState.phase = 'results';
            this.gameState.winner = 'bluffer';
            this.gameState.winMessage = `The bluffer guessed "${this.gameState.word}" correctly!`;
        } else {
            this.gameState.phase = 'results';
            this.gameState.winner = 'innocents';
            this.gameState.winMessage = `The bluffer guessed "${guess}" but the word was "${this.gameState.word}"`;
        }
    }

    resetGame() {
        this.gameState = {
            phase: 'lobby',
            category: null,
            word: null,
            blufferIndex: -1,
            clues: [],
            votes: [],
            currentPlayerIndex: 0,
            gameStarted: false
        };

        this.players.forEach(player => {
            player.isBluffer = false;
            player.clue = '';
            player.vote = '';
            player.hasSubmittedClue = false;
            player.hasVoted = false;
        });
    }
}

// Store active game rooms
const gameRooms = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('create-room', (callback) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new GameRoom(roomId);
        gameRooms.set(roomId, room);
        
        callback({ success: true, roomId });
    });

    socket.on('join-room', ({ roomId, playerName }, callback) => {
        const room = gameRooms.get(roomId);
        if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
        }

        const result = room.addPlayer(socket, playerName);
        if (result.success) {
            socket.join(roomId);
            socket.roomId = roomId;
            socket.playerName = playerName;
            
            // Send updated room state to all players
            io.to(roomId).emit('room-update', {
                players: room.players,
                gameState: room.gameState
            });
            
            callback({ success: true, room: roomId });
        } else {
            callback(result);
        }
    });

    socket.on('start-game', ({ roomId, category }, callback) => {
        const room = gameRooms.get(roomId);
        if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
        }

        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isHost) {
            callback({ success: false, error: 'Only host can start game' });
            return;
        }

        const result = room.startGame(category);
        if (result.success) {
            // Send role information to each player privately
            room.players.forEach(p => {
                const playerSocket = io.sockets.sockets.get(p.id);
                if (playerSocket) {
                    playerSocket.emit('role-assigned', {
                        isBluffer: p.isBluffer,
                        word: p.isBluffer ? null : room.gameState.word,
                        category: room.gameState.category
                    });
                }
            });

            // Update all players with new game state
            io.to(roomId).emit('game-started', {
                gameState: room.gameState,
                players: room.players
            });

            callback({ success: true });
        } else {
            callback(result);
        }
    });

    socket.on('submit-clue', ({ roomId, clue }, callback) => {
        const room = gameRooms.get(roomId);
        if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
        }

        const result = room.submitClue(socket.id, clue);
        if (result.success) {
            io.to(roomId).emit('clue-submitted', {
                gameState: room.gameState,
                players: room.players
            });
            
            callback({ success: true });
        } else {
            callback(result);
        }
    });

    socket.on('submit-vote', ({ roomId, votedPlayer }, callback) => {
        const room = gameRooms.get(roomId);
        if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
        }

        const result = room.submitVote(socket.id, votedPlayer);
        if (result.success) {
            io.to(roomId).emit('vote-submitted', {
                gameState: room.gameState,
                players: room.players
            });
            
            callback({ success: true });
        } else {
            callback(result);
        }
    });

    socket.on('submit-bluffer-guess', ({ roomId, guess }, callback) => {
        const room = gameRooms.get(roomId);
        if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
        }

        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isBluffer) {
            callback({ success: false, error: 'Only bluffer can guess' });
            return;
        }

        room.submitBlufferGuess(guess);
        
        io.to(roomId).emit('game-ended', {
            gameState: room.gameState,
            players: room.players
        });
        
        callback({ success: true });
    });

    socket.on('reset-game', ({ roomId }, callback) => {
        const room = gameRooms.get(roomId);
        if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
        }

        const player = room.players.find(p => p.id === socket.id);
        if (!player || !player.isHost) {
            callback({ success: false, error: 'Only host can reset game' });
            return;
        }

        room.resetGame();
        
        io.to(roomId).emit('game-reset', {
            gameState: room.gameState,
            players: room.players
        });
        
        callback({ success: true });
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        if (socket.roomId) {
            const room = gameRooms.get(socket.roomId);
            if (room) {
                room.removePlayer(socket.id);
                
                if (room.players.length === 0) {
                    // Remove empty room
                    gameRooms.delete(socket.roomId);
                } else {
                    // Update remaining players
                    io.to(socket.roomId).emit('player-left', {
                        players: room.players,
                        gameState: room.gameState
                    });
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Bluff - Whose Bluffing? server running on port ${PORT}`);
    console.log(`🌐 Visit http://localhost:${PORT} to play!`);
});
