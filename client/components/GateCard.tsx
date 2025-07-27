interface GateCardProps {
  id: string;
  type: string;
  isSelected: boolean;
  onClick: (id: string, type: string) => void;
  isHighlighted?: boolean;
}

export default function GateCard({ id, type, isSelected, onClick, isHighlighted = false }: GateCardProps) {
  return (
    <div
      onClick={() => onClick(id, type)}
      className={`
        w-24 h-16 rounded-md border-2 flex items-center justify-center
        font-mono text-2xl font-bold cursor-pointer transition-all
        ${isSelected ? 'bg-yellow-500 border-white scale-110' : 'bg-slate-600 border-slate-400 hover:bg-slate-500'}
        ${isHighlighted ? 'ring-4 ring-offset-4 ring-offset-slate-900 ring-green-500' : ''}
      `}
    >
      {type}
    </div>
  );
}