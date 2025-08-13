'use client'; 

import { useGameStore } from '../../store/useGameStore'; // Update path
import SocketManager from '../../components/SocketManager'; // Update path
import Lobby from '../../components/Lobby'; // Update path
import GameScreen from '../../components/GameScreen'; // Update path

export default function PlayPage() {
  const gameState = useGameStore((state) => state.gameState);
  const lastMessage = useGameStore((state) => state.lastMessage);
  const players = useGameStore((state) => state.players);

  const getLobbyMessage = () => {
    if (players.length === 1 && lastMessage) {
      return lastMessage;
    }
    return "Finding a game...";
  };

  return (
    <>
      <SocketManager />
      {gameState === 'lobby' && (
        <div className="text-white text-center mt-20">
            <Lobby />
            <p className="mt-8 text-xl text-slate-400 animate-pulse">{getLobbyMessage()}</p>
        </div>
      )}
      {(gameState === 'in-game' || gameState === 'game-over') && <GameScreen />}
    </>
  );
}