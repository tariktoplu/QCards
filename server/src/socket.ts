import { Server, Socket } from 'socket.io';
import { GameRoom } from './types/game';
import { gameRooms, createNewRoom, addPlayerToRoom, resetRoomForRematch, dealFromDeck, createHandWithIds, TURN_TIMER_SECONDS, WINNING_SCORE } from './game/state';
import { applyGate, resolveChallenge, checkForWinner, checkTargetStateBonus } from './game/logic';

const gameLoopIntervals: { [roomId: string]: NodeJS.Timeout } = {};

function startGameLoop(io: Server, room: GameRoom) {
    if (gameLoopIntervals[room.roomId]) {
        clearInterval(gameLoopIntervals[room.roomId]);
    }
    gameLoopIntervals[room.roomId] = setInterval(() => {
        if (room.gameState !== 'in-game') {
            clearInterval(gameLoopIntervals[room.roomId]);
            delete gameLoopIntervals[room.roomId];
            return;
        }
        room.timer--;
        if (room.timer < 0) {
            const currentPlayer = room.players.find(p => p.id === room.currentTurn);
            const opponent = room.players.find(p => p.id !== room.currentTurn);
            if (!currentPlayer || !opponent) {
                clearInterval(gameLoopIntervals[room.roomId]);
                delete gameLoopIntervals[room.roomId];
                return;
            };

            if (room.activeDeclaration) { // Auto-pass a challenge
                const declarer = room.players.find(p => p.id === room.activeDeclaration!.playerId);
                if (declarer) declarer.score += 1;
                room.lastMessage = `${currentPlayer.name} ran out of time and passed.`;
                room.currentTurn = currentPlayer.id; // It becomes their turn to play a card
            } else { // Skip their turn to play a card
                room.lastMessage = `${currentPlayer.name} ran out of time! Turn skipped.`;
                room.currentTurn = opponent.id;
            }
            room.timer = TURN_TIMER_SECONDS;
            room.activeDeclaration = null;
            // Send a full update after a timeout action
            room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
        } else {
            // Just send a tick update to all players in the room
            io.to(room.roomId).emit('timer_tick', room.timer);
        }
    }, 1000);
}

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
        if (currentRoom.players.length === 2) {
            startGameLoop(io, currentRoom);
        }
      } else {
        const roomId = `room_${socket.id}`;
        currentRoom = createNewRoom(roomId, socket.id, playerName);
        gameRooms[roomId] = currentRoom;
        socket.join(roomId);
      }
      currentRoom.players.forEach(player => {
        io.to(player.id).emit('gameUpdate', { ...currentRoom, myHand: player.hand, gateCards: player.gateCards });
      });
    });
    
    socket.on('play_and_declare', async (data: {
      gateCardId: string, gateType: string, targetQubitId: string,
      controlQubitId?: string, declaredState: string, usedBluffToken: boolean
    }) => {
        const room = findRoomBySocketId(socket.id);
        if (!room) return;
        room.entangledPair = null; room.revealedCard = null;
        if (room.gameState === 'game-over' || room.currentTurn !== socket.id) return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;
        if (data.usedBluffToken && player.bluffTokens <= 0) return;
        if (data.usedBluffToken) player.bluffTokens--;
        let finalState: string | null = null;
        if (data.gateType === 'CNOT' && data.controlQubitId) {
            const controlCard = player.hand.find(c => c.id === data.controlQubitId);
            const opponent = room.players.find(p => p.id !== socket.id);
            let targetCard = player.hand.find(c => c.id === data.targetQubitId) || opponent?.hand.find(c => c.id === data.targetQubitId);
            if (controlCard && targetCard) {
                if (controlCard.isFaceDown) controlCard.isFaceDown = false;
                if (targetCard.isFaceDown) targetCard.isFaceDown = false;
                if (controlCard.state === '|+>' || controlCard.state === '|->') {
                    room.entangledPair = { controlId: controlCard.id, targetId: targetCard.id };
                }
                finalState = await applyGate(targetCard.state, 'CNOT', controlCard.state);
                targetCard.state = finalState;
            }
        } else {
            const targetCard = player.hand.find(card => card.id === data.targetQubitId);
            if (targetCard) {
                if (targetCard.isFaceDown) targetCard.isFaceDown = false;
                finalState = await applyGate(targetCard.state, data.gateType);
                targetCard.state = finalState;
            }
        }
        if (finalState !== null && finalState !== "|error>") {
            player.gateCards = player.gateCards.filter(card => card.id !== data.gateCardId);
            const newGateCardTemplates = dealFromDeck(room.decks.gateDeck, 1);
            if (newGateCardTemplates.length === 0) {
                room.gameState = 'game-over';
                room.lastMessage = 'The Gate Deck is empty! The game is a draw.';
                room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
                return;
            }
            const newGateCards = createHandWithIds(newGateCardTemplates, 'g');
            player.gateCards.push(...newGateCards);
            room.activeDeclaration = { qubitId: data.targetQubitId, declaredState: data.declaredState, playerId: socket.id, usedBluffToken: data.usedBluffToken };
            room.lastMove = { playerId: socket.id, gateCardId: data.gateCardId, qubitId: data.targetQubitId };
            const opponent = room.players.find(p => p.id !== socket.id);
            if (opponent) {
                room.currentTurn = opponent.id;
                room.lastMessage = `${player.name} played a ${data.gateType} gate. It's ${opponent.name}'s turn to respond.`;
                room.timer = TURN_TIMER_SECONDS;
            }
            room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
        }
    });

    socket.on('challenge_bluff', () => {
        const room = findRoomBySocketId(socket.id);
        if (!room || room.gameState === 'game-over' || room.currentTurn !== socket.id) return;
        const declarer = room.players.find(p => p.id === room.activeDeclaration?.playerId);
        resolveChallenge(room);
        if (declarer) { checkTargetStateBonus(declarer, room); }
        const isGameOver = checkForWinner(room);
        if (!isGameOver) room.timer = TURN_TIMER_SECONDS;
        room.players.forEach(p => io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards }));
    });

    socket.on('pass_bluff', () => {
        const room = findRoomBySocketId(socket.id);
        if (!room || room.gameState === 'game-over' || room.currentTurn !== socket.id || !room.activeDeclaration) return;
        const declarer = room.players.find(p => p.id === room.activeDeclaration!.playerId);
        if(declarer) {
            declarer.score += 1;
            room.lastMessage = `The opponent passed. ${declarer.name} gets 1 point.`;
            const bonusAwarded = checkTargetStateBonus(declarer, room);
            if (!bonusAwarded) { room.lastMessage += ` Now it's your turn to play.`; }
        }
        room.currentTurn = socket.id; 
        room.activeDeclaration = null;
        room.lastMove = null;
        const isGameOver = checkForWinner(room);
        if (!isGameOver) {
            room.timer = TURN_TIMER_SECONDS;
            room.round++;
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
            startGameLoop(io, room); // Restart the timer loop for the new game
        }
        room.players.forEach(p => {
            io.to(p.id).emit('gameUpdate', { ...room, myHand: p.hand, gateCards: p.gateCards });
        });
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        const room = findRoomBySocketId(socket.id);
        if (room) {
            const remainingPlayer = room.players.find(p => p.id !== socket.id);
            if (remainingPlayer && room.gameState === 'in-game') {
                const disconnectedPlayer = room.players.find(p => p.id === socket.id);
                room.gameState = 'game-over';
                room.lastMessage = `${disconnectedPlayer?.name || 'Opponent'} has disconnected. You win by default!`;
                remainingPlayer.score = WINNING_SCORE;
                io.to(remainingPlayer.id).emit('gameUpdate', {
                    ...room, myHand: remainingPlayer.hand, gateCards: remainingPlayer.gateCards
                });
            }
            delete gameRooms[room.roomId];
            if (gameLoopIntervals[room.roomId]) {
                clearInterval(gameLoopIntervals[room.roomId]);
                delete gameLoopIntervals[room.roomId];
            }
        }
    });
  });
}