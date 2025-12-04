export enum ImageSize {
  Square_1K = '1K',
  Square_2K = '2K',
  Square_4K = '4K'
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
}

export interface GameState {
  inventory: InventoryItem[];
  currentQuest: string;
  location: string;
  imageSize: ImageSize;
}

export interface StorySegment {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string;
  isLoadingImage?: boolean;
  options?: string[];
  timestamp: number;
}

// The raw JSON response expected from the AI
export interface AIResponse {
  narrative: string;
  options: string[];
  inventory_changes: {
    add?: string[];
    remove?: string[];
  };
  quest_update?: string;
  visual_description: string;
}
