import { Server } from 'socket.io';
import { GameRoom, Player } from '../types/game';
import { WINNING_SCORE, dealFromDeck, createHandWithIds } from './state';
import axios from 'axios';

export async function applyGate(targetState: string | null, gateType: string, controlState?: string | null): Promise<string | null> {
    if (gateType === 'CNOT') {
        if (controlState === '|1>') return await applyGate(targetState, 'X');
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

export function checkForWinner(room: GameRoom): boolean {
  if (room.round > room.maxRounds) {
    room.gameState = 'game-over';
    const winner = room.players.reduce((p1, p2) => p1.score > p2.score ? p1 : p2);
    room.lastMessage = `Max rounds reached! ${winner.name} wins with the highest score!`;
    return true;
  }
  const winnerByScore = room.players.find(p => p.score >= WINNING_SCORE);
  if (winnerByScore) {
    room.gameState = 'game-over';
    room.lastMessage = `Game Over! ${winnerByScore.name} has won the game!`;
    return true;
  }
  return false;
}

export function checkTargetStateBonus(player: Player, room: GameRoom): boolean {
    const faceUpStates = player.hand
        .filter(card => !card.isFaceDown && (card.state === '|0>' || card.state === '|1>'))
        .map(card => card.state!.charAt(1));
    const currentStateString = faceUpStates.join('');
    if (room.targetState && currentStateString.includes(room.targetState)) {
        player.score += 3;
        room.lastMessage = `BONUS! ${player.name} achieved the target state of ${room.targetState} and gets +3 points!`;
        return true;
    }
    return false;
}

export function resolveChallenge(room: GameRoom) {
  if (!room.activeDeclaration) return;
  const { activeDeclaration } = room;
  const declarer = room.players.find(p => p.id === activeDeclaration.playerId);
  const challenger = room.players.find(p => p.id !== activeDeclaration.playerId);
  if (!declarer || !challenger) return;
  
  if (room.entangledPair && (activeDeclaration.qubitId === room.entangledPair.controlId || activeDeclaration.qubitId === room.entangledPair.targetId)) {
    const cnotPlayer = declarer;
    const otherPlayer = challenger;
    const controlCard = cnotPlayer.hand.find(c => c.id === room.entangledPair!.controlId);
    let targetCard = cnotPlayer.hand.find(c => c.id === room.entangledPair!.targetId) || otherPlayer.hand.find(c => c.id === room.entangledPair!.targetId);
    if (controlCard && targetCard) {
        const collapseResult = Math.random() < 0.5 ? '|0>' : '|1>';
        controlCard.state = collapseResult;
        targetCard.state = collapseResult;
        room.lastMessage = `ENTANGLEMENT! Both cards collapsed to ${collapseResult}!`;
        cnotPlayer.score += 3;
        const cardToRemoveOwner = declarer.hand.some(c => c.id === activeDeclaration.qubitId) ? declarer : challenger;
        const idxToRemove = cardToRemoveOwner.hand.findIndex(c => c.id === activeDeclaration.qubitId);
        if (idxToRemove > -1) cardToRemoveOwner.hand.splice(idxToRemove, 1);
        const newCards = dealFromDeck(room.decks.qubitDeck, 1);
        if (newCards.length > 0) {
          const newCard = createHandWithIds(newCards, 'q')[0];
          newCard.isFaceDown = false; newCard.state = '|0>';
          cardToRemoveOwner.hand.push(newCard);
        }
        room.currentTurn = challenger.id;
        room.activeDeclaration = null;
        room.lastMove = null;
        room.entangledPair = null;
        return;
    }
  }

  const cardIndex = declarer.hand.findIndex(c => c.id === activeDeclaration.qubitId);
  if (cardIndex === -1) return;
  const challengedCard = declarer.hand[cardIndex];
  let trueState = challengedCard.state;
  let collapseMessage = '';
  if (trueState === '|+>' || trueState === '|->') {
    const collapsedState = Math.random() < 0.5 ? '|0>' : '|1>';
    collapseMessage = `Superposition collapsed to ${collapsedState}!`;
    trueState = collapsedState;
  }
  room.revealedCard = { id: challengedCard.id, finalState: trueState! };
  const wasDeclarationCorrect = trueState === activeDeclaration.declaredState;

  if (wasDeclarationCorrect) {
    challenger.score -= 1;
    declarer.score += 1;
    room.lastMessage = `Challenge FAILED! ${declarer.name}'s declaration was correct.`;
  } else {
    challenger.score += 2;
    if (activeDeclaration.usedBluffToken) { declarer.score -= 2; }
    room.lastMessage = `Challenge SUCCESSFUL! ${declarer.name} was bluffing.`;
  }
  
  if (collapseMessage) { room.lastMessage += ` ${collapseMessage}`; }
  declarer.hand.splice(cardIndex, 1);
  const newQubitTemplates = dealFromDeck(room.decks.qubitDeck, 1);
  if (newQubitTemplates.length > 0) {
    const newCard = createHandWithIds(newQubitTemplates, 'q')[0];
    newCard.isFaceDown = false; newCard.state = '|0>';
    declarer.hand.push(newCard);
    room.lastMessage += ` ${declarer.name} draws a new Qubit card.`;
  }
  room.currentTurn = challenger.id;
  room.activeDeclaration = null;
  room.lastMove = null;
  room.lastMessage += ` Now it's ${challenger.name}'s turn.`;
}