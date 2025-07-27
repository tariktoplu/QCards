import { useGameStore } from "../store/useGameStore";

export default function Scoreboard() {
  // Get player data directly from the game store
  const players = useGameStore((state) => state.players);
  const myPlayerId = useGameStore((state) => state.socket?.id);

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
      <h3 className="text-lg font-bold text-white mb-3 text-center">Scoreboard</h3>
      <ul className="space-y-2">
        {players.map((player) => (
          <li 
            key={player.id} 
            className={`
              flex justify-between items-center p-2 rounded-md
              ${player.id === myPlayerId ? 'bg-cyan-900/50' : 'bg-slate-700/50'}
            `}
          >
            <span className="font-medium">
              {player.name}
              {player.id === myPlayerId && " (You)"}
            </span>
            <span className="font-mono text-xl font-bold text-yellow-300">
              {player.score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}