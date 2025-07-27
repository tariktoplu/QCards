interface QubitCardProps {
  id?: string;
  isFaceDown?: boolean;
  state?: string | null;
  onClick?: (id: string) => void;
  isHighlighted?: boolean;
}

export default function QubitCard({ id = '', isFaceDown = true, state = null, onClick, isHighlighted = false }: QubitCardProps) {
  const handleCardClick = () => {
    if (onClick && !isFaceDown) {
      onClick(id);
    }
  };
  const cardContent = isFaceDown ? <div className="text-5xl font-bold text-cyan-300">Q</div> : <div className="text-4xl font-mono text-white">{state}</div>;
  return (
    <div
      onClick={handleCardClick}
      className={`
        w-32 h-48 rounded-lg border-2 flex items-center justify-center
        transition-all duration-300
        ${isFaceDown ? 'bg-slate-800 border-cyan-500' : 'bg-indigo-700 border-yellow-400 cursor-pointer hover:border-yellow-200 hover:scale-105'}
        ${isHighlighted ? 'ring-4 ring-offset-4 ring-offset-slate-900 ring-green-500' : ''}
      `}
    >
      {cardContent}
    </div>
  );
}