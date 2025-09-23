// Bluff - Whose Bluffing? Game - Main JavaScript File

class BluffGame {
    constructor() {
        this.players = [];
        this.currentCategory = null;
        this.currentWord = null;
        this.blufferIndex = -1;
        this.currentPlayerIndex = 0;
        this.clues = [];
        this.votes = [];
        this.currentPhase = 'setup';
        this.wordLists = this.initializeWordLists();
        
        this.initializeEventListeners();
        this.showScreen('setup-screen');
    }

    initializeWordLists() {
        return {
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

    initializeEventListeners() {
        // Category selection
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.currentCategory = e.target.dataset.category;
                this.updateStartButton();
            });
        });

        // Player management
        document.getElementById('add-player-btn').addEventListener('click', () => {
            this.addPlayer();
        });

        document.getElementById('player-name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });

        // Game flow buttons
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('reveal-role-btn').addEventListener('click', () => {
            this.revealRole();
        });

        document.getElementById('next-player-btn').addEventListener('click', () => {
            this.nextPlayerAssignment();
        });

        document.getElementById('submit-clue-btn').addEventListener('click', () => {
            this.submitClue();
        });

        document.getElementById('clue-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitClue();
            }
        });

        document.getElementById('proceed-to-voting-btn').addEventListener('click', () => {
            this.startVoting();
        });

        document.getElementById('submit-guess-btn').addEventListener('click', () => {
            this.submitBlufferGuess();
        });

        document.getElementById('word-guess-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitBlufferGuess();
            }
        });

        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.playAgain();
        });

        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.newGame();
        });
    }

    addPlayer() {
        const input = document.getElementById('player-name-input');
        const name = input.value.trim();
        
        if (name && this.players.length < 8 && !this.players.some(p => p.name === name)) {
            this.players.push({
                name: name,
                isBluffer: false,
                clue: '',
                vote: ''
            });
            
            this.updatePlayersDisplay();
            input.value = '';
            this.updateStartButton();
        }
    }

    removePlayer(index) {
        this.players.splice(index, 1);
        this.updatePlayersDisplay();
        this.updateStartButton();
    }

    updatePlayersDisplay() {
        const list = document.getElementById('players-display');
        list.innerHTML = '';
        
        this.players.forEach((player, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${player.name}</span>
                <button class="remove-player" onclick="game.removePlayer(${index})">×</button>
            `;
            list.appendChild(li);
        });
    }

    updateStartButton() {
        const btn = document.getElementById('start-game-btn');
        const hasEnoughPlayers = this.players.length >= 4;
        const hasCategory = this.currentCategory !== null;
        
        btn.disabled = !(hasEnoughPlayers && hasCategory);
        btn.textContent = hasEnoughPlayers && hasCategory ? 
            'Start Game' : 
            `Need ${hasCategory ? '' : 'category and '}${hasEnoughPlayers ? '' : `${4 - this.players.length} more player(s)`}`;
    }

    startGame() {
        // Assign roles
        this.blufferIndex = Math.floor(Math.random() * this.players.length);
        this.players.forEach((player, index) => {
            player.isBluffer = index === this.blufferIndex;
        });

        // Select random word
        const words = this.wordLists[this.currentCategory];
        this.currentWord = words[Math.floor(Math.random() * words.length)];

        // Reset game state
        this.currentPlayerIndex = 0;
        this.clues = [];
        this.votes = [];
        this.currentPhase = 'assignment';

        this.showScreen('assignment-screen');
        this.updateAssignmentScreen();
    }

    updateAssignmentScreen() {
        const playerName = document.getElementById('current-player-name');
        playerName.textContent = this.players[this.currentPlayerIndex].name;
        
        document.getElementById('role-display').classList.add('hidden');
        document.getElementById('reveal-role-btn').style.display = 'block';
    }

    revealRole() {
        const roleDisplay = document.getElementById('role-display');
        const roleContent = document.getElementById('role-content');
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        if (currentPlayer.isBluffer) {
            roleContent.innerHTML = `
                <h3>You are the BLUFFER! 🕵️</h3>
                <div class="bluffer-notice">You don't know the secret word!</div>
                <p>Try to blend in by giving vague clues that could work for any word in the category: <strong>${this.currentCategory}</strong></p>
            `;
        } else {
            roleContent.innerHTML = `
                <h3>You are a INNOCENT! 🔍</h3>
                <div class="secret-word">${this.currentWord}</div>
                <p>Give a clue that hints at this word, but don't make it too obvious!</p>
            `;
        }
        
        document.getElementById('reveal-role-btn').style.display = 'none';
        roleDisplay.classList.remove('hidden');
    }

    nextPlayerAssignment() {
        this.currentPlayerIndex++;
        
        if (this.currentPlayerIndex >= this.players.length) {
            // All players have seen their roles, start clue phase
            this.currentPlayerIndex = 0;
            this.currentPhase = 'clues';
            this.showScreen('clue-screen');
            this.updateClueScreen();
        } else {
            this.updateAssignmentScreen();
        }
    }

    updateClueScreen() {
        const playerName = document.getElementById('clue-player-name');
        const wordReminder = document.getElementById('word-reminder');
        const gameCategory = document.getElementById('game-category');
        const cluesCount = document.getElementById('clues-count');
        const totalPlayers = document.getElementById('total-players');
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        playerName.textContent = `${currentPlayer.name}'s Turn`;
        gameCategory.textContent = this.currentCategory;
        
        if (currentPlayer.isBluffer) {
            wordReminder.innerHTML = `You are the BLUFFER! You don't know the word.`;
            wordReminder.className = 'word-reminder bluffer';
        } else {
            wordReminder.innerHTML = `Your word: <strong>${this.currentWord}</strong>`;
            wordReminder.className = 'word-reminder';
        }
        
        cluesCount.textContent = this.clues.length;
        totalPlayers.textContent = this.players.length;
        
        document.getElementById('clue-input').value = '';
        document.getElementById('clue-input').focus();
    }

    submitClue() {
        const clueInput = document.getElementById('clue-input');
        const clue = clueInput.value.trim();
        
        if (clue) {
            this.clues.push({
                playerName: this.players[this.currentPlayerIndex].name,
                clue: clue,
                isBluffer: this.players[this.currentPlayerIndex].isBluffer
            });
            
            this.players[this.currentPlayerIndex].clue = clue;
            this.currentPlayerIndex++;
            
            if (this.currentPlayerIndex >= this.players.length) {
                // All clues submitted, show clues display
                this.showScreen('clues-display-screen');
                this.displayAllClues();
            } else {
                this.updateClueScreen();
            }
        }
    }

    displayAllClues() {
        const cluesList = document.getElementById('all-clues');
        const displayCategory = document.getElementById('display-category');
        
        displayCategory.textContent = this.currentCategory;
        cluesList.innerHTML = '';
        
        // Shuffle clues to hide the order
        const shuffledClues = [...this.clues].sort(() => Math.random() - 0.5);
        
        shuffledClues.forEach((clue, index) => {
            setTimeout(() => {
                const clueDiv = document.createElement('div');
                clueDiv.className = 'clue-item';
                clueDiv.innerHTML = `
                    <div class="player-name">${clue.playerName}</div>
                    <div class="clue-text">"${clue.clue}"</div>
                `;
                cluesList.appendChild(clueDiv);
            }, index * 300);
        });
    }

    startVoting() {
        this.currentPlayerIndex = 0;
        this.votes = [];
        this.currentPhase = 'voting';
        this.showScreen('voting-screen');
        this.updateVotingScreen();
    }

    updateVotingScreen() {
        const votingPlayerName = document.getElementById('voting-player-name');
        const voteButtons = document.getElementById('vote-buttons');
        const votesCount = document.getElementById('votes-count');
        const totalVoters = document.getElementById('total-voters');
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        votingPlayerName.textContent = `${currentPlayer.name}'s Vote`;
        
        voteButtons.innerHTML = '';
        
        // Create vote buttons for all players except the current voter
        this.players.forEach((player, index) => {
            if (index !== this.currentPlayerIndex) {
                const btn = document.createElement('button');
                btn.className = 'vote-btn';
                btn.textContent = player.name;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    
                    setTimeout(() => {
                        this.submitVote(player.name);
                    }, 500);
                });
                voteButtons.appendChild(btn);
            }
        });
        
        votesCount.textContent = this.votes.length;
        totalVoters.textContent = this.players.length;
    }

    submitVote(votedPlayerName) {
        this.votes.push({
            voter: this.players[this.currentPlayerIndex].name,
            votedFor: votedPlayerName
        });
        
        this.currentPlayerIndex++;
        
        if (this.currentPlayerIndex >= this.players.length) {
            // All votes cast, calculate results
            this.calculateVotingResults();
        } else {
            this.updateVotingScreen();
        }
    }

    calculateVotingResults() {
        // Count votes
        const voteCount = {};
        this.votes.forEach(vote => {
            voteCount[vote.votedFor] = (voteCount[vote.votedFor] || 0) + 1;
        });
        
        // Find player with most votes
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
        
        const blufferName = this.players[this.blufferIndex].name;
        
        if (isTie || maxVotes === 0) {
            // Tie or no votes - bluffer survives, goes to guess phase
            this.showScreen('guess-screen');
            document.getElementById('bluffer-name').textContent = blufferName;
            document.getElementById('word-guess-input').focus();
        } else if (mostVotedPlayer === blufferName) {
            // Imposter was caught - players win
            this.endGame('innocents', 'The bluffer was caught!', voteCount);
        } else {
            // Wrong player voted out - bluffer gets to guess
            this.showScreen('guess-screen');
            document.getElementById('bluffer-name').textContent = blufferName;
            document.getElementById('word-guess-input').focus();
        }
    }

    submitImposterGuess() {
        const guessInput = document.getElementById('word-guess-input');
        const guess = guessInput.value.trim().toLowerCase();
        const correctWord = this.currentWord.toLowerCase();
        
        if (guess) {
            const voteCount = this.getVoteCount();
            
            if (guess === correctWord) {
                // Imposter guessed correctly - bluffer wins
                this.endGame('bluffer', `The bluffer guessed "${this.currentWord}" correctly!`, voteCount);
            } else {
                // Imposter guessed wrong - players win
                this.endGame('innocents', `The bluffer guessed "${guess}" but the word was "${this.currentWord}"`, voteCount);
            }
        }
    }

    getVoteCount() {
        const voteCount = {};
        this.votes.forEach(vote => {
            voteCount[vote.votedFor] = (voteCount[vote.votedFor] || 0) + 1;
        });
        return voteCount;
    }

    endGame(winner, message, voteCount) {
        this.currentPhase = 'results';
        this.showScreen('results-screen');
        
        const gameResult = document.getElementById('game-result');
        const winnerAnnouncement = document.getElementById('winner-announcement');
        const secretWordReveal = document.getElementById('secret-word-reveal');
        const blufferReveal = document.getElementById('bluffer-reveal');
        const resultsCategory = document.getElementById('results-category');
        const votingResults = document.getElementById('voting-results');
        
        if (winner === 'bluffer') {
            gameResult.textContent = 'Imposter Wins!';
            winnerAnnouncement.textContent = message;
            winnerAnnouncement.className = 'winner-announcement bluffer-wins';
        } else {
            gameResult.textContent = 'Players Win!';
            winnerAnnouncement.textContent = message;
            winnerAnnouncement.className = 'winner-announcement players-win';
        }
        
        secretWordReveal.textContent = this.currentWord;
        blufferReveal.textContent = this.players[this.blufferIndex].name;
        resultsCategory.textContent = this.currentCategory;
        
        // Display voting results
        votingResults.innerHTML = '<h4>Voting Results:</h4>';
        Object.entries(voteCount).forEach(([player, votes]) => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'vote-result';
            resultDiv.innerHTML = `
                <span>${player}</span>
                <span>${votes} vote${votes !== 1 ? 's' : ''}</span>
            `;
            votingResults.appendChild(resultDiv);
        });
    }

    playAgain() {
        // Reset for new round with same players and category
        this.startGame();
    }

    newGame() {
        // Reset everything
        this.players = [];
        this.currentCategory = null;
        this.currentWord = null;
        this.blufferIndex = -1;
        this.currentPlayerIndex = 0;
        this.clues = [];
        this.votes = [];
        this.currentPhase = 'setup';
        
        // Reset UI
        document.getElementById('player-name-input').value = '';
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('selected'));
        this.updatePlayersDisplay();
        this.updateStartButton();
        
        this.showScreen('setup-screen');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

// Initialize the game when the page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new BluffGame();
});

// Make game available globally for event handlers
window.game = game;
