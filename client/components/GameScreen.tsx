'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import QubitCard from './QubitCard';
import GateCard from './GateCard';
import Scoreboard from './Scoreboard';

export default function GameScreen() {
  const { 
    socket, gameState, myHand, gateCards, players,
    currentTurn, activeDeclaration, lastMessage, rematchRequestedBy, lastMove,
    targetState, revealedCard // Get the revealedCard state
  } = useGameStore();
  
  const myPlayerId = socket?.id;
  const isMyTurn = currentTurn === myPlayerId && !activeDeclaration;
  const opponent = players.find(p => p.id !== myPlayerId);

  const [selectedGate, setSelectedGate] = useState<{id: string, type: string} | null>(null);
  const [controlQubit, setControlQubit] = useState<string | null>(null);
  const [targetQubit, setTargetQubit] = useState<{id: string, name: string} | null>(null);
  const [declarationInput, setDeclarationInput] = useState<string>('|+>');

  // Effect to clear selections when the turn changes, to prevent stale selections
  useEffect(() => {
    setSelectedGate(null);
    setControlQubit(null);
    setTargetQubit(null);
  }, [currentTurn]);

  const handleGateCardClick = (id: string, type: string) => {
    if (!isMyTurn) return;
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
    if (selectedGate.type === 'CNOT') {
      if (!controlQubit && !isOpponentCard) {
        setControlQubit(qubitId);
        return;
      }
      if (controlQubit && controlQubit !== qubitId) {
        setTargetQubit({ id: qubitId, name: qubitName });
        return;
      }
    } 
    else {
      if (isOpponentCard) return;
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
    setTargetQubit(null);
    setSelectedGate(null);
    setControlQubit(null);
  };
  
  const handleChallenge = () => { if (socket) socket.emit('challenge_bluff'); };
  const handlePass = () => { if (socket) socket.emit('pass_bluff'); };
  const handleRequestRematch = () => { if (socket) socket.emit('request_rematch'); };

  const renderActionPanel = () => {
    if (activeDeclaration && currentTurn === myPlayerId) {
        return (
            <div className="mt-4 p-4 bg-slate-700 rounded-lg text-center">
              <h3 className="text-lg font-bold mb-2">Opponent declared state: <span className="text-yellow-300 font-mono">{activeDeclaration.declaredState}</span></h3>
              <p>Do you challenge?</p>
              <div className="flex justify-center space-x-4 mt-2">
                <button onClick={handleChallenge} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Challenge</button>
                <button onClick={handlePass} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Pass</button>
              </div>
            </div>
        );
    }
    if (targetQubit) {
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
    if (!isMyTurn) return "Your Cards"; // Changed for clarity when it's not your turn
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
      {gameState === 'game-over' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center z-50">
          <h1 className="text-6xl font-bold text-yellow-400 mb-4">Game Over</h1>
          <h2 className="text-4xl mb-8">{winner ? `${winner.name} wins!` : "It's a draw!"}</h2>
          {!hasRequestedRematch ? (
            <button onClick={handleRequestRematch} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-2xl">Play Again</button>
          ) : (
            <p className="text-2xl text-gray-300">Waiting for opponent...</p>
          )}
        </div>
      )}
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8">
        <div className="col-span-1">
          <h1 className="text-4xl font-bold text-cyan-400 mb-8">Quantum Bluff</h1>
          <Scoreboard />
          <div className="mt-6 bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Target State</h3>
            <p className="font-mono text-4xl text-yellow-300 tracking-widest">{targetState}</p>
          </div>
          <div className="mt-4 text-lg">
            Turn: <span className={isMyTurn ? "text-green-400 font-bold" : "text-red-400"}>{isMyTurn ? "Your Turn" : "Opponent's Turn"}</span>
          </div>
        </div>
        <div className="col-span-3">
          {lastMessage && <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg mb-4 text-center">{lastMessage}</div>}
          <div className="mb-12 h-56">
            <h2 className="text-xl font-bold text-white mb-4">{opponent ? `${opponent.name}'s Hand` : "Opponent's Hand"}</h2>
            <div className="flex space-x-4">
              {opponent && opponent.hand.map((card, index) => {
                const isRevealed = revealedCard?.id === card.id;
                return (
                  <QubitCard 
                    key={card.id} id={card.id}
                    isFaceDown={!isRevealed}
                    state={isRevealed ? revealedCard.finalState : null}
                    isClickable={isMyTurn && selectedGate?.type === 'CNOT' && !!controlQubit}
                    onClick={() => handleQubitCardClick(card.id, index, true, true)}
                    isHighlighted={lastMove?.playerId === opponent.id && lastMove?.qubitId === card.id} 
                  />
                );
              })}
            </div>
          </div>
          <div className="border-t-2 border-cyan-700 pt-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-4">{isMyTurn ? "1. Select a Gate Card" : "Your Gate Cards"}</h2>
              <div className="flex space-x-4">
                {gateCards.map((card) => (<GateCard key={card.id} id={card.id} type={card.type} isSelected={selectedGate?.id === card.id} onClick={handleGateCardClick} isHighlighted={lastMove?.playerId === myPlayerId && lastMove?.gateCardId === card.id} />))}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-4">{getInstructionText()}</h2>
              <div className="flex space-x-4">
                {myHand.map((card, index) => {
                  const isRevealed = revealedCard?.id === card.id;
                  return (
                    <QubitCard 
                      key={card.id} id={card.id}
                      isFaceDown={isRevealed ? false : card.isFaceDown} 
                      state={isRevealed ? revealedCard.finalState : card.state} 
                      isClickable={isMyTurn && !!selectedGate}
                      isControl={controlQubit === card.id}
                      onClick={() => handleQubitCardClick(card.id, index, false, card.isFaceDown)} 
                      isHighlighted={lastMove?.playerId === myPlayerId && lastMove?.qubitId === card.id} 
                    />
                  );
                })}
              </div>
            </div>
            {renderActionPanel()}
          </div>
        </div>
      </div>
    </main>
  );
}