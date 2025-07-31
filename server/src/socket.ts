import { Server, Socket } from 'socket.io';
import { GameRoom } from './types/game';
import { gameRooms, createNewRoom, addPlayerToRoom, resetRoomForRematch, dealFromDeck } from './game/state';
import { applyGate, resolveChallenge, checkForWinner } from './game/logic';

export function initializeSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);
    
    const findRoomBySocketId = (socketId: string) => Object.values(gameRooms).find(r => r.players.some(p => p.id === socketId));

    socket.on('join_game', (playerName: string) => {
      let availableRoom = Object.values(gameRooms).find(r => r.players.length === 1 && r.gameState === 'in-game');
      let currentRoom: GameRoom;

      if (availableRoom) {
        currentRoom = availableRoom;
        addPlayerToRoom(currentRoom, socket.id, playerName);
        socket.join(currentRoom.roomId);
      } else {
        const roomId = `room_${socket.id}`;
        currentRoom = createNewRoom(roomId, socket.id, playerName);
        gameRooms[roomId] = currentRoom;
        socket.join(roomId);
      }

      console.log(`[JOIN] Emitting 'gameUpdate' to room ${currentRoom.roomId}`);
      currentRoom.players.forEach(player => {
        io.to(player.id).emit('gameUpdate', { ...currentRoom, myHand: player.hand, gateCards: player.gateCards });
      });
    });
    
    socket.on('play_and_declare', async (data: { gateCardId: string, gateType: string, qubitId: string, declaredState: string }) => {
        // --- NOTE: Changed 'targetQubitId' to 'qubitId' to match what the client is sending ---
        console.log(`[DEBUG] Received 'play_and_declare' from ${socket.id}`, data);

        const room = findRoomBySocketId(socket.id);
        if (!room) {
            console.error(`[DEBUG] ERROR: Room not found for socket ${socket.id}`);
            return;
        }
        if (room.gameState === 'game-over') {
            console.warn(`[DEBUG] Game is over. Move rejected.`);
            return;
        }
        if (room.currentTurn !== socket.id) {
            console.warn(`[DEBUG] Not player's turn. Current turn: ${room.currentTurn}, Player: ${socket.id}`);
            return;
        }
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player) {
            console.error(`[DEBUG] ERROR: Player object not found for socket ${socket.id}`);
            return;
        }
        
        // --- CRITICAL FIX: Use 'data.qubitId' which is what the client sends ---
        const cardToUpdate = player.hand.find(card => card.id === data.qubitId); 
        if (!cardToUpdate) {
            console.error(`[DEBUG] ERROR: Target card with ID ${data.qubitId} not found in player's hand. Hand:`, player.hand);
            return;
        }
        
        console.log(`[DEBUG] All checks passed for player ${player.name}. Applying gate...`);

        // Apply game logic
        player.gateCards = player.gateCards.filter(card => card.id !== data.gateCardId);
        const newGateCards = dealFromDeck(room.decks.gateDeck, 1);
        if (newGateCards.length > 0) player.gateCards.push(...newGateCards);

        const oldState = cardToUpdate.state;
        cardToUpdate.state = await applyGate(cardToUpdate.state, data.gateType);
        console.log(`[DEBUG] Card state changed from ${oldState} to ${cardToUpdate.state}`);

        room.activeDeclaration = { qubitId: data.qubitId, declaredState: data.declaredState, playerId: socket.id };
        room.lastMove = { playerId: socket.id, gateCardId: data.gateCardId, qubitId: data.qubitId };
        
        const opponent = room.players.find(p => p.id !== socket.id);
        if (opponent) {
            room.currentTurn = opponent.id;
            room.lastMessage = `${player.name} declared state ${data.declaredState}. It's ${opponent.name}'s turn.`;
        }
        
        // This is the most critical part: send the update back to ALL clients in the room
        console.log(`[DEBUG] Move successful. Emitting 'gameUpdate' to room ${room.roomId}. New turn is for ${room.currentTurn}`);
        room.players.forEach(p => {
          io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards });
        });
    });

    socket.on('challenge_bluff', () => {
        const room = findRoomBySocketId(socket.id);
        if (!room || room.gameState === 'game-over' || room.currentTurn !== socket.id) return;
        
        console.log(`[DEBUG] Received 'challenge_bluff' from ${socket.id}`);
        resolveChallenge(room);
        checkForWinner(room, io);

        if (room.gameState === 'in-game') {
            console.log(`[DEBUG] Challenge resolved. Emitting 'gameUpdate'. New turn: ${room.currentTurn}`);
        }
        
        room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
    });

    socket.on('pass_bluff', () => {
        const room = findRoomBySocketId(socket.id);
        if (!room || room.gameState === 'game-over' || room.currentTurn !== socket.id || !room.activeDeclaration) return;
        
        console.log(`[DEBUG] Received 'pass_bluff' from ${socket.id}`);
        const declarer = room.players.find(p => p.id === room.activeDeclaration!.playerId);
        if (declarer) {
            declarer.score += 1;
            room.lastMessage = `The opponent passed. ${declarer.name} gets 1 point.`;
        }
        
        room.currentTurn = socket.id;
        room.activeDeclaration = null;
        room.lastMove = null;
        room.lastMessage += ` Now it's your turn to play.`;
        
        checkForWinner(room, io);
        
        if (room.gameState === 'in-game') {
            console.log(`[DEBUG] Pass resolved. Emitting 'gameUpdate'. New turn: ${room.currentTurn}`);
        }
        
        room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
    });

    socket.on('request_rematch', () => {
        const room = findRoomBySocketId(socket.id);
        if (!room || room.gameState !== 'game-over') return;
        
        if (!room.rematchRequestedBy.includes(socket.id)) {
            room.rematchRequestedBy.push(socket.id);
        }
        
        if (room.rematchRequestedBy.length === room.players.length) {
            resetRoomForRematch(room);
        }

        console.log(`[DEBUG] Rematch requested. Emitting 'gameUpdate'.`);
        room.players.forEach(p => {
            io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards });
        });
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        const room = findRoomBySocketId(socket.id);
        if (room) {
            delete gameRooms[room.roomId];
        }
    });
  });
}