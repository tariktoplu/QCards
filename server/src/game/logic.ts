import axios from 'axios';
import { Server } from 'socket.io';
import { GameRoom } from '../types/game';
import { WINNING_SCORE } from './state';

export async function applyGate(
  targetState: string | null,
  gateType: string,
  controlState?: string | null
): Promise<string | null> {
  
  // CNOT logic is handled first
  if (gateType === 'CNOT') {
    // If the control qubit is |1>, it flips the target. Otherwise, no change.
    if (controlState === '|1>') {
      // A CNOT is effectively a controlled-X gate. We can reuse the X gate simulation.
      console.log(`[LOGIC] CNOT control is |1>. Applying X to target.`);
      return await applyGate(targetState, 'X');
    }
    console.log(`[LOGIC] CNOT control is not |1>. Target state unchanged.`);
    return targetState;
  }
  
  // Existing single-qubit gate logic (no changes here)
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

export function resolveChallenge(room: GameRoom) {
  if (!room.activeDeclaration) return;
  const { activeDeclaration } = room;
  const declarer = room.players.find(p => p.id === activeDeclaration.playerId);
  const challenger = room.players.find(p => p.id !== activeDeclaration.playerId);
  if (!declarer || !challenger) return;

  const cardIndex = declarer.hand.findIndex(c => c.id === activeDeclaration.qubitId);
  if (cardIndex === -1) return;

  // This logic will be expanded in the next step
  const challengedCard = declarer.hand[cardIndex];
  let trueState = challengedCard.state;

  const wasBluffSuccessful = trueState === activeDeclaration.declaredState;
  if (wasBluffSuccessful) {
    challenger.score -= 1;
    declarer.score += 2;
    room.lastMessage = `Challenge FAILED! ${declarer.name}'s declaration was correct.`;
  } else {
    challenger.score += 2;
    declarer.score -= 1;
    room.lastMessage = `Challenge SUCCESSFUL! ${declarer.name} was bluffing. The true state was ${trueState}.`;
  }
  
  room.currentTurn = challenger.id;
  room.activeDeclaration = null;
  room.lastMove = null;
  room.lastMessage += ` Now it's ${challenger.name}'s turn.`;
}