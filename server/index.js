const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// This will store the game state for each connected player
// NOTE: This is in-memory storage. If the server restarts, all game data is lost.
// This is fine for our MVP.
const gameRooms = {};

// A simple function to apply a gate (for now, it's fake logic)
function applyGate(qubitState, gateType) {
  if (gateType === 'X') {
    if (qubitState === '|0>') return '|1>';
    if (qubitState === '|1>') return '|0>';
  }
  // Return original state if gate or state is unknown
  return qubitState;
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create and store the initial game state for this player
  const initialGameState = {
    gameState: 'in-game',
    players: [
      { id: socket.id, name: 'Player 1', score: 0 },
      { id: 'cpu', name: 'Opponent', score: 0 }
    ],
    myHand: [
      { id: 'q1', isFaceDown: false, state: '|0>' },
      { id: 'q2', isFaceDown: true, state: null },
      { id: 'q3', isFaceDown: true, state: null },
    ],
    targetState: "101",
  };
  gameRooms[socket.id] = initialGameState;

  // Send the initial state to the player
  socket.emit('gameUpdate', gameRooms[socket.id]);

  // --- LISTEN FOR PLAYER ACTIONS ---
  socket.on('play_gate', (data) => {
    console.log(`Received 'play_gate' from ${socket.id} with data:`, data);

    const { qubitId, gateType } = data;
    const playerState = gameRooms[socket.id];

    if (!playerState) return; // Safety check

    // Find the card in the player's hand
    const cardToUpdate = playerState.myHand.find(card => card.id === qubitId);

    if (cardToUpdate) {
      // Apply the fake gate logic
      const newState = applyGate(cardToUpdate.state, gateType);
      cardToUpdate.state = newState;
      
      console.log(`Updated qubit ${qubitId} to state ${newState}`);
      
      // --- SEND THE UPDATED GAME STATE BACK TO THE PLAYER ---
      socket.emit('gameUpdate', playerState);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    // Clean up the room data when a player leaves
    delete gameRooms[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});