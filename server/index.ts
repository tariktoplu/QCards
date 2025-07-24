import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

// --- TYPE DEFINITIONS for a Type-Safe Environment ---
interface Qubit {
  id: string;
  isFaceDown: boolean;
  state: string | null;
}

interface GateCard {
  id: string;
  type: 'H' | 'X' | 'Z' | 'I';
}

interface Player {
  id: string;
  name: string;
  score: number;
  hand: Qubit[];
  gateCards: GateCard[];
}

interface Declaration {
  qubitId: string;
  declaredState: string;
  playerId: string;
}

interface GameRoom {
  roomId: string;
  players: Player[];
  targetState: string;
  currentTurn: string;
  activeDeclaration: Declaration | null;
  lastMessage: string | null;
}

const gameRooms: { [key: string]: GameRoom } = {};

// --- CARD DECK DEFINITION ---
const FULL_GATE_DECK: GateCard[] = [
  { id: 'g1', type: 'H' }, { id: 'g2', type: 'H' }, { id: 'g3', type: 'X' },
  { id: 'g4', type: 'X' }, { id: 'g5', type: 'Z' }, { id: 'g6', type: 'Z' },
  { id: 'g7', type: 'I' }, { id: 'g8', type: 'I' },
];

// --- HELPER FUNCTIONS ---
function dealGateCards(amount: number): GateCard[] {
  return FULL_GATE_DECK.slice(0, amount).map(card => ({...card, id: `${card.id}_${Math.random()}`}));
}

function applyGate(qubitState: string | null, gateType: string): string | null {
  switch (gateType) {
    case 'X':
      if (qubitState === '|0>') return '|1>';
      if (qubitState === '|1>') return '|0>';
      return qubitState;
    case 'Z':
      return qubitState;
    case 'H':
      if (qubitState === '|0>') return '|+>';
      if (qubitState === '|1>') return '|->';
      return qubitState;
    case 'I':
      return qubitState;
    default:
      return qubitState;
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
  room.currentTurn = declarer.id;
  room.activeDeclaration = null;
}

// --- MAIN SERVER LOGIC ---
app.get('/', (req: Request, res: Response) => {
  res.send('Quantum Bluff - Game Server is running!');
});

io.on('connection', (socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  let availableRoomId = Object.keys(gameRooms).find(id => gameRooms[id].players.length === 1);
  let currentRoom: GameRoom;

  if (availableRoomId) {
    currentRoom = gameRooms[availableRoomId];
    const newPlayer: Player = { 
      id: socket.id, 
      name: `Player ${currentRoom.players.length + 1}`, 
      score: 0, 
      hand: [{ id: 'q3', isFaceDown: false, state: '|1>' }, { id: 'q4', isFaceDown: true, state: null }],
      gateCards: dealGateCards(2)
    };
    currentRoom.players.push(newPlayer);
    socket.join(currentRoom.roomId);
    currentRoom.lastMessage = `${newPlayer.name} has joined! It's ${currentRoom.players[0].name}'s turn.`;
  } else {
    const roomId = `room_${socket.id}`;
    const newRoom: GameRoom = {
      roomId: roomId,
      players: [{ 
        id: socket.id, 
        name: 'Player 1', 
        score: 0, 
        hand: [{ id: 'q1', isFaceDown: false, state: '|0>' }, { id: 'q2', isFaceDown: true, state: null }],
        gateCards: dealGateCards(2)
      }],
      targetState: "101",
      currentTurn: socket.id,
      activeDeclaration: null,
      lastMessage: 'Waiting for another player to join...'
    };
    gameRooms[roomId] = newRoom;
    currentRoom = newRoom;
    socket.join(roomId);
  }

  currentRoom.players.forEach(player => {
    const stateForPlayer = { ...currentRoom, myHand: player.hand, gateCards: player.gateCards };
    io.to(player.id).emit('gameUpdate', stateForPlayer);
  });
  
  const findRoomBySocketId = (socketId: string) => {
    return Object.values(gameRooms).find(r => r.players.some(p => p.id === socketId));
  };

  socket.on('play_and_declare', (data: { qubitId: string, gateType: string, declaredState: string }) => {
    const room = findRoomBySocketId(socket.id);
    if (!room || room.currentTurn !== socket.id) return;
    const { qubitId, gateType, declaredState } = data;
    const player = room.players.find(p => p.id === socket.id);
    const cardToUpdate = player?.hand.find(card => card.id === qubitId);
    if (player && cardToUpdate) {
      cardToUpdate.state = applyGate(cardToUpdate.state, gateType);
      room.activeDeclaration = { qubitId, declaredState, playerId: socket.id };
      const opponent = room.players.find(p => p.id !== socket.id);
      if (opponent) {
        room.currentTurn = opponent.id;
        room.lastMessage = `${player.name} declared state ${declaredState}. It's ${opponent.name}'s turn to respond.`;
      }
      room.players.forEach(p => {
        io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards });
      });
    }
  });

  socket.on('challenge_bluff', () => {
    const room = findRoomBySocketId(socket.id);
    if (!room || room.currentTurn !== socket.id) return;
    resolveChallenge(room);
    room.players.forEach(p => {
      io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards });
    });
  });

  socket.on('pass_bluff', () => {
    const room = findRoomBySocketId(socket.id);
    if (!room || room.currentTurn !== socket.id || !room.activeDeclaration) return;
    const declarer = room.players.find(p => p.id === room.activeDeclaration!.playerId);
    if(declarer) {
      declarer.score += 1;
      room.lastMessage = `${socket.id === declarer.id ? 'You' : 'The opponent'} passed. ${declarer.name} gets 1 point.`;
      room.currentTurn = declarer.id;
    }
    room.activeDeclaration = null;
    room.players.forEach(p => {
      io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards });
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete gameRooms[currentRoom.roomId];
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});