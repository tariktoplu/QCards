import { create } from 'zustand';
import { Socket } from 'socket.io-client';

// --- Reusable Types ---
export type Qubit = { id: string; isFaceDown: boolean; state: string | null; };
export type Player = { id: string; name: string; score: number; hand: Qubit[]; };
export type GateCard = { id: string; type: 'H' | 'X' | 'Z' | 'I'; };

// --- State & Actions Interfaces ---
export interface GameState {
  gameState: 'connecting' | 'lobby' | 'in-game' | 'game-over';
  socket: Socket | null;
  players: Player[];
  myHand: Qubit[];
  gateCards: GateCard[];
  targetState: string;
  currentTurn: string;
  activeDeclaration: { qubitId: string; declaredState: string; playerId: string; } | null;
  lastMessage: string | null;
  rematchRequestedBy: string[];
  lastMove: { playerId: string; gateCardId: string; qubitId: string; } | null;
}

interface GameActions {
  setSocket: (socket: Socket | null) => void;
  updateGameState: (newState: Partial<GameState>) => void;
}

type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set) => ({
  // --- STATE (Initial State) ---
  gameState: 'connecting',
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
  
  // --- ACTIONS ---
  setSocket: (socket) => set({ socket }),
  updateGameState: (newState) => set(prevState => ({ ...prevState, ...newState })),
}));