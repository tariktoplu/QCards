import { motion } from 'framer-motion';

interface QubitCardProps {
  id?: string;
  isFaceDown?: boolean;
  state?: string | null;
  onClick?: () => void; // Simplified onClick, we pass the full function from the parent
  isHighlighted?: boolean;
  isClickable?: boolean; // To show hover effects even if face down
  isControl?: boolean;   // To mark as the selected CNOT control
}

export default function QubitCard({ 
  id = '', 
  isFaceDown = true, 
  state = null, 
  onClick, 
  isHighlighted = false, 
  isClickable = false, 
  isControl = false 
}: QubitCardProps) {
  
  const cardContent = isFaceDown ? <div className="text-5xl font-bold text-cyan-300">Q</div> : <div className="text-4xl font-mono text-white">{state}</div>;
  
  // A card is interactive if it's explicitly made clickable (for CNOT target), or if it's face-up and has an onClick handler.
  const isInteractive = isClickable || (!isFaceDown && onClick);
  
  return (
    <motion.div
      layout 
      initial={{ opacity: 0, scale: 0.5 }} 
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }} 
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`
        w-32 h-48 rounded-lg border-2 flex items-center justify-center relative
        transition-all duration-300
        ${isFaceDown ? 'bg-slate-800 border-cyan-500' : 'bg-indigo-700 border-yellow-400'}
        ${isInteractive ? 'cursor-pointer hover:border-yellow-200 hover:scale-110' : ''}
        ${isHighlighted ? 'ring-4 ring-offset-4 ring-offset-slate-900 ring-green-500' : ''}
        ${isControl ? 'ring-4 ring-offset-4 ring-offset-slate-900 ring-blue-500' : ''}
      `}
    >
      {isControl && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
          CONTROL
        </div>
      )}
      {cardContent}
    </motion.div>
  );
}