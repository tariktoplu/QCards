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
    socket.on('play_and_declare', async (data: {
      gateCardId: string,
      gateType: string,
      targetQubitId: string,
      controlQubitId?: string,
      declaredState: string
    }) => {
        console.log(`[DEBUG] 1. Received 'play_and_declare' from ${socket.id}`, data);

        const room = findRoomBySocketId(socket.id);
        if (!room || room.gameState === 'game-over' || room.currentTurn !== socket.id) {
            console.error(`[DEBUG] 1a. Validation failed. Room: ${!!room}, GameState: ${room?.gameState}, Turn: ${room?.currentTurn}`);
            return;
        }
        
        const player = room.players.find(p => p.id === socket.id);
        if (!player) {
            console.error(`[DEBUG] 1b. Player object not found.`);
            return;
        }
        
        let finalState: string | null = null;
        let targetOwner = player;
        
        console.log(`[DEBUG] 2. Gate type is '${data.gateType}'`);

        // --- CNOT LOGIC ---
        if (data.gateType === 'CNOT') {
            if (!data.controlQubitId) {
                console.error(`[DEBUG] CNOT ERROR: controlQubitId is missing.`);
                return;
            }
            const controlCard = player.hand.find(c => c.id === data.controlQubitId);
            const opponent = room.players.find(p => p.id !== socket.id);
            
            let targetCard = player.hand.find(c => c.id === data.targetQubitId);
            if (!targetCard && opponent) {
                targetCard = opponent.hand.find(c => c.id === data.targetQubitId);
                if (targetCard) targetOwner = opponent;
            }

            if (controlCard && targetCard) {
                console.log(`[DEBUG] 3a. CNOT target found. Control=${controlCard.state}, Target=${targetCard.state}`);
                finalState = await applyGate(targetCard.state, 'CNOT', controlCard.state);
                targetCard.state = finalState;
            } else {
                console.error(`[DEBUG] CNOT ERROR: Control or Target card not found. Control: ${!!controlCard}, Target: ${!!targetCard}`);
            }
        } 
        // --- SINGLE QUBIT GATE LOGIC ---
        else {
            const targetCard = player.hand.find(card => card.id === data.targetQubitId);
            if (targetCard) {
                console.log(`[DEBUG] 3b. Single-Qubit target found. State=${targetCard.state}`);
                finalState = await applyGate(targetCard.state, data.gateType);
                targetCard.state = finalState;
            } else {
                console.error(`[DEBUG] SINGLE-QUBIT ERROR: Target card not found.`);
            }
        }
        
        // Check if a gate was successfully applied
        console.log(`[DEBUG] 4. Final state after applyGate: ${finalState}`);
        if (finalState !== null && finalState !== "|error>") {
            player.gateCards = player.gateCards.filter(card => card.id !== data.gateCardId);
            const newGateCards = dealFromDeck(room.decks.gateDeck, 1);
            if (newGateCards.length > 0) player.gateCards.push(...newGateCards);
            
            room.activeDeclaration = { qubitId: data.targetQubitId, declaredState: data.declaredState, playerId: socket.id };
            room.lastMove = { playerId: socket.id, gateCardId: data.gateCardId, qubitId: data.targetQubitId };
            const opponent = room.players.find(p => p.id !== socket.id);
            if (opponent) {
                room.currentTurn = opponent.id;
                room.lastMessage = `${player.name} played a ${data.gateType} gate. It's ${opponent.name}'s turn to respond.`;
            }
            
            console.log(`[DEBUG] 5. Move successful. Emitting 'gameUpdate'. New turn: ${room.currentTurn}`);
            room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
        } else {
            console.error(`[DEBUG] 5a. Move failed. finalState was null or an error. Not updating turn.`);
        }
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