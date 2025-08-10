interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-xl max-w-2xl w-full border border-slate-600 max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-cyan-400 mb-4">How to Play Quantum Bluff</h2>
        
        <div className="space-y-4 text-slate-300">
          <div>
            <h3 className="font-bold text-white text-lg">Objective:</h3>
            <p>Be the first player to reach 5 points by applying quantum gates, bluffing about the results, and successfully challenging your opponent's bluffs.</p>
          </div>
          
          <div>
            <h3 className="font-bold text-white text-lg">Your Turn:</h3>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li><strong>Select a Gate Card:</strong> Choose a quantum gate from your hand.</li>
              <li><strong>Select a Qubit Card:</strong> Choose a Qubit to apply the gate to.</li>
              <li><strong>Declare the New State:</strong> After applying the gate, you must declare what you claim the new state of the Qubit is. <strong>You can bluff!</strong></li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold text-white text-lg">The Gates:</h3>
            <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                <li><strong>X Gate:</strong> Flips a Qubit. {'|0>'} becomes {'|1>'}, and {'|1>'} becomes {'|0>'}.</li>
                <li><strong>H Gate:</strong> Puts a Qubit into superposition. {'|0>'} becomes {'|+>'}, a 50/50 mix of 0 and 1.</li>
                <li><strong>CNOT Gate:</strong> A 2-qubit gate. Select your face-up card as CONTROL, then any card (yours or opponent's) as TARGET. If CONTROL is {'|1>'}, the TARGET is flipped (like an X gate).</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white text-lg">Challenge & Measurement:</h3>
             <ul className="list-disc list-inside space-y-1 pl-2 mt-2">
                <li>If an opponent challenges your bluff, the card's true state is measured.</li>
                <li><strong>Superposition Collapse:</strong> A {'|+>'} state, when measured, will randomly collapse to either {'|0>'} or {'|1>'}! The outcome is 50/50.</li>
                <li><strong>Scoring:</strong> Correct guesser gets +2 points, wrong guesser gets -1. Passing gives the bluffer +1 point.</li>
                <li><strong>Entanglement Bonus:</strong> If you use a CNOT gate with a superposition qubit as your CONTROL, the two cards become entangled. If challenged, they both collapse to the SAME random state, earning you a +3 point bonus!</li>
            </ul>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Let's Play!
        </button>
      </div>
    </div>
  );
}