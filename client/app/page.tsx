'use client'; 

import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import QubitCard from '../components/QubitCard';
import GateCard from '../components/GateCard';
import SocketManager from '../components/SocketManager';

export default function GamePage() {
  const { 
    socket, 
    gameState, 
    myHand,
    gateCards,
    targetState, 
    currentTurn, 
    activeDeclaration,
    lastMessage
  } = useGameStore();
  
  const myPlayerId = socket?.id;
  const isMyTurn = currentTurn === myPlayerId && !activeDeclaration;

  const [selectedGate, setSelectedGate] = useState<{id: string, type: string} | null>(null);
  const [declarationInput, setDeclarationInput] = useState<string>('|+>');
  const [qubitToDeclare, setQubitToDeclare] = useState<string | null>(null);

  const handleGateCardClick = (id: string, type: string) => {
    if (!isMyTurn) return;
    if (selectedGate && selectedGate.id === id) {
      setSelectedGate(null);
    } else {
      setSelectedGate({ id, type });
    }
  };
  
  const handlePlayQubit = (qubitId: string) => {
    if (!isMyTurn || !selectedGate) return;
    setQubitToDeclare(qubitId);
  };

  const handleDeclareState = () => {
    if (!socket || !qubitToDeclare || !selectedGate) return;
    socket.emit('play_and_declare', {
      qubitId: qubitToDeclare,
      gateType: selectedGate.type,
      declaredState: declarationInput
    });
    setQubitToDeclare(null);
    setSelectedGate(null);
  };

  const handleChallenge = () => {
    if (!socket) return;
    socket.emit('challenge_bluff');
  };

  const handlePass = () => {
    if (!socket) return;
    socket.emit('pass_bluff');
  };

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
    if (qubitToDeclare) {
      return (
        <div className="mt-4 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Declare new state for Qubit <span className="text-cyan-300">{qubitToDeclare}</span></h3>
          <input 
            type="text"
            value={declarationInput}
            onChange={(e) => setDeclarationInput(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 mr-2"
          />
          <button onClick={handleDeclareState} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Declare</button>
        </div>
      );
    }
    return null;
  };
  
  return (
    <>
      <SocketManager /> 
      <main className="bg-slate-900 min-h-screen text-white p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-cyan-400">Quantum Bluff</h1>
            <div className="text-lg">
              Turn: <span className={isMyTurn ? "text-green-400 font-bold" : "text-red-400"}>{isMyTurn ? "Your Turn" : "Opponent's Turn"}</span>
            </div>
          </div>
          
          {lastMessage && <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg mb-4 text-center">{lastMessage}</div>}

          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Opponent</h2>
          </div>

          <div className="border-t-2 border-cyan-700 pt-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-4">{isMyTurn ? "1. Select a Gate Card" : "Your Gate Cards"}</h2>
              <div className="flex space-x-4">
                {gateCards.map((card) => (
                  <GateCard 
                    key={card.id}
                    id={card.id}
                    type={card.type}
                    isSelected={selectedGate?.id === card.id}
                    onClick={handleGateCardClick}
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white mb-4">{isMyTurn && selectedGate ? "2. Select a Qubit Card to Apply" : "Your Qubits"}</h2>
              <div className="flex space-x-4">
                {myHand.map((card) => (
                  <QubitCard 
                    key={card.id}
                    id={card.id}
                    isFaceDown={card.isFaceDown}
                    state={card.state}
                    onClick={handlePlayQubit}
                  />
                ))}
              </div>
            </div>
            
            {renderActionPanel()}
          </div>
        </div>
      </main>
    </>
  );
}