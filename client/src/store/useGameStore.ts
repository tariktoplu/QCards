import { create } from 'zustand';
import type { Socket } from 'socket.io-client'; // Import the Socket type from the library

// --- Reusable Types ---
type Qubit = {
  id: string;
  isFaceDown: boolean;
  state: string | null;
};

type Player = {
  id: string;
  name: string;
  score: number;
};

// --- State & Actions Interfaces ---
export interface GameState {
  gameState: 'connecting' | 'lobby' | 'in-game' | 'game-over';
  socket: typeof Socket | null;
  players: Player[];
  myHand: Qubit[];
  gateCards: any[]; // We can leave this as 'any' for now and detail it later
  targetState: string;
}

interface GameActions {
  setSocket: (socket: typeof Socket | null) => void;
  updateGameState: (newState: Partial<GameState>) => void; // Partial<> means we don't have to send all properties
}

// Combine state and actions into a single store type
type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set) => ({
  // --- STATE (Initial State) ---
  gameState: 'connecting',
  socket: null,
  players: [],
  myHand: [],
  gateCards: [],
  targetState: "",
  
  // --- ACTIONS ---
  setSocket: (socket) => set({ socket }),
  updateGameState: (newState) => set(newState),
}));

export type { GameStore };