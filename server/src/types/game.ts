export interface Qubit { id: string; isFaceDown: boolean; state: string | null; }
export interface GateCard { id: string; type: 'H' | 'X' | 'Z' | 'I' | 'CNOT'; }
export interface Player { id: string; name: string; score: number; hand: Qubit[]; gateCards: GateCard[]; }
export interface Declaration { qubitId: string; declaredState: string; playerId: string; }

export interface GameRoom {
  roomId: string;
  players: Player[];
  targetState: string;
  currentTurn: string;
  activeDeclaration: Declaration | null;
  lastMessage: string | null;
  gameState: 'in-game' | 'game-over';
  decks: {
    qubitDeck: Omit<Qubit, 'id'>[];
    gateDeck: Omit<GateCard, 'id'>[];
  };
  rematchRequestedBy: string[];
  lastMove: { playerId: string; gateCardId: string; qubitId: string; } | null;
  revealedCard: { id: string; finalState: string; } | null;
  entangledPair: { controlId: string; targetId: string; } | null;
}