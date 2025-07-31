import { motion } from 'framer-motion'; // Import motion from the library

interface QubitCardProps {
  id?: string;
  isFaceDown?: boolean;
  state?: string | null;
  onClick?: (id: string) => void;
  isHighlighted?: boolean;
}

export default function QubitCard({ id = '', isFaceDown = true, state = null, onClick, isHighlighted = false }: QubitCardProps) {
  const handleCardClick = () => { if (onClick && !isFaceDown) onClick(id); };
  const cardContent = isFaceDown ? <div className="text-5xl font-bold text-cyan-300">Q</div> : <div className="text-4xl font-mono text-white">{state}</div>;
  
  return (
    // Replace 'div' with 'motion.div'
    <motion.div
      layout // This magic prop animates layout changes (e.g., when a card is removed)
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className={`
        w-32 h-48 rounded-lg border-2 flex items-center justify-center
        transition-colors // Use 'transition-colors' instead of 'transition-all' for better performance
        duration-300
        ${isFaceDown ? 'bg-slate-800 border-cyan-500' : 'bg-indigo-700 border-yellow-400 cursor-pointer hover:border-yellow-200'}
        ${isHighlighted ? 'ring-4 ring-offset-4 ring-offset-slate-900 ring-green-500' : ''}
      `}
    >
      {cardContent}
    </motion.div>
  );
}