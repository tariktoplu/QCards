'use client'; 

import { useEffect } from 'react';
import io from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';
import type { GameState } from '../store/useGameStore'; 

export default function SocketManager() {
  const setSocket = useGameStore((state) => state.setSocket);
  const updateGameState = useGameStore((state) => state.updateGameState);

  useEffect(() => {
    // --- THIS IS THE FINAL VERSION OF THE CONNECTION LOGIC ---
    // Read the server URL from an environment variable.
    // This variable MUST start with NEXT_PUBLIC_ for Next.js to expose it to the browser.
    // If the variable is not defined (e.g., in local development), it defaults to localhost.
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    
    // Log the URL being used for easier debugging.
    console.log(`Connecting to server at: ${SERVER_URL}`);
    
    // Connect to the server using the determined URL.
    const socket = io(SERVER_URL); 

    socket.on('connect', () => {
      console.log('✅ Successfully connected to the server! ID:', socket.id);
      setSocket(socket);
    });

    socket.on('gameUpdate', (newState: Partial<GameState>) => {
      console.log('🔄 Game state updated:', newState);
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