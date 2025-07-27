interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl max-w-2xl w-full border border-slate-600">
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">How to Play Quantum Bluff</h2>
        
        <div className="space-y-4 text-slate-300">
          <div>
            <h3 className="font-bold text-white text-lg">Objective:</h3>
            <p>Be the first player to reach 5 points by applying quantum gates, bluffing about the results, and successfully challenging your opponent's bluffs.</p>
          </div>
          
          <div>
            <h3 className="font-bold text-white text-lg">Your Turn:</h3>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li><strong>Select a Gate Card:</strong> Choose a quantum gate (like H, X, Z) from your hand.</li>
              <li><strong>Select a Qubit Card:</strong> Choose one of your face-up Qubit cards to apply the gate to.</li>
              {/* --- CRITICAL FIX IS ON THIS LINE --- */}
              <li><strong>Declare the New State:</strong> You must declare the new state of the Qubit. <strong>You can bluff!</strong> For example, you can play an X gate on {'|0>'} (which results in {'|1>'}) but declare the state as {'|+>'}.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold text-white text-lg">Opponent's Turn to Respond:</h3>
            <p>Your opponent sees your declaration and must choose to either <strong>Challenge</strong> or <strong>Pass</strong>.</p>
             <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                <li><strong>Challenge:</strong> The true state of the Qubit is revealed. If you were bluffing, the challenger gets +2 points. If you were honest, you get +2 points and the challenger gets -1.</li>
                <li><strong>Pass:</strong> Your opponent accepts your declaration as truth. You get +1 point for a successful, unchallenged move. The turn then passes.</li>
            </ul>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}