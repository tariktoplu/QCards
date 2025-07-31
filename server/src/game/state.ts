import { GameRoom, Player, Qubit, GateCard } from '../types/game';

// --- CONSTANTS & DECK DEFINITIONS ---
export const WINNING_SCORE = 5;
const PLAYER_QUBIT_HAND_SIZE = 3;
const PLAYER_GATE_HAND_SIZE = 3;

// Create "template" decks. They don't need any ID at all.
const FULL_QUBIT_DECK_TEMPLATE: Omit<Qubit, 'id'>[] = Array.from({ length: 20 }, () => ({
  isFaceDown: true,
  state: null,
}));

const FULL_GATE_DECK_TEMPLATE: Omit<GateCard, 'id'>[] = [
    { type: 'H' }, { type: 'H' }, { type: 'X' }, { type: 'X' },
    { type: 'Z' }, { type: 'Z' }, { type: 'I' }, { type: 'I' },
    { type: 'CNOT' }, { type: 'CNOT' }, { type: 'CNOT' }, { type: 'CNOT' },
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

// dealFromDeck is now simpler, it just takes items from the deck.
export function dealFromDeck<T>(deck: T[], amount: number): T[] {
  return deck.splice(0, amount);
}

// createHandWithIds is now the ONLY place where IDs are created.
export function createHandWithIds<T extends {}>(cards: T[], prefix: string): (T & { id: string })[] {
    return cards.map((card, i) => ({
        ...card,
        id: `${prefix}_${Date.now()}_${Math.random()}` // A guaranteed unique ID
    }));
}

export function createNewRoom(roomId: string, playerId: string, playerName: string): GameRoom {
    const qubitDeck = shuffle(FULL_QUBIT_DECK_TEMPLATE);
    const gateDeck = shuffle(FULL_GATE_DECK_TEMPLATE);
    
    const player1QubitTemplates = dealFromDeck(qubitDeck, PLAYER_QUBIT_HAND_SIZE);
    const player1GateTemplates = dealFromDeck(gateDeck, PLAYER_GATE_HAND_SIZE);

    const player1Hand = createHandWithIds(player1QubitTemplates, 'q');
    if (player1Hand.length > 0) { player1Hand[0].isFaceDown = false; player1Hand[0].state = '|0>'; }
    
    return {
      roomId: roomId,
      gameState: 'in-game',
      decks: { qubitDeck, gateDeck },
      players: [{ 
          id: playerId, 
          name: playerName, 
          score: 0, 
          hand: player1Hand, 
          gateCards: createHandWithIds(player1GateTemplates, 'g') 
      }],
      targetState: "101",
      currentTurn: playerId,
      activeDeclaration: null,
      lastMessage: `Welcome ${playerName}! Waiting for another player...`,
      rematchRequestedBy: [],
      lastMove: null,
    };
}

export function addPlayerToRoom(room: GameRoom, playerId: string, playerName: string): Player {
    const player2QubitTemplates = dealFromDeck(room.decks.qubitDeck, PLAYER_QUBIT_HAND_SIZE);
    const player2GateTemplates = dealFromDeck(room.decks.gateDeck, PLAYER_GATE_HAND_SIZE);
    
    const player2Hand = createHandWithIds(player2QubitTemplates, 'q');
    if (player2Hand.length > 0) { player2Hand[0].isFaceDown = false; player2Hand[0].state = '|0>'; }

    const newPlayer: Player = { 
        id: playerId, 
        name: playerName, 
        score: 0, 
        hand: player2Hand, 
        gateCards: createHandWithIds(player2GateTemplates, 'g') 
    };
    room.players.push(newPlayer);
    room.lastMessage = `${newPlayer.name} has joined! It's ${room.players[0].name}'s turn.`;
    return newPlayer;
}


export function resetRoomForRematch(room: GameRoom) {
  room.players.forEach(p => p.score = 0);
  const qubitDeck = shuffle(FULL_QUBIT_DECK_TEMPLATE);
  const gateDeck = shuffle(FULL_GATE_DECK_TEMPLATE);
  room.decks = { qubitDeck, gateDeck };
  
  room.players.forEach(p => {
    const qubitTemplates = dealFromDeck(qubitDeck, PLAYER_QUBIT_HAND_SIZE);
    const gateTemplates = dealFromDeck(gateDeck, PLAYER_GATE_HAND_SIZE);
    p.hand = createHandWithIds(qubitTemplates, 'q');
    p.gateCards = createHandWithIds(gateTemplates, 'g');
    if (p.hand.length > 0) { p.hand[0].isFaceDown = false; p.hand[0].state = '|0>'; }
  });

  room.gameState = 'in-game';
  room.activeDeclaration = null;
  room.rematchRequestedBy = [];
  room.lastMove = null;
  room.currentTurn = room.players[0].id;
  room.lastMessage = "Rematch started! Player 1's turn.";
}