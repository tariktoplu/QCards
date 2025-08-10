import { GameRoom, Player, Qubit, GateCard } from '../types/game';

// --- CONSTANTS & DECK DEFINITIONS ---
export const WINNING_SCORE = 10;
export const PLAYER_QUBIT_HAND_SIZE = 3;
export const PLAYER_GATE_HAND_SIZE = 2; // GDD: Each player draws 2 gate cards
export const STARTING_BLUFF_TOKENS = 2;
export const MAX_ROUNDS = 10; // Game ends after 10 total rounds (5 per player)
export const TURN_TIMER_SECONDS = 30;

const FULL_QUBIT_DECK_TEMPLATE: Omit<Qubit, 'id'>[] = Array.from({ length: 20 }, () => ({
  isFaceDown: true, state: '|0>',
}));
const FULL_GATE_DECK_TEMPLATE: Omit<GateCard, 'id'>[] = [
    { type: 'H' }, { type: 'H' }, { type: 'X' }, { type: 'X' }, { type: 'Z' },
    { type: 'Z' }, { type: 'I' }, { type: 'I' }, { type: 'CNOT' }, { type: 'CNOT' },
];

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
export function createHandWithIds<T extends {}>(cards: T[], prefix: string): (T & { id: string })[] {
  return cards.map((card) => ({ ...card, id: `${prefix}_${Date.now()}_${Math.random()}` }));
}

export function createNewRoom(roomId: string, playerId: string, playerName: string): GameRoom {
    const qubitDeck = shuffle(FULL_QUBIT_DECK_TEMPLATE);
    const gateDeck = shuffle(FULL_GATE_DECK_TEMPLATE);
    const player1QubitTemplates = dealFromDeck(qubitDeck, PLAYER_QUBIT_HAND_SIZE);
    const player1GateTemplates = dealFromDeck(gateDeck, PLAYER_GATE_HAND_SIZE);
    const player1Hand = createHandWithIds(player1QubitTemplates, 'q');
    if (player1Hand.length > 0) { player1Hand[0].isFaceDown = false; }
    
    return {
      roomId: roomId, gameState: 'in-game', decks: { qubitDeck, gateDeck },
      players: [{
          id: playerId, name: playerName, score: 0, hand: player1Hand,
          gateCards: createHandWithIds(player1GateTemplates, 'g'),
          bluffTokens: STARTING_BLUFF_TOKENS
      }],
      targetState: "101", currentTurn: playerId, activeDeclaration: null,
      lastMessage: `Welcome ${playerName}! Waiting for another player...`,
      rematchRequestedBy: [], lastMove: null, revealedCard: null, entangledPair: null,
      round: 1, maxRounds: MAX_ROUNDS, timer: TURN_TIMER_SECONDS,
    };
}

export function addPlayerToRoom(room: GameRoom, playerId: string, playerName: string): Player {
    const player2QubitTemplates = dealFromDeck(room.decks.qubitDeck, PLAYER_QUBIT_HAND_SIZE);
    const player2GateTemplates = dealFromDeck(room.decks.gateDeck, PLAYER_GATE_HAND_SIZE);
    const player2Hand = createHandWithIds(player2QubitTemplates, 'q');
    if (player2Hand.length > 0) { player2Hand[0].isFaceDown = false; }
    const newPlayer: Player = {
        id: playerId, name: playerName, score: 0, hand: player2Hand,
        gateCards: createHandWithIds(player2GateTemplates, 'g'),
        bluffTokens: STARTING_BLUFF_TOKENS
    };
    room.players.push(newPlayer);
    room.lastMessage = `${newPlayer.name} has joined! It's ${room.players[0].name}'s turn.`;
    return newPlayer;
}

export function resetRoomForRematch(room: GameRoom) {
  room.players.forEach(p => { p.score = 0; p.bluffTokens = STARTING_BLUFF_TOKENS; });
  const qubitDeck = shuffle(FULL_QUBIT_DECK_TEMPLATE);
  const gateDeck = shuffle(FULL_GATE_DECK_TEMPLATE);
  room.decks = { qubitDeck, gateDeck };
  room.players.forEach(p => {
    p.hand = createHandWithIds(dealFromDeck(qubitDeck, PLAYER_QUBIT_HAND_SIZE), 'q');
    p.gateCards = createHandWithIds(dealFromDeck(gateDeck, PLAYER_GATE_HAND_SIZE), 'g');
    if (p.hand.length > 0) { p.hand[0].isFaceDown = false; }
  });
  room.gameState = 'in-game'; room.activeDeclaration = null; room.rematchRequestedBy = [];
  room.lastMove = null; room.revealedCard = null; room.entangledPair = null;
  room.currentTurn = room.players[0].id; room.round = 1; room.timer = TURN_TIMER_SECONDS;
  room.lastMessage = "Rematch started! Player 1's turn.";
}