/**
 * Debate Engine Module
 * 
 * Core debate orchestration system for the AI Debate Arena.
 * Handles debate initialization, state management, and persistence.
 */

export { DebateEngine, createDebateEngine } from './engine'
export type { DebateState, DebateSession, DebateCheckpoint } from './engine'

export { 
  DebateConfigBuilder, 
  createDebateConfig, 
  validateDebateConfig,
  DebateConfigSchema 
} from './config'
export type { DebateConfig } from './config'

export { 
  DebateTranscriptManager, 
  createTranscriptManager 
} from './transcript'
export type { 
  TranscriptEntry, 
  DebateTranscript, 
  ExportFormat 
} from './transcript'
