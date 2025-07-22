import QubitCard from './QubitCard';

// Define the data structure for a single qubit card. This type can be reused.
type Qubit = {
  id: string; // Each card must have a unique identifier
  isFaceDown: boolean;
  state: string | null;
};

// Define the props interface for the PlayerHand component
interface PlayerHandProps {
  myCards: Qubit[]; // myCards is an array of Qubit objects
}

export default function PlayerHand({ myCards }: PlayerHandProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Your Qubits</h2>
      <div className="flex space-x-4">
        {myCards.length > 0 ? (
          myCards.map((card) => (
            <QubitCard 
              key={card.id} 
              isFaceDown={card.isFaceDown} 
              state={card.state} 
            />
          ))
        ) : (
          // Dummy cards for testing (shown when myCards is empty)
          <>
            <QubitCard isFaceDown={false} state="|0>" />
            <QubitCard isFaceDown={true} />
            <QubitCard isFaceDown={true} />
          </>
        )}
      </div>
    </div>
  );
}