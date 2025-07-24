// Add id and onClick to the props interface
interface QubitCardProps {
  id?: string;
  isFaceDown?: boolean;
  state?: string | null;
  onClick?: (id: string) => void; // A function that receives the card's id
}

// Pass the new props down
export default function QubitCard({ id = '', isFaceDown = true, state = null, onClick }: QubitCardProps) {
  
  const handleCardClick = () => {
    // Only call the onClick function if it exists and the card is face up
    if (onClick && !isFaceDown) {
      onClick(id);
    }
  };

  const cardContent = isFaceDown ? (
    <div className="text-5xl font-bold text-cyan-300">Q</div>
  ) : (
    <div className="text-4xl font-mono text-white">{state}</div>
  );

  return (
    // Add the onClick handler to the main div
    <div
      onClick={handleCardClick}
      className={`
        w-32 h-48 rounded-lg border-2 flex items-center justify-center
        transition-all duration-500
        ${isFaceDown 
          ? 'bg-slate-800 border-cyan-500' 
          // Make face-up cards interactive
          : 'bg-indigo-700 border-yellow-400 cursor-pointer hover:border-yellow-200 hover:scale-105'
        }
      `}
    >
      {cardContent}
    </div>
  );
}