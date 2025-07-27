'use client'; 

import { useGameStore } from '../store/useGameStore';
import SocketManager from '../components/SocketManager';
import Lobby from '../components/Lobby';
import GameScreen from '../components/GameScreen' // We will create this component

export default function Page() {
  const gameState = useGameStore((state) => state.gameState);

  return (
    <>
      <SocketManager />
      {gameState === 'lobby' && <Lobby />}
      {(gameState === 'in-game' || gameState === 'game-over') && <GameScreen />}
    </>
  );
}