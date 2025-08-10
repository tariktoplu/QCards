import { create } from 'zustand';
import { Socket } from 'socket.io-client';

export type Qubit = { id: string; isFaceDown: boolean; state: string | null; };
export type Player = { id: string; name: string; score: number; hand: Qubit[]; };
export type GateCard = { id: string; type: 'H' | 'X' | 'Z' | 'I' | 'CNOT'; };

export interface GameState {
  gameState: 'lobby' | 'in-game' | 'game-over';
  socket: typeof Socket | null;
  players: Player[];
  myHand: Qubit[];
  gateCards: GateCard[];
  targetState: string;
  currentTurn: string;
  activeDeclaration: { qubitId: string; declaredState: string; playerId: string; } | null;
  lastMessage: string | null;
  rematchRequestedBy: string[];
  lastMove: { playerId: string; gateCardId: string; qubitId: string; } | null;
  revealedCard: { id: string; finalState: string; } | null; // --- NEW ---
}

interface GameActions {
  setSocket: (socket: typeof Socket | null) => void;
  updateGameState: (newState: Partial<GameState>) => void;
  joinGame: (playerName: string) => void;
}

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'lobby',
  socket: null,
  players: [],
  myHand: [],
  gateCards: [],
  targetState: "",
  currentTurn: '',
  activeDeclaration: null,
  lastMessage: null,
  rematchRequestedBy: [],
  lastMove: null,
  revealedCard: null, // --- NEW ---
  setSocket: (socket) => set({ socket }),
  updateGameState: (newState) => set(prevState => ({ ...prevState, ...newState })),
  joinGame: (playerName: string) => {
    const socket = get().socket;
    if (socket && playerName) {
      socket.emit('join_game', playerName);
    }
  },
}));