'use client'; 

import { useGameStore } from '../store/useGameStore';
import PlayerHand from '../components/PlayerHand';
import QubitCard from '../components/QubitCard';
import SocketManager from '../components/SocketManager';

export default function GamePage() {
  // Get the socket object from our store
  const { socket, gameState, myHand, targetState } = useGameStore();

  const handlePlayGate = (qubitId: string) => {
    // Ensure we are connected before trying to send a message
    if (!socket) {
      console.error("Socket is not connected.");
      return;
    }

    console.log(`Attempting to play X gate on qubit ${qubitId}`);
    
    // Send an event to the server
    socket.emit('play_gate', {
      qubitId: qubitId,
      gateType: 'X' // For the MVP, we always play an X gate
    });
  };

  return (
    <>
      <SocketManager /> 
      
      <main className="bg-slate-900 min-h-screen text-white p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          {/* Header section remains the same... */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-cyan-400">Quantum Bluff</h1>
            <div className="text-lg">
              Status: <span className="font-bold text-yellow-400">{gameState}</span>
            </div>
            <div className="text-lg">
              Target: <span className="font-mono text-2xl bg-slate-700 px-3 py-1 rounded">
                {targetState || "..."}
              </span>
            </div>
          </div>

          {/* Opponent section remains the same... */}
          <div className="mb-16">
            <h2 className="text-xl font-bold text-white mb-4">Opponent</h2>
            <div className="flex space-x-4">
              <QubitCard isFaceDown={true} />
              <QubitCard isFaceDown={true} />
              <QubitCard isFaceDown={true} />
            </div>
          </div>
          
          <div className="h-24"></div>

          {/* Player Area: Pass the handler function to PlayerHand */}
          <div className="border-t-2 border-cyan-700 pt-8">
            {/* We need to update PlayerHand to accept and use the onClick prop */}
            <h2 className="text-xl font-bold text-white mb-4">Your Qubits (Click a face-up card to apply X Gate)</h2>
            <div className="flex space-x-4">
              {myHand.map((card) => (
                <QubitCard 
                  key={card.id}
                  id={card.id}
                  isFaceDown={card.isFaceDown}
                  state={card.state}
                  onClick={handlePlayGate}
                />
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}