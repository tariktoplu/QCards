'use client';

import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import QubitCard from './QubitCard';
import GateCard from './GateCard';
import Scoreboard from './Scoreboard';

export default function GameScreen() {
  const { 
    socket, gameState, myHand, gateCards, players,
    currentTurn, activeDeclaration, lastMessage, rematchRequestedBy, lastMove
  } = useGameStore();
  
  const myPlayerId = socket?.id;
  const isMyTurn = currentTurn === myPlayerId && !activeDeclaration;
  const opponent = players.find(p => p.id !== myPlayerId);

  // --- NEW STATES FOR CNOT INTERACTION ---
  const [selectedGate, setSelectedGate] = useState<{id: string, type: string} | null>(null);
  const [controlQubit, setControlQubit] = useState<string | null>(null); // Stores the ID of the control qubit
  const [targetQubit, setTargetQubit] = useState<{id: string, name: string} | null>(null);
  const [declarationInput, setDeclarationInput] = useState<string>('|+>');

  // --- UPDATED EVENT HANDLERS ---
  const handleGateCardClick = (id: string, type: string) => {
    if (!isMyTurn) return;
    // Reset selections when a new gate is chosen
    setControlQubit(null);
    setTargetQubit(null);
    if (selectedGate && selectedGate.id === id) {
      setSelectedGate(null);
    } else {
      setSelectedGate({ id, type });
    }
  };
  
  const handleQubitCardClick = (qubitId: string, index: number, isOpponentCard: boolean, isFaceDown: boolean) => {
    if (!isMyTurn || !selectedGate || (isFaceDown && !isOpponentCard)) return;

    const qubitName = `${isOpponentCard ? "Opponent's" : "Your"} Qubit ${index + 1}`;

    // CNOT Logic
    if (selectedGate.type === 'CNOT') {
      // 1. Selecting the Control Qubit (must be your own card and face-up)
      if (!controlQubit && !isOpponentCard) {
        setControlQubit(qubitId);
        return;
      }
      // 2. Selecting the Target Qubit (can be any card, but not the control card)
      if (controlQubit && controlQubit !== qubitId) {
        setTargetQubit({ id: qubitId, name: qubitName });
        return;
      }
    } 
    // Single-Qubit Gate Logic
    else {
      if (isOpponentCard) return; // Cannot target opponent with single-qubit gates
      setTargetQubit({ id: qubitId, name: qubitName });
    }
  };

  const handleDeclareState = () => {
    if (!socket || !targetQubit || !selectedGate) return;

    const payload: any = {
      gateCardId: selectedGate.id,
      gateType: selectedGate.type,
      targetQubitId: targetQubit.id,
      declaredState: declarationInput,
    };

    if (selectedGate.type === 'CNOT' && controlQubit) {
      payload.controlQubitId = controlQubit;
    }

    socket.emit('play_and_declare', payload);
    
    // Reset all temporary states
    setTargetQubit(null);
    setSelectedGate(null);
    setControlQubit(null);
  };
  
  const handleChallenge = () => { if (socket) socket.emit('challenge_bluff'); };
  const handlePass = () => { if (socket) socket.emit('pass_bluff'); };
  const handleRequestRematch = () => { if (socket) socket.emit('request_rematch'); };

  const renderActionPanel = () => {
    if (activeDeclaration && currentTurn === myPlayerId) { /* ... (no change) ... */ }
    if (targetQubit) { // Show panel when a target is selected
      return (
        <div className="mt-4 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Declare new state for Target: <span className="text-cyan-300">{targetQubit.name}</span></h3>
          <input type="text" value={declarationInput} onChange={(e) => setDeclarationInput(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 mr-2" />
          <button onClick={handleDeclareState} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Declare</button>
        </div>
      );
    }
    return null;
  };
  
  const getInstructionText = () => {
    if (!isMyTurn) return "Opponent's Turn";
    if (!selectedGate) return "1. Select a Gate Card";
    if (selectedGate.type === 'CNOT') {
      if (!controlQubit) return "2. Select YOUR face-up Qubit as CONTROL";
      return "3. Select ANY Qubit as TARGET";
    }
    return "2. Select YOUR face-up Qubit to Apply Gate";
  };
  
  const winner = gameState === 'game-over' ? players.find(p => p.score >= 5) : null;
  const hasRequestedRematch = myPlayerId ? rematchRequestedBy.includes(myPlayerId) : false;

  return (
    <main className="bg-slate-900 min-h-screen text-white p-8 font-sans relative">
      {/* Game Over Overlay (no change) */}
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8">
        <div className="col-span-1">{/* Scoreboard Panel (no change) */}</div>
        <div className="col-span-3">
          {lastMessage && <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg mb-4 text-center">{lastMessage}</div>}
          <div className="mb-12 h-56">
            <h2 className="text-xl font-bold text-white mb-4">{opponent ? `${opponent.name}'s Hand` : "Opponent's Hand"}</h2>
            <div className="flex space-x-4">
              {opponent && opponent.hand.map((card, index) => (
                <QubitCard 
                  key={card.id} id={card.id} isFaceDown={true} 
                  isClickable={isMyTurn && selectedGate?.type === 'CNOT' && !!controlQubit}
                  onClick={() => handleQubitCardClick(card.id, index, true, true)}
                  isHighlighted={lastMove?.playerId === opponent.id && lastMove?.qubitId === card.id} 
                />
              ))}
            </div>
          </div>
          <div className="border-t-2 border-cyan-700 pt-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-4">{getInstructionText()}</h2>
              <div className="flex space-x-4">
                {gateCards.map((card) => (<GateCard key={card.id} id={card.id} type={card.type} isSelected={selectedGate?.id === card.id} onClick={handleGateCardClick} isHighlighted={lastMove?.playerId === myPlayerId && lastMove?.gateCardId === card.id} />))}
              </div>
            </div>
            <div>
              <div className="flex space-x-4">
                {myHand.map((card, index) => (
                  <QubitCard 
                    key={card.id} id={card.id} isFaceDown={card.isFaceDown} state={card.state} 
                    isClickable={isMyTurn && !!selectedGate}
                    isControl={controlQubit === card.id}
                    onClick={() => handleQubitCardClick(card.id, index, false, card.isFaceDown)} 
                    isHighlighted={lastMove?.playerId === myPlayerId && lastMove?.qubitId === card.id} 
                  />
                ))}
              </div>
            </div>
            {renderActionPanel()}
          </div>
        </div>
      </div>
    </main>
  );
}