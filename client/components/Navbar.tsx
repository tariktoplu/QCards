export default function Navbar() {
  return (
    <nav className="bg-slate-800/50 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <a href="/" className="text-2xl font-bold text-cyan-400">Quantum Bluff</a>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {/* Future links can go here, e.g., Leaderboard, Profile */}
              <a href="https://github.com/your-username/quantum-bluff" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:bg-slate-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}