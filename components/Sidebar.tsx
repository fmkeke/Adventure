import React from 'react';
import { GameState } from '../types';

interface SidebarProps {
  gameState: GameState;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ gameState, className = '' }) => {
  return (
    <aside className={`bg-gray-800/50 border-r border-gray-700 flex flex-col p-6 overflow-y-auto backdrop-blur-md ${className}`}>
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold mb-2">
          Adventure AI
        </h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Engine</p>
      </div>

      <div className="mb-8">
        <h3 className="text-sm text-yellow-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Current Quest
        </h3>
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 shadow-inner">
          <p className="text-gray-200 text-sm leading-relaxed italic">
            "{gameState.currentQuest}"
          </p>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-sm text-blue-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Inventory
        </h3>
        <div className="space-y-2">
          {gameState.inventory.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Your pockets are empty.</p>
          ) : (
            gameState.inventory.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="flex items-center gap-3 p-2 rounded bg-gray-700/30 border border-gray-700 hover:border-gray-600 transition-colors animate-fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-gray-400">
                  {/* Generic Item Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <span className="text-gray-300 text-sm font-medium truncate">{item.name}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};
