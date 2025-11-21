export interface Persona {
  name: string;
  pov: string;
  voice: {
    voice_name: string;
  };
  template: string;
  wildcards: Record<string, {
    values: string[];
    weights?: number[];
  }>;
  avatar_prompt: string;
}

export interface Round {
  name: string;
  seconds: number;
  word_limit: number;
}

export interface DebateConfig {
  config_version: string;
  schema?: string;
  global_settings: {
    voice_provider: string;
    model_provider: string[];
    model_selection: string[];
    model_temperature: number[];
    global_rules: {
      debate_rules: string;
      acknowledgment: string;
      structure: {
        opening: string;
        rebuttal: string;
        closing: string;
      };
      time_limit: string;
      self_scoring_enabled?: boolean;
      cheating_detection_enabled?: boolean;
      word_limit: number;
      flair?: string;
    };
  };
  rounds?: Round[];
  moderator?: {
    enabled: boolean;
    selection: string;
  };
  quick_settings?: {
    moderator_enabled: boolean;
    sudden_death?: {
      enabled: boolean;
      threshold: number;
    };
  };
  personas: Persona[];
  topics: Record<string, string[]>;
}

export interface DebateState {
  persona1: Persona | null;
  persona2: Persona | null;
  topic: string;
  currentRound: number;
  currentSpeaker: 1 | 2;
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  scores: {
    persona1: number;
    persona2: number;
  };
  transcript: DebateMessage[];
}

export interface DebateMessage {
  speaker: string;
  content: string;
  timestamp: number;
  round: string;
  score?: number;
}

export interface DebateSettings {
  temperature: number;
  darkMode: boolean;
  moderatorEnabled: boolean;
  suddenDeathEnabled: boolean;
}