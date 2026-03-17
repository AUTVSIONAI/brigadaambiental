export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  context?: {
    location?: {
      latitude: number;
      longitude: number;
    };
    taskId?: string;
    brigadeId?: string;
  };
}

export interface ChatRequest {
  message: string;
  context?: {
    location?: {
      latitude: number;
      longitude: number;
    };
    taskId?: string;
    brigadeId?: string;
  };
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
}

export interface AiConfig {
  id: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  createdAt: string;
  updatedAt: string;
}
