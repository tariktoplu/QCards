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

  const [selectedGate, setSelectedGate] = useState<{id: string, type: string} | null>(null);
  const [declarationInput, setDeclarationInput] = useState<string>('|+>');
  const [qubitToDeclare, setQubitToDeclare] = useState<{id: string, name: string} | null>(null);

  const handleGateCardClick = (id: string, type: string) => {
    if (!isMyTurn) return;
    if (selectedGate && selectedGate.id === id) setSelectedGate(null);
    else setSelectedGate({ id, type });
  };
  
  const handlePlayQubit = (qubitId: string, index: number) => {
    if (!isMyTurn || !selectedGate) return;
    setQubitToDeclare({ id: qubitId, name: `Qubit ${index + 1}` });
  };

  const handleDeclareState = () => {
    if (!socket || !qubitToDeclare || !selectedGate) return;
    socket.emit('play_and_declare', {
      targetQubitId: qubitToDeclare.id,
      gateType: selectedGate.type,
      gateCardId: selectedGate.id,
      declaredState: declarationInput
    });
    setQubitToDeclare(null);
    setSelectedGate(null);
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
    if (qubitToDeclare) {
      return (
        <div className="mt-4 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-lg font-bold mb-2">Declare new state for <span className="text-cyan-300">{qubitToDeclare.name}</span></h3>
          <input type="text" value={declarationInput} onChange={(e) => setDeclarationInput(e.target.value)} className="bg-slate-800 border border-slate-600 rounded px-2 py-1 mr-2" />
          <button onClick={handleDeclareState} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Declare</button>
        </div>
      );
    }
    return null;
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
          <div className="mt-4 text-lg">
            Turn: <span className={isMyTurn ? "text-green-400 font-bold" : "text-red-400"}>{isMyTurn ? "Your Turn" : "Opponent's Turn"}</span>
          </div>
        </div>
        <div className="col-span-3">
          {lastMessage && <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg mb-4 text-center">{lastMessage}</div>}
          <div className="mb-12 h-56">
            <h2 className="text-xl font-bold text-white mb-4">{opponent ? `${opponent.name}'s Hand` : "Opponent's Hand"}</h2>
            <div className="flex space-x-4">
              {opponent && opponent.hand.map(card => (<QubitCard key={card.id} id={card.id} isFaceDown={true} isHighlighted={lastMove?.playerId === opponent.id && lastMove?.qubitId === card.id} />))}
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
              <h2 className="text-xl font-bold text-white mb-4">{isMyTurn && selectedGate ? "2. Select a Qubit Card to Apply" : "Your Qubits"}</h2>
              <div className="flex space-x-4">
                {myHand.map((card, index) => (<QubitCard key={card.id} id={card.id} isFaceDown={card.isFaceDown} state={card.state} onClick={() => handlePlayQubit(card.id, index)} isHighlighted={lastMove?.playerId === myPlayerId && lastMove?.qubitId === card.id} />))}
              </div>
            </div>
            {renderActionPanel()}
          </div>
        </div>
      </div>
    </main>
  );
}