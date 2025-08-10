'use client'; 

import { useEffect } from 'react';
import io from 'socket.io-client';
import { useGameStore } from '../store/useGameStore';
import type { GameState } from '../store/useGameStore'; 

export default function SocketManager() {
  const setSocket = useGameStore((state) => state.setSocket);
  const updateGameState = useGameStore((state) => state.updateGameState);
  const setTimer = useGameStore((state) => state.setTimer); // Get timer action

  useEffect(() => {
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    const socket = io(SERVER_URL); 

    socket.on('connect', () => {
      console.log('✅ Connected to server! ID:', socket.id);
      setSocket(socket);
    });

    socket.on('gameUpdate', (newState: Partial<GameState>) => {
      console.log('🔄 Game state updated:', newState);
      updateGameState(newState);
    });

    // --- NEW: Listen for timer ticks ---
    socket.on('timer_tick', (time: number) => {
      setTimer(time);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from the server.');
      setSocket(null);
    });

    return () => {
      socket.disconnect();
    };
  }, [setSocket, updateGameState, setTimer]);

  return null;
}