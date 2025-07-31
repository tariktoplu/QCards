import { GameRoom, Player, Qubit, GateCard } from '../types/game';

// --- CONSTANTS & DECK DEFINITIONS ---
export const WINNING_SCORE = 5;
const PLAYER_QUBIT_HAND_SIZE = 3;
const PLAYER_GATE_HAND_SIZE = 3;

const FULL_QUBIT_DECK: Qubit[] = Array.from({ length: 20 }, (_, i) => ({ id: `q${i}_${Math.random()}`, isFaceDown: true, state: null }));
const FULL_GATE_DECK: GateCard[] = [
    { id: 'g1', type: 'H' }, { id: 'g2', type: 'H' }, { id: 'g3', type: 'X' }, { id: 'g4', type: 'X' },
    { id: 'g5', type: 'Z' }, { id: 'g6', type: 'Z' }, { id: 'g7', type: 'I' }, { id: 'g8', type: 'I' },
    { id: 'g9', type: 'CNOT' }, { id: 'g10', type: 'CNOT' }, { id: 'g11', type: 'CNOT' }, { id: 'g12', type: 'CNOT' },
];

// In-memory storage for our game rooms.
export const gameRooms: { [key: string]: GameRoom } = {};

// --- HELPER FUNCTIONS ---
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function dealFromDeck<T>(deck: T[], amount: number): T[] {
  return deck.splice(0, amount);
}

export function createNewRoom(roomId: string, playerId: string, playerName: string): GameRoom {
    const qubitDeck = shuffle(FULL_QUBIT_DECK);
    const gateDeck = shuffle(FULL_GATE_DECK);
    const player1Hand = dealFromDeck(qubitDeck, PLAYER_QUBIT_HAND_SIZE);
    if (player1Hand.length > 0) { player1Hand[0].isFaceDown = false; player1Hand[0].state = '|0>'; }
    
    return {
      roomId: roomId,
      gameState: 'in-game',
      decks: { qubitDeck, gateDeck },
      players: [{ id: playerId, name: playerName, score: 0, hand: player1Hand, gateCards: dealFromDeck(gateDeck, PLAYER_GATE_HAND_SIZE) }],
      targetState: "101",
      currentTurn: playerId,
      activeDeclaration: null,
      lastMessage: `Welcome ${playerName}! Waiting for another player...`,
      rematchRequestedBy: [],
      lastMove: null,
    };
}

export function addPlayerToRoom(room: GameRoom, playerId: string, playerName: string): Player {
    const player2Hand = dealFromDeck(room.decks.qubitDeck, PLAYER_QUBIT_HAND_SIZE);
    if (player2Hand.length > 0) { player2Hand[0].isFaceDown = false; player2Hand[0].state = '|0>'; }
    const newPlayer: Player = { id: playerId, name: playerName, score: 0, hand: player2Hand, gateCards: dealFromDeck(room.decks.gateDeck, PLAYER_GATE_HAND_SIZE) };
    room.players.push(newPlayer);
    room.lastMessage = `${newPlayer.name} has joined! It's ${room.players[0].name}'s turn.`;
    return newPlayer;
}

export function resetRoomForRematch(room: GameRoom) {
  room.players.forEach(p => p.score = 0);
  const qubitDeck = shuffle(FULL_QUBIT_DECK);
  const gateDeck = shuffle(FULL_GATE_DECK);
  room.decks = { qubitDeck, gateDeck };
  room.players.forEach(p => {
    p.hand = dealFromDeck(qubitDeck, PLAYER_QUBIT_HAND_SIZE);
    p.gateCards = dealFromDeck(gateDeck, PLAYER_GATE_HAND_SIZE);
    if (p.hand.length > 0) { p.hand[0].isFaceDown = false; p.hand[0].state = '|0>'; }
  });
  room.gameState = 'in-game';
  room.activeDeclaration = null;
  room.rematchRequestedBy = [];
  room.lastMove = null;
  room.currentTurn = room.players[0].id;
  room.lastMessage = "Rematch started! Player 1's turn.";
}