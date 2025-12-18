
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export type ModelId = 'standard' | 'pro' | 'eco';

export interface ModelInfo {
  id: ModelId;
  name: string;
  description: string;
  features: string[];
  geminiModel: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  imageUrl?: string;
  inputImageUrl?: string;
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  selectedModel: ModelId;
}
