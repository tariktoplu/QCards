import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import axios from 'axios';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// --- TYPE DEFINITIONS ---
interface Qubit { id: string; isFaceDown: boolean; state: string | null; }
interface GateCard { id: string; type: 'H' | 'X' | 'Z' | 'I'; }
interface Player { id: string; name: string; score: number; hand: Qubit[]; gateCards: GateCard[]; }
interface Declaration { qubitId: string; declaredState: string; playerId: string; }
interface GameRoom {
  roomId: string;
  players: Player[];
  targetState: string;
  currentTurn: string;
  activeDeclaration: Declaration | null;
  lastMessage: string | null;
  gameState: 'in-game' | 'game-over';
  decks: {
    qubitDeck: Qubit[];
    gateDeck: GateCard[];
  },
  rematchRequestedBy: string[];
  lastMove: { playerId: string; gateCardId: string; qubitId: string; } | null;
}

const gameRooms: { [key: string]: GameRoom } = {};

// --- CONSTANTS & DECK DEFINITIONS ---
const WINNING_SCORE = 5;
const PLAYER_QUBIT_HAND_SIZE = 3;
const PLAYER_GATE_HAND_SIZE = 2;

const FULL_QUBIT_DECK: Qubit[] = Array.from({ length: 20 }, (_, i) => ({
  id: `q${i}_${Math.random()}`,
  isFaceDown: true,
  state: null,
}));

const FULL_GATE_DECK: GateCard[] = [
  { id: 'g1', type: 'H' }, { id: 'g2', type: 'H' }, { id: 'g3', type: 'H' }, { id: 'g4', type: 'H' },
  { id: 'g5', type: 'X' }, { id: 'g6', type: 'X' }, { id: 'g7', type: 'X' }, { id: 'g8', type: 'X' },
  { id: 'g9', type: 'Z' }, { id: 'g10', type: 'Z' }, { id: 'g11', type: 'Z' }, { id: 'g12', type: 'Z' },
  { id: 'g13', type: 'I' }, { id: 'g14', type: 'I' },
];

// --- HELPER FUNCTIONS ---
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function dealFromDeck<T>(deck: T[], amount: number): T[] {
  return deck.splice(0, amount);
}

function resetRoomForRematch(room: GameRoom) {
  room.players.forEach(p => p.score = 0);
  const qubitDeck = shuffle(FULL_QUBIT_DECK);
  const gateDeck = shuffle(FULL_GATE_DECK);
  room.decks = { qubitDeck, gateDeck };
  room.players.forEach(p => {
    p.hand = dealFromDeck(qubitDeck, PLAYER_QUBIT_HAND_SIZE);
    p.gateCards = dealFromDeck(gateDeck, PLAYER_GATE_HAND_SIZE);
    if (p.hand.length > 0) {
      p.hand[0].isFaceDown = false;
      p.hand[0].state = '|0>';
    }
  });
  room.gameState = 'in-game';
  room.activeDeclaration = null;
  room.rematchRequestedBy = [];
  room.lastMove = null;
  room.currentTurn = room.players[0].id;
  room.lastMessage = "Rematch started! Player 1's turn.";
}

async function applyGate(qubitState: string | null, gateType: string): Promise<string | null> {
  try {
    let initialStateForSim: string | null = null;
    if (qubitState === '|0>') initialStateForSim = '0';
    else if (qubitState === '|1>') initialStateForSim = '1';
    const response = await axios.post('http://localhost:8000/simulate', { initial_state: initialStateForSim, gate: gateType });
    return response.data.final_state;
  } catch (error) {
    console.error("[SERVER] Error calling simulation service:", error);
    return "|error>";
  }
}

function checkForWinner(room: GameRoom, io: Server) {
  const winner = room.players.find(p => p.score >= WINNING_SCORE);
  if (winner) {
    room.gameState = 'game-over';
    room.lastMessage = `Game Over! ${winner.name} has won the game!`;
    room.players.forEach(p => {
      io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards });
    });
  }
}

function resolveChallenge(room: GameRoom) {
  if (!room.activeDeclaration) return;
  const { activeDeclaration } = room;
  const declarer = room.players.find(p => p.id === activeDeclaration.playerId);
  const challenger = room.players.find(p => p.id !== activeDeclaration.playerId);
  if (!declarer || !challenger) return;
  const cardInHand = declarer.hand.find(c => c.id === activeDeclaration.qubitId);
  const wasBluffSuccessful = cardInHand?.state === activeDeclaration.declaredState;
  if (wasBluffSuccessful) {
    challenger.score -= 1;
    declarer.score += 2;
    room.lastMessage = `Challenge FAILED! ${declarer.name}'s declaration was correct.`;
  } else {
    challenger.score += 2;
    declarer.score -= 1;
    room.lastMessage = `Challenge SUCCESSFUL! ${declarer.name} was bluffing.`;
  }
  room.currentTurn = challenger.id;
  room.activeDeclaration = null;
  room.lastMove = null;
  room.lastMessage += ` Now it's ${challenger.name}'s turn to play.`;
}

// --- MAIN SERVER LOGIC ---
app.get('/', (req: Request, res: Response) => {
  res.send('Quantum Bluff - Game Server is running!');
});

io.on('connection', (socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  const findRoomBySocketId = (socketId: string) => Object.values(gameRooms).find(r => r.players.some(p => p.id === socketId));

  socket.on('join_game', (playerName: string) => {
    console.log(`${playerName} (${socket.id}) is trying to join a game.`);
    let availableRoomId = Object.keys(gameRooms).find(id => gameRooms[id].players.length === 1 && gameRooms[id].gameState === 'in-game');
    let currentRoom: GameRoom;

    if (availableRoomId) {
      currentRoom = gameRooms[availableRoomId];
      const player2Hand = dealFromDeck(currentRoom.decks.qubitDeck, PLAYER_QUBIT_HAND_SIZE);
      if (player2Hand.length > 0) { player2Hand[0].isFaceDown = false; player2Hand[0].state = '|0>'; }
      const newPlayer: Player = { id: socket.id, name: playerName, score: 0, hand: player2Hand, gateCards: dealFromDeck(currentRoom.decks.gateDeck, PLAYER_GATE_HAND_SIZE) };
      currentRoom.players.push(newPlayer);
      socket.join(currentRoom.roomId);
      currentRoom.lastMessage = `${newPlayer.name} has joined! It's ${currentRoom.players[0].name}'s turn.`;
    } else {
      const roomId = `room_${socket.id}`;
      const qubitDeck = shuffle(FULL_QUBIT_DECK);
      const gateDeck = shuffle(FULL_GATE_DECK);
      const player1Hand = dealFromDeck(qubitDeck, PLAYER_QUBIT_HAND_SIZE);
      if (player1Hand.length > 0) { player1Hand[0].isFaceDown = false; player1Hand[0].state = '|0>'; }
      const newRoom: GameRoom = {
        roomId: roomId,
        gameState: 'in-game',
        decks: { qubitDeck, gateDeck },
        players: [{ id: socket.id, name: playerName, score: 0, hand: player1Hand, gateCards: dealFromDeck(gateDeck, PLAYER_GATE_HAND_SIZE) }],
        targetState: "101",
        currentTurn: socket.id,
        activeDeclaration: null,
        lastMessage: `Welcome ${playerName}! Waiting for another player...`,
        rematchRequestedBy: [],
        lastMove: null,
      };
      gameRooms[roomId] = newRoom;
      currentRoom = newRoom;
      socket.join(roomId);
    }

    currentRoom.players.forEach(player => {
      const stateForPlayer = { ...currentRoom, myHand: player.hand, gateCards: player.gateCards };
      io.to(player.id).emit('gameUpdate', stateForPlayer);
    });
  });

  socket.on('play_and_declare', async (data: { qubitId: string, gateType: string, gateCardId: string, declaredState: string }) => {
    const room = findRoomBySocketId(socket.id);
    if (!room || room.gameState === 'game-over' || room.currentTurn !== socket.id) return;
    const player = room.players.find(p => p.id === socket.id);
    const cardToUpdate = player?.hand.find(card => card.id === data.qubitId);
    if (player && cardToUpdate) {
      player.gateCards = player.gateCards.filter(card => card.id !== data.gateCardId);
      const newGateCards = dealFromDeck(room.decks.gateDeck, 1);
      if (newGateCards.length > 0) { player.gateCards.push(...newGateCards); }
      cardToUpdate.state = await applyGate(cardToUpdate.state, data.gateType);
      room.lastMove = { playerId: socket.id, gateCardId: data.gateCardId, qubitId: data.qubitId };
      room.activeDeclaration = { qubitId: data.qubitId, declaredState: data.declaredState, playerId: socket.id };
      const opponent = room.players.find(p => p.id !== socket.id);
      if (opponent) {
        room.currentTurn = opponent.id;
        room.lastMessage = `${player.name} declared state ${data.declaredState}. It's ${opponent.name}'s turn to respond.`;
      }
      room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
    }
  });

  socket.on('challenge_bluff', () => {
    const room = findRoomBySocketId(socket.id);
    if (!room || room.gameState === 'game-over' || room.currentTurn !== socket.id) return;
    resolveChallenge(room);
    checkForWinner(room, io);
    if (room.gameState === 'in-game') {
      room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
    }
  });

  socket.on('pass_bluff', () => {
    const room = findRoomBySocketId(socket.id);
    if (!room || room.gameState === 'game-over' || room.currentTurn !== socket.id || !room.activeDeclaration) return;
    const declarer = room.players.find(p => p.id === room.activeDeclaration!.playerId);
    if(declarer) {
      declarer.score += 1;
      room.lastMessage = `The opponent passed. ${declarer.name} gets 1 point.`;
    }
    room.currentTurn = socket.id; 
    room.activeDeclaration = null;
    room.lastMove = null;
    room.lastMessage += ` Now it's your turn to play.`;
    checkForWinner(room, io);
    if (room.gameState === 'in-game') {
      room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
    }
  });
  
  socket.on('request_rematch', () => {
    const room = findRoomBySocketId(socket.id);
    if (!room || room.gameState !== 'game-over') return;
    if (!room.rematchRequestedBy.includes(socket.id)) {
      room.rematchRequestedBy.push(socket.id);
    }
    if (room.rematchRequestedBy.length === room.players.length) {
      resetRoomForRematch(room);
    }
    room.players.forEach(p => {
      io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards });
    });
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const room = findRoomBySocketId(socket.id);
    if (room) {
      delete gameRooms[room.roomId];
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});