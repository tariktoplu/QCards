import { create } from 'zustand';
import { Socket } from 'socket.io-client';

// --- Reusable Types ---
export type Qubit = { id: string; isFaceDown: boolean; state: string | null; };
export type GateCard = { id: string; type: 'H' | 'X' | 'Z' | 'I' | 'CNOT'; };
export interface Player {
  id: string; name: string; score: number;
  hand: Qubit[]; gateCards: GateCard[];
  bluffTokens: number;
}
export interface Declaration {
  qubitId: string; declaredState: string;
  playerId: string; usedBluffToken: boolean;
}

// --- State & Actions Interfaces ---
export interface GameState {
  gameState: 'lobby' | 'in-game' | 'game-over';
  socket: typeof Socket | null;
  players: Player[];
  myHand: Qubit[];
  gateCards: GateCard[];
  targetState: string;
  currentTurn: string;
  activeDeclaration: Declaration | null;
  lastMessage: string | null;
  rematchRequestedBy: string[];
  lastMove: { playerId: string; gateCardId: string; qubitId: string; } | null;
  revealedCard: { id: string; finalState: string; } | null;
  entangledPair: { controlId: string; targetId: string; } | null;
  round: number;
  maxRounds: number;
  timer: number;
}

interface GameActions {
  setSocket: (socket: typeof Socket | null) => void;
  updateGameState: (newState: Partial<GameState>) => void;
  joinGame: (playerName: string) => void;
  setTimer: (time: number) => void; // Action to update timer from socket tick
}

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'lobby', socket: null, players: [], myHand: [],
  gateCards: [], targetState: "", currentTurn: '', activeDeclaration: null,
  lastMessage: null, rematchRequestedBy: [], lastMove: null,
  revealedCard: null, entangledPair: null, round: 0, maxRounds: 0, timer: 0,
  
  setSocket: (socket) => set({ socket }),
  updateGameState: (newState) => set(prevState => ({ ...prevState, ...newState })),
  joinGame: (playerName: string) => {
    const socket = get().socket;
    if (socket && playerName) {
      socket.emit('join_game', playerName);
    }
  },
  setTimer: (time: number) => set({ timer: time }),
}));