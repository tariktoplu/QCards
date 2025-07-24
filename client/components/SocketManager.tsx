'use client'; // This component must be a client component because it uses hooks

import { useEffect } from 'react';
import io from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';
// Import the GameState type we just exported
import type { GameState } from '../store/useGameStore'; 

export default function SocketManager() {
  // The 'state' in a selector is already inferred by Zustand, 
  // so we don't need to manually type it here. This is cleaner.
  const setSocket = useGameStore((state) => state.setSocket);
  const updateGameState = useGameStore((state) => state.updateGameState);

  useEffect(() => {
    const socket = io('http://localhost:4000');

    socket.on('connect', () => {
      console.log('✅ Successfully connected to the server! ID:', socket.id);
      setSocket(socket);
    });

    // Listener that fires when a 'gameUpdate' message arrives from the server
    // We explicitly type 'newState' here!
    socket.on('gameUpdate', (newState: Partial<GameState>) => {
      console.log('[CLIENT SOCKET LOG] Received gameUpdate event with data:', newState);
      updateGameState(newState);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from the server.');
      setSocket(null);
    });

    // Clean up the connection when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, [setSocket, updateGameState]);

  return null; // This component renders nothing to the screen
}