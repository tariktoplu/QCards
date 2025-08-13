import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="text-white">
      <div className="max-w-4xl mx-auto text-center py-24 px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-cyan-400">
          Welcome to Quantum Bluff
        </h1>
        <p className="mt-4 text-xl text-slate-300">
          A multiplayer card game of strategy, deception, and quantum mechanics.
        </p>
        <div className="mt-12">
          <Link href="/play" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-2xl transition duration-300">
            Play Now
          </Link>
        </div>
      </div>
    </div>
  );
}