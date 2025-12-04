import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { StorySegment } from './components/StorySegment';
import { SettingsModal } from './components/SettingsModal';
import { geminiService } from './services/geminiService';
import { GameState, StorySegment as StorySegmentType, ImageSize } from './types';

const INITIAL_GAME_STATE: GameState = {
  inventory: [],
  currentQuest: "Begin your adventure.",
  location: "Unknown",
  imageSize: ImageSize.Square_1K,
};

function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [history, setHistory] = useState<StorySegmentType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [suggestedOptions, setSuggestedOptions] = useState<string[]>(["Start Adventure"]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleAction = async (action: string) => {
    if (!action.trim() || isLoading) return;

    setIsLoading(true);
    const userSegment: StorySegmentType = {
      id: Date.now().toString(),
      role: 'user',
      text: action,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, userSegment]);
    setInputValue('');
    setSuggestedOptions([]); // Clear options while loading

    try {
      // Prepare history for API
      const apiHistory = history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }] // Simplified for this context, in real app we might pass image cues too
      }));

      // 1. Generate Story Text (Fast)
      const storyResponse = await geminiService.generateStorySegment(apiHistory, action);

      // 2. Update Game State
      setGameState(prev => {
        const next = { ...prev };
        // Add items
        if (storyResponse.inventory_changes.add) {
          storyResponse.inventory_changes.add.forEach(item => {
            if (!next.inventory.find(i => i.name === item)) {
              next.inventory.push({ id: Date.now().toString() + Math.random(), name: item });
            }
          });
        }
        // Remove items
        if (storyResponse.inventory_changes.remove) {
          const toRemove = new Set(storyResponse.inventory_changes.remove);
          next.inventory = next.inventory.filter(i => !toRemove.has(i.name));
        }
        // Update Quest
        if (storyResponse.quest_update) {
          next.currentQuest = storyResponse.quest_update;
        }
        return next;
      });

      // 3. Add AI Segment (Loading Image)
      const aiSegmentId = (Date.now() + 1).toString();
      const aiSegment: StorySegmentType = {
        id: aiSegmentId,
        role: 'model',
        text: storyResponse.narrative,
        timestamp: Date.now(),
        isLoadingImage: true,
        options: storyResponse.options
      };

      setHistory(prev => [...prev, aiSegment]);
      setSuggestedOptions(storyResponse.options || []);

      // 4. Generate Image (Async)
      try {
        const imageBase64 = await geminiService.generateSceneImage(
          storyResponse.visual_description,
          gameState.imageSize
        );
        
        setHistory(prev => prev.map(seg => {
          if (seg.id === aiSegmentId) {
            return { ...seg, imageUrl: imageBase64, isLoadingImage: false };
          }
          return seg;
        }));
      } catch (imgErr) {
        // If image fails, just stop loading state
        setHistory(prev => prev.map(seg => {
          if (seg.id === aiSegmentId) {
            return { ...seg, isLoadingImage: false };
          }
          return seg;
        }));
      }

    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "The mists of time cloud your vision... (Error: Could not contact the spirit realm. Please try again.)",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start the game automatically on load
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      handleAction("Start a new fantasy adventure in a mysterious land.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden font-sans">
      {/* Sidebar - Hidden on small mobile, visible on md+ */}
      <div className="hidden md:block w-64 h-full shrink-0 z-20">
         <Sidebar gameState={gameState} className="h-full w-full" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Header (Mobile only sidebar toggle could go here, for now just settings) */}
        <header className="absolute top-0 right-0 p-4 z-30">
          <button 
            onClick={() => setShowSettings(true)}
            className="bg-gray-800/80 backdrop-blur text-gray-300 p-2 rounded-full hover:bg-gray-700 hover:text-white transition-colors border border-gray-600 shadow-lg"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </header>

        {/* Story Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-32">
          <div className="max-w-3xl mx-auto">
            {history.map((segment) => (
              <StorySegment key={segment.id} segment={segment} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500 animate-pulse mt-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-sm font-medium">The Dungeon Master is thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent pt-12 pb-6 px-4">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {/* Suggestions Chips */}
            {!isLoading && suggestedOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {suggestedOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAction(opt)}
                    className="px-4 py-2 bg-gray-800/80 hover:bg-purple-600/80 border border-gray-600 hover:border-purple-400 rounded-full text-sm text-gray-200 transition-all backdrop-blur-sm shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Field */}
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAction(inputValue)}
                placeholder="What do you want to do?"
                disabled={isLoading}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-500"
              />
              <button
                onClick={() => handleAction(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        currentSize={gameState.imageSize}
        onSizeChange={(size) => setGameState(prev => ({ ...prev, imageSize: size }))}
      />
    </div>
  );
}

export default App;
