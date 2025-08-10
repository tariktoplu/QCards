import axios from 'axios';
import { Server } from 'socket.io';
import { GameRoom } from '../types/game';
import { WINNING_SCORE, dealFromDeck, createHandWithIds } from './state'; // dealFromDeck and createHandWithIds might be needed here

export async function applyGate(
  targetState: string | null,
  gateType: string,
  controlState?: string | null
): Promise<string | null> {
  
  if (gateType === 'CNOT') {
    if (controlState === '|1>') {
      return await applyGate(targetState, 'X');
    }
    return targetState;
  }
  
  try {
    let initialStateForSim: string | null = null;
    if (targetState === '|0>') initialStateForSim = '0';
    else if (targetState === '|1>') initialStateForSim = '1';
    const response = await axios.post('http://localhost:8000/simulate', { initial_state: initialStateForSim, gate: gateType });
    return response.data.final_state;
  } catch (error) {
    console.error("[SERVER] Error calling simulation service:", error);
    return "|error>";
  }
}

export function checkForWinner(room: GameRoom, io: Server) {
  const winner = room.players.find(p => p.score >= WINNING_SCORE);
  if (winner) {
    room.gameState = 'game-over';
    room.lastMessage = `Game Over! ${winner.name} has won the game!`;
  }
}

// --- HEAVILY UPDATED FUNCTION ---
export function resolveChallenge(room: GameRoom) {
  if (!room.activeDeclaration) return;
  const { activeDeclaration } = room;
  const declarer = room.players.find(p => p.id === activeDeclaration.playerId);
  const challenger = room.players.find(p => p.id !== activeDeclaration.playerId);
  if (!declarer || !challenger) return;

  const cardIndex = declarer.hand.findIndex(c => c.id === activeDeclaration.qubitId);
  if (cardIndex === -1) return;

  const challengedCard = declarer.hand[cardIndex];
  let trueState = challengedCard.state;
  let collapseMessage = '';

  // 1. COLLAPSE THE STATE if it's in superposition
  if (trueState === '|+>' || trueState === '|->') {
    // This is the 50/50 coin flip
    const collapsedState = Math.random() < 0.5 ? '|0>' : '|1>'; 
    collapseMessage = `The superposition ${trueState} collapsed to ${collapsedState}!`;
    trueState = collapsedState; // The "true state" is now the result of the collapse
  }

  // 2. DETERMINE THE WINNER of the challenge based on the (potentially collapsed) true state
  const wasDeclarationCorrect = trueState === activeDeclaration.declaredState;

  if (wasDeclarationCorrect) {
    challenger.score -= 1;
    declarer.score += 2;
    room.lastMessage = `Challenge FAILED! ${declarer.name}'s declaration of ${activeDeclaration.declaredState} was correct.`;
  } else {
    challenger.score += 2;
    declarer.score -= 1;
    room.lastMessage = `Challenge SUCCESSFUL! ${declarer.name} was bluffing. The true state was ${trueState}.`;
  }

  if (collapseMessage) {
    room.lastMessage += ` ${collapseMessage}`;
  }

  // 3. REPLACE THE MEASURED CARD
  declarer.hand.splice(cardIndex, 1);
  const newQubitTemplates = dealFromDeck(room.decks.qubitDeck, 1);
  if (newQubitTemplates.length > 0) {
    const newCard = createHandWithIds(newQubitTemplates, 'q')[0];
    newCard.isFaceDown = false;
    newCard.state = '|0>';
    declarer.hand.push(newCard);
    room.lastMessage += ` ${declarer.name} draws a new Qubit card.`;
  }

  // 4. RESET for the next turn
  room.currentTurn = challenger.id;
  room.activeDeclaration = null;
  room.lastMove = null;
  room.lastMessage += ` Now it's ${challenger.name}'s turn.`;
}