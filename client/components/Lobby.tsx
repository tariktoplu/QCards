import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import HowToPlayModal from './HowToPlayModal'; // Import the new modal component

export default function Lobby() {
  const [playerName, setPlayerName] = useState('');
  const [showHelp, setShowHelp] = useState(false); // State to control modal visibility
  const joinGame = useGameStore((state) => state.joinGame);

  const handleJoin = () => {
    if (playerName.trim()) {
      joinGame(playerName.trim());
    }
  };

  return (
    <>
      {/* Show the modal if showHelp is true */}
      {showHelp && <HowToPlayModal onClose={() => setShowHelp(false)} />}

      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <h1 className="text-6xl font-bold text-cyan-400 mb-8">Quantum Bluff</h1>
        <div className="p-8 bg-slate-800 rounded-lg shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4 text-center">Enter Your Name</h2>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-lg text-center"
            placeholder="e.g., Alice"
            maxLength={15}
          />
          <button
            onClick={handleJoin}
            disabled={!playerName.trim()}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded text-lg"
          >
            Find Game
          </button>
        </div>
        
        {/* Button to open the "How to Play" modal */}
        <button
          onClick={() => setShowHelp(true)}
          className="mt-8 text-cyan-400 hover:text-cyan-300 underline"
        >
          How to Play?
        </button>
      </div>
    </>
  );
}