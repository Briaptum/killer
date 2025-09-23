// Online Multiplayer Bluff - Whose Bluffing? Game - Client

class OnlineBluffGame {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.playerName = null;
        this.isHost = false;
        this.currentCategory = null;
        this.players = [];
        this.gameState = {};
        this.myRole = null;
        
        this.initializeSocket();
        this.initializeEventListeners();
        this.updateConnectionStatus('connecting');
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus('connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus('disconnected');
        });

        this.socket.on('room-update', (data) => {
            this.players = data.players;
            this.gameState = data.gameState;
            this.updateLobby();
        });

        this.socket.on('game-started', (data) => {
            this.players = data.players;
            this.gameState = data.gameState;
            this.showScreen('online-role-screen');
        });

        this.socket.on('role-assigned', (data) => {
            this.myRole = data;
            this.displayRole();
        });

        this.socket.on('clue-submitted', (data) => {
            this.players = data.players;
            this.gameState = data.gameState;
            this.updateClueProgress();
            
            if (this.gameState.phase === 'clues-display') {
                this.showScreen('online-clues-display-screen');
                this.displayAllClues();
            }
        });

        this.socket.on('vote-submitted', (data) => {
            this.players = data.players;
            this.gameState = data.gameState;
            this.updateVotingProgress();
            
            if (this.gameState.phase === 'bluffer-guess') {
                this.showScreen('online-guess-screen');
                this.setupImposterGuess();
            } else if (this.gameState.phase === 'results') {
                this.showScreen('online-results-screen');
                this.displayResults();
            }
        });

        this.socket.on('game-ended', (data) => {
            this.players = data.players;
            this.gameState = data.gameState;
            this.showScreen('online-results-screen');
            this.displayResults();
        });

        this.socket.on('game-reset', (data) => {
            this.players = data.players;
            this.gameState = data.gameState;
            this.showScreen('lobby-screen');
            this.updateLobby();
        });

        this.socket.on('player-left', (data) => {
            this.players = data.players;
            this.gameState = data.gameState;
            this.updateLobby();
        });
    }

    initializeEventListeners() {
        // Connection screen
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.createRoom();
        });

        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.joinRoom();
        });

        document.getElementById('room-code-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });

        document.getElementById('player-name-connection').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const roomCode = document.getElementById('room-code-input').value.trim();
                if (roomCode) {
                    this.joinRoom();
                } else {
                    this.createRoom();
                }
            }
        });

        // Lobby screen
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.isHost) return;
                
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.currentCategory = e.target.dataset.category;
                this.updateStartButton();
            });
        });

        document.getElementById('start-online-game-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('leave-room-btn').addEventListener('click', () => {
            this.leaveRoom();
        });

        document.getElementById('copy-room-code').addEventListener('click', () => {
            this.copyRoomCode();
        });

        // Role screen
        document.getElementById('role-understood-btn').addEventListener('click', () => {
            this.showScreen('online-clue-screen');
            this.setupCluePhase();
        });

        // Clue screen
        document.getElementById('submit-online-clue-btn').addEventListener('click', () => {
            this.submitClue();
        });

        document.getElementById('online-clue-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitClue();
            }
        });

        // Clues display screen
        document.getElementById('ready-to-vote-btn').addEventListener('click', () => {
            this.showScreen('online-voting-screen');
            this.setupVoting();
        });

        // Imposter guess screen
        document.getElementById('submit-online-guess-btn').addEventListener('click', () => {
            this.submitImposterGuess();
        });

        document.getElementById('online-word-guess-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitImposterGuess();
            }
        });

        // Results screen
        document.getElementById('play-online-again-btn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('new-online-game-btn').addEventListener('click', () => {
            this.leaveRoom();
        });
    }

    createRoom() {
        const playerName = document.getElementById('player-name-connection').value.trim();
        if (!playerName) {
            alert('Please enter your name');
            return;
        }

        this.playerName = playerName;
        
        this.socket.emit('create-room', (response) => {
            if (response.success) {
                this.roomId = response.roomId;
                this.joinCreatedRoom();
            } else {
                alert('Failed to create room: ' + response.error);
            }
        });
    }

    joinCreatedRoom() {
        this.socket.emit('join-room', { 
            roomId: this.roomId, 
            playerName: this.playerName 
        }, (response) => {
            if (response.success) {
                this.isHost = true;
                this.showScreen('lobby-screen');
                document.getElementById('current-room-code').textContent = this.roomId;
            } else {
                alert('Failed to join room: ' + response.error);
            }
        });
    }

    joinRoom() {
        const roomCode = document.getElementById('room-code-input').value.trim().toUpperCase();
        const playerName = document.getElementById('player-name-connection').value.trim();
        
        if (!roomCode || !playerName) {
            alert('Please enter both room code and your name');
            return;
        }

        this.playerName = playerName;
        this.roomId = roomCode;
        
        this.socket.emit('join-room', { 
            roomId: roomCode, 
            playerName: playerName 
        }, (response) => {
            if (response.success) {
                this.showScreen('lobby-screen');
                document.getElementById('current-room-code').textContent = roomCode;
                
                // Check if we're the host
                setTimeout(() => {
                    const myPlayer = this.players.find(p => p.name === this.playerName);
                    this.isHost = myPlayer ? myPlayer.isHost : false;
                    this.updateLobby();
                }, 100);
            } else {
                alert('Failed to join room: ' + response.error);
            }
        });
    }

    leaveRoom() {
        this.socket.disconnect();
        this.socket.connect();
        this.showScreen('connection-screen');
        this.resetLocalState();
    }

    resetLocalState() {
        this.roomId = null;
        this.playerName = null;
        this.isHost = false;
        this.currentCategory = null;
        this.players = [];
        this.gameState = {};
        this.myRole = null;
        
        // Reset UI
        document.getElementById('room-code-input').value = '';
        document.getElementById('player-name-connection').value = '';
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('selected'));
    }

    updateLobby() {
        const playersList = document.getElementById('online-players-list');
        const playerCount = document.getElementById('player-count');
        const waitingMessage = document.getElementById('waiting-message');
        const startButton = document.getElementById('start-online-game-btn');
        
        playerCount.textContent = this.players.length;
        
        playersList.innerHTML = '';
        this.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span class="player-name">${player.name}</span>
                ${player.isHost ? '<span class="host-badge">👑 Host</span>' : ''}
            `;
            playersList.appendChild(playerDiv);
        });

        if (this.isHost) {
            waitingMessage.style.display = 'none';
            startButton.style.display = 'block';
            this.updateStartButton();
            
            // Enable category selection for host
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
        } else {
            waitingMessage.style.display = 'block';
            startButton.style.display = 'none';
            
            // Disable category selection for non-hosts
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            });
        }
    }

    updateStartButton() {
        if (!this.isHost) return;
        
        const btn = document.getElementById('start-online-game-btn');
        const hasEnoughPlayers = this.players.length >= 4;
        const hasCategory = this.currentCategory !== null;
        
        btn.disabled = !(hasEnoughPlayers && hasCategory);
        btn.textContent = hasEnoughPlayers && hasCategory ? 
            'Start Game' : 
            `Need ${hasCategory ? '' : 'category and '}${hasEnoughPlayers ? '' : `${4 - this.players.length} more player(s)`}`;
    }

    startGame() {
        if (!this.isHost || !this.currentCategory) return;
        
        this.socket.emit('start-game', { 
            roomId: this.roomId, 
            category: this.currentCategory 
        }, (response) => {
            if (!response.success) {
                alert('Failed to start game: ' + response.error);
            }
        });
    }

    displayRole() {
        const roleContent = document.getElementById('online-role-content');
        
        if (this.myRole.isBluffer) {
            roleContent.innerHTML = `
                <h3>You are the BLUFFER! 🕵️</h3>
                <div class="bluffer-notice">You don't know the secret word!</div>
                <p>Try to blend in by giving vague clues that could work for any word in the category: <strong>${this.myRole.category}</strong></p>
            `;
        } else {
            roleContent.innerHTML = `
                <h3>You are a INNOCENT! 🔍</h3>
                <div class="secret-word">${this.myRole.word}</div>
                <p>Give a clue that hints at this word, but don't make it too obvious!</p>
            `;
        }
    }

    setupCluePhase() {
        const wordReminder = document.getElementById('online-word-reminder');
        const gameCategory = document.getElementById('online-game-category');
        
        gameCategory.textContent = this.myRole.category;
        
        if (this.myRole.isBluffer) {
            wordReminder.innerHTML = `You are the BLUFFER! You don't know the word.`;
            wordReminder.className = 'word-reminder bluffer';
        } else {
            wordReminder.innerHTML = `Your word: <strong>${this.myRole.word}</strong>`;
            wordReminder.className = 'word-reminder';
        }
        
        document.getElementById('online-clue-input').focus();
        this.updateClueProgress();
    }

    updateClueProgress() {
        const cluesCount = document.getElementById('online-clues-count');
        const totalPlayers = document.getElementById('online-total-players');
        const submittedPlayers = document.getElementById('submitted-players');
        
        cluesCount.textContent = this.gameState.clues ? this.gameState.clues.length : 0;
        totalPlayers.textContent = this.players.length;
        
        // Show who has submitted clues
        const submitted = this.players.filter(p => p.hasSubmittedClue);
        submittedPlayers.innerHTML = submitted.length > 0 ? 
            `<small>Submitted: ${submitted.map(p => p.name).join(', ')}</small>` : '';
    }

    submitClue() {
        const clueInput = document.getElementById('online-clue-input');
        const clue = clueInput.value.trim();
        
        if (!clue) {
            alert('Please enter a clue');
            return;
        }
        
        this.socket.emit('submit-clue', { 
            roomId: this.roomId, 
            clue: clue 
        }, (response) => {
            if (response.success) {
                clueInput.value = '';
                clueInput.disabled = true;
                document.getElementById('submit-online-clue-btn').disabled = true;
                document.getElementById('submit-online-clue-btn').textContent = 'Clue Submitted!';
            } else {
                alert('Failed to submit clue: ' + response.error);
            }
        });
    }

    displayAllClues() {
        const cluesList = document.getElementById('online-all-clues');
        const displayCategory = document.getElementById('online-display-category');
        
        displayCategory.textContent = this.myRole.category;
        cluesList.innerHTML = '';
        
        // Shuffle clues to hide the order
        const shuffledClues = [...this.gameState.clues].sort(() => Math.random() - 0.5);
        
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

    setupVoting() {
        const voteButtons = document.getElementById('online-vote-buttons');
        
        voteButtons.innerHTML = '';
        
        // Create vote buttons for all players except yourself
        this.players.forEach(player => {
            if (player.name !== this.playerName) {
                const btn = document.createElement('button');
                btn.className = 'vote-btn';
                btn.textContent = player.name;
                btn.addEventListener('click', () => {
                    this.submitVote(player.name, btn);
                });
                voteButtons.appendChild(btn);
            }
        });
        
        this.updateVotingProgress();
    }

    submitVote(votedPlayerName, buttonElement) {
        // Disable all vote buttons
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('selected');
        });
        
        buttonElement.classList.add('selected');
        
        this.socket.emit('submit-vote', { 
            roomId: this.roomId, 
            votedPlayer: votedPlayerName 
        }, (response) => {
            if (!response.success) {
                alert('Failed to submit vote: ' + response.error);
                // Re-enable buttons if vote failed
                document.querySelectorAll('.vote-btn').forEach(btn => {
                    btn.disabled = false;
                });
            }
        });
    }

    updateVotingProgress() {
        const votesCount = document.getElementById('online-votes-count');
        const totalVoters = document.getElementById('online-total-voters');
        const votedPlayers = document.getElementById('voted-players');
        
        votesCount.textContent = this.gameState.votes ? this.gameState.votes.length : 0;
        totalVoters.textContent = this.players.length;
        
        // Show who has voted
        const voted = this.players.filter(p => p.hasVoted);
        votedPlayers.innerHTML = voted.length > 0 ? 
            `<small>Voted: ${voted.map(p => p.name).join(', ')}</small>` : '';
    }

    setupImposterGuess() {
        const blufferPlayer = this.players.find(p => p.isBluffer);
        const blufferMessage = document.getElementById('bluffer-message');
        const blufferGuessSection = document.getElementById('bluffer-guess-section');
        const waitingForImposter = document.getElementById('waiting-for-bluffer');
        
        if (this.myRole.isBluffer) {
            blufferMessage.innerHTML = `<p><strong>${this.playerName}</strong>, you survived the voting!</p><p>Guess the secret word to win the game:</p>`;
            blufferGuessSection.style.display = 'block';
            waitingForImposter.style.display = 'none';
            document.getElementById('online-word-guess-input').focus();
        } else {
            blufferMessage.innerHTML = `<p><strong>${blufferPlayer.name}</strong> survived the voting!</p><p>They're trying to guess the secret word...</p>`;
            blufferGuessSection.style.display = 'none';
            waitingForImposter.style.display = 'block';
        }
    }

    submitImposterGuess() {
        const guessInput = document.getElementById('online-word-guess-input');
        const guess = guessInput.value.trim();
        
        if (!guess) {
            alert('Please enter your guess');
            return;
        }
        
        this.socket.emit('submit-bluffer-guess', { 
            roomId: this.roomId, 
            guess: guess 
        }, (response) => {
            if (response.success) {
                guessInput.disabled = true;
                document.getElementById('submit-online-guess-btn').disabled = true;
            } else {
                alert('Failed to submit guess: ' + response.error);
            }
        });
    }

    displayResults() {
        const gameResult = document.getElementById('online-game-result');
        const winnerAnnouncement = document.getElementById('online-winner-announcement');
        const secretWordReveal = document.getElementById('online-secret-word-reveal');
        const blufferReveal = document.getElementById('online-bluffer-reveal');
        const resultsCategory = document.getElementById('online-results-category');
        const votingResults = document.getElementById('online-voting-results');
        
        const blufferPlayer = this.players.find(p => p.isBluffer);
        
        if (this.gameState.winner === 'bluffer') {
            gameResult.textContent = 'Imposter Wins!';
            winnerAnnouncement.textContent = this.gameState.winMessage;
            winnerAnnouncement.className = 'winner-announcement bluffer-wins';
        } else {
            gameResult.textContent = 'Players Win!';
            winnerAnnouncement.textContent = this.gameState.winMessage;
            winnerAnnouncement.className = 'winner-announcement players-win';
        }
        
        secretWordReveal.textContent = this.gameState.word;
        blufferReveal.textContent = blufferPlayer.name;
        resultsCategory.textContent = this.gameState.category;
        
        // Display voting results
        votingResults.innerHTML = '<h4>Voting Results:</h4>';
        if (this.gameState.voteResults) {
            Object.entries(this.gameState.voteResults).forEach(([player, votes]) => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'vote-result';
                resultDiv.innerHTML = `
                    <span>${player}</span>
                    <span>${votes} vote${votes !== 1 ? 's' : ''}</span>
                `;
                votingResults.appendChild(resultDiv);
            });
        }
        
        // Only show reset button for host
        const playAgainBtn = document.getElementById('play-online-again-btn');
        playAgainBtn.style.display = this.isHost ? 'block' : 'none';
    }

    resetGame() {
        if (!this.isHost) return;
        
        this.socket.emit('reset-game', { roomId: this.roomId }, (response) => {
            if (!response.success) {
                alert('Failed to reset game: ' + response.error);
            }
        });
    }

    copyRoomCode() {
        const roomCode = document.getElementById('current-room-code').textContent;
        navigator.clipboard.writeText(roomCode).then(() => {
            const copyBtn = document.getElementById('copy-room-code');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    }

    updateConnectionStatus(status) {
        const indicator = document.getElementById('status-indicator');
        const text = document.getElementById('status-text');
        
        switch (status) {
            case 'connecting':
                indicator.textContent = '🔄';
                text.textContent = 'Connecting...';
                break;
            case 'connected':
                indicator.textContent = '🟢';
                text.textContent = 'Connected';
                break;
            case 'disconnected':
                indicator.textContent = '🔴';
                text.textContent = 'Disconnected';
                break;
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

// Initialize the online game when the page loads
let onlineGame;
document.addEventListener('DOMContentLoaded', () => {
    onlineGame = new OnlineBluffGame();
});

// Make game available globally
window.onlineGame = onlineGame;
