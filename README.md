# 🕵️ Imposter Detective - Online Multiplayer Game

A real-time multiplayer bluffing game where players give clues about a secret word while one imposter tries to blend in without knowing what the word is!

## 🎮 Game Overview

**Players:** 4-8 people  
**Game Type:** Real-time online multiplayer  
**Platform:** Web browser  

### How to Play

1. **Setup:** One player creates a room and shares the room code with friends
2. **Join:** Other players join using the room code
3. **Category:** Host selects a category (Movies, Singers, Historical Figures, etc.)
4. **Roles:** One player is secretly assigned as the imposter
5. **Clues:** All players submit clues about the word (imposter must bluff!)
6. **Voting:** Players vote for who they think is the imposter
7. **Finale:** If imposter survives, they get one guess at the secret word
8. **Results:** Imposter wins by surviving + correct guess, or players win by catching them

## 🚀 Quick Start

### Option 1: Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Server:**
   ```bash
   npm start
   ```

3. **Play the Game:**
   - Open http://localhost:3000 in your browser
   - Share the URL with friends to join your game

### Option 2: Development Mode
```bash
npm run dev
```
Uses nodemon for automatic server restarts during development.

## 📁 File Structure

```
killer/
├── server.js           # Node.js server with Socket.IO
├── index.html          # Online multiplayer HTML
├── multiplayer.js      # Client-side WebSocket code
├── main.css           # Styling for both versions
├── package.json       # Dependencies and scripts
├── main.html          # Local multiplayer version
└── main.js            # Local multiplayer JavaScript
```

## 🌐 Deployment Options

### Heroku Deployment

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create Heroku App:**
   ```bash
   heroku create your-imposter-game
   ```

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy Imposter Detective"
   git push heroku main
   ```

4. **Open Your Game:**
   ```bash
   heroku open
   ```

### Railway Deployment

1. **Connect your GitHub repo to Railway**
2. **Railway will auto-deploy** from your repository
3. **Share the generated URL** with friends

### Render Deployment

1. **Connect your GitHub repo to Render**
2. **Set build command:** `npm install`
3. **Set start command:** `npm start`
4. **Deploy and share the URL**

## 🎯 Game Features

### 🎭 Gameplay Mechanics
- **Smart Role Assignment** - Random imposter selection
- **Real-time Synchronization** - All players see updates instantly
- **Anonymous Clue Display** - Clues are shuffled to hide submission order
- **Multiple Win Conditions** - Balanced gameplay for both sides
- **Room System** - Multiple games can run simultaneously

### 🎨 User Experience
- **Beautiful Modern UI** - Gradient design with smooth animations
- **Responsive Design** - Works on desktop and mobile
- **Real-time Status** - See who's submitted clues/votes
- **Connection Monitoring** - Visual connection status indicator
- **Host Controls** - Room management and game flow control

### 🔧 Technical Features
- **WebSocket Communication** - Real-time multiplayer using Socket.IO
- **Room Management** - Isolated game rooms with unique codes
- **State Synchronization** - Game state kept in sync across all clients
- **Disconnection Handling** - Graceful handling of player disconnections
- **Scalable Architecture** - Can handle multiple concurrent games

## 🎪 Game Categories & Words

Each category includes 30+ carefully selected words:

- 🎬 **Movies** - Popular films across all eras
- 🎤 **Singers** - Famous artists and musicians  
- 🏛️ **Historical Figures** - Important people from history
- 🐾 **Animals** - Common and exotic animals
- 🌍 **Countries** - Nations from around the world

## 🛠️ Local vs Online Versions

### Local Multiplayer (`main.html`)
- **Single Device:** All players share one computer/phone
- **Pass & Play:** Device is passed around for secret information
- **No Internet Required:** Works completely offline
- **Quick Setup:** Just open the HTML file

### Online Multiplayer (`index.html`)
- **Multiple Devices:** Each player uses their own device
- **Room Codes:** Join friends using 6-character codes
- **Real-time Updates:** See live progress of clue submission/voting
- **Host Controls:** Room creator manages the game flow

## 🔧 Dependencies

- **express** - Web server framework
- **socket.io** - Real-time WebSocket communication
- **cors** - Cross-origin resource sharing
- **nodemon** - Development auto-restart (dev only)

## 🎨 Customization

### Adding New Categories
Edit the `wordLists` object in both `server.js` and `main.js`:

```javascript
wordLists: {
    // ... existing categories
    newCategory: [
        'Word 1', 'Word 2', 'Word 3'
        // Add 30+ words for best experience
    ]
}
```

### Styling Changes
All visual styling is in `main.css`. Key sections:
- **Color scheme:** Modify CSS custom properties
- **Animations:** Adjust `@keyframes` animations
- **Layout:** Responsive grid and flexbox layouts

### Game Rules
Modify game logic in:
- **Server:** `server.js` - Game room class
- **Client:** `multiplayer.js` - Client game state

## 🐛 Troubleshooting

### Common Issues

**"Room not found" error:**
- Check room code is entered correctly (6 characters)
- Make sure the room host hasn't left

**Connection issues:**
- Check your internet connection
- Try refreshing the page
- Make sure the server is running

**Game stuck in voting:**
- All players must vote to proceed
- Check the voting progress indicator

### Development Issues

**Server won't start:**
```bash
# Install dependencies
npm install

# Check Node.js version (requires Node 14+)
node --version
```

**Socket.IO errors:**
- Make sure server is running before opening client
- Check browser console for error messages

## 📜 License

MIT License - Feel free to use and modify for your own projects!

## 🎉 Credits

Created with ❤️ for fun multiplayer gaming experiences. Perfect for:
- **Party Games** - Friends gathering online or in person
- **Team Building** - Fun icebreaker for remote teams  
- **Family Time** - All-ages entertainment
- **Game Nights** - Add variety to your gaming sessions

---

**Ready to play?** Start your server and create a room to begin the deception! 🕵️‍♀️🕵️‍♂️
