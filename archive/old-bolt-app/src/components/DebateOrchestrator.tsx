import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Settings, Moon, Sun } from 'lucide-react';
import type { DebateConfig, DebateState, DebateSettings, Persona } from '../types/debate';
import { useDebateTimer } from '../hooks/useDebateTimer';
import { PersonaCard } from './PersonaCard';
import { ScoreGauge } from './ScoreGauge';
import { DebateTimer } from './DebateTimer';
import { DebateTranscript } from './DebateTranscript';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Slider } from './ui/Slider';
import { Toggle } from './ui/Toggle';

interface DebateOrchestratorProps {
  config: DebateConfig;
  settings: DebateSettings;
  onSettingsChange: (settings: DebateSettings) => void;
}

export function DebateOrchestrator({ config, settings, onSettingsChange }: DebateOrchestratorProps) {
  const [debateState, setDebateState] = useState<DebateState>({
    persona1: null,
    persona2: null,
    topic: '',
    currentRound: 0,
    currentSpeaker: 1,
    isActive: false,
    isPaused: false,
    timeRemaining: 180,
    scores: { persona1: 0, persona2: 0 },
    transcript: []
  });

  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(config.topics)[0]);
  const [showSettings, setShowSettings] = useState(false);

  const rounds = config.rounds || [
    { name: 'Opening', seconds: 180, word_limit: 50 },
    { name: 'Rebuttal', seconds: 180, word_limit: 60 },
    { name: 'Closing', seconds: 120, word_limit: 40 }
  ];

  const currentRound = rounds[debateState.currentRound];
  const timer = useDebateTimer(currentRound?.seconds || 180);

  const randomizeAll = useCallback(() => {
    const personas = config.personas;
    const categories = Object.keys(config.topics);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const topics = config.topics[randomCategory];
    
    const persona1 = personas[Math.floor(Math.random() * personas.length)];
    let persona2 = personas[Math.floor(Math.random() * personas.length)];
    while (persona2.name === persona1.name && personas.length > 1) {
      persona2 = personas[Math.floor(Math.random() * personas.length)];
    }
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    setSelectedCategory(randomCategory);
    setDebateState(prev => ({
      ...prev,
      persona1,
      persona2,
      topic: randomTopic
    }));
  }, [config]);

  const startDebate = useCallback(() => {
    if (!debateState.persona1 || !debateState.persona2 || !debateState.topic) {
      return;
    }
    
    setDebateState(prev => ({ ...prev, isActive: true }));
    timer.start();
  }, [debateState.persona1, debateState.persona2, debateState.topic, timer]);

  const nextTurn = useCallback(() => {
    if (debateState.currentRound >= rounds.length - 1) {
      // Debate finished
      setDebateState(prev => ({ ...prev, isActive: false }));
      timer.reset();
      return;
    }

    if (debateState.currentSpeaker === 1) {
      setDebateState(prev => ({ ...prev, currentSpeaker: 2 }));
    } else {
      setDebateState(prev => ({
        ...prev,
        currentSpeaker: 1,
        currentRound: prev.currentRound + 1
      }));
    }
    
    const nextRound = rounds[debateState.currentRound + (debateState.currentSpeaker === 1 ? 0 : 1)];
    timer.reset(nextRound?.seconds || 180);
    timer.start();
  }, [debateState.currentRound, debateState.currentSpeaker, rounds, timer]);

  const canStartDebate = debateState.persona1 && debateState.persona2 && debateState.topic;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
          >
            AI Debate Arena
          </motion.h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Where legendary minds clash in intellectual combat
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Button onClick={randomizeAll} variant="secondary">
            <Shuffle className="w-4 h-4 mr-2" />
            Randomize All
          </Button>
          <Button onClick={() => setShowSettings(!showSettings)} variant="ghost">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            onClick={() => onSettingsChange({ ...settings, darkMode: !settings.darkMode })}
            variant="ghost"
          >
            {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Slider
                label="Temperature"
                value={settings.temperature}
                min={0.1}
                max={1.0}
                step={0.1}
                onChange={(value) => onSettingsChange({ ...settings, temperature: value })}
              />
              <Toggle
                label="Moderator Enabled"
                checked={settings.moderatorEnabled}
                onChange={(checked) => onSettingsChange({ ...settings, moderatorEnabled: checked })}
              />
              <Toggle
                label="Sudden Death Mode"
                checked={settings.suddenDeathEnabled}
                onChange={(checked) => onSettingsChange({ ...settings, suddenDeathEnabled: checked })}
              />
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Persona 1 */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Debater 1</h2>
              <div className="grid gap-3">
                {config.personas.map((persona) => (
                  <PersonaCard
                    key={persona.name}
                    persona={persona}
                    isSelected={debateState.persona1?.name === persona.name}
                    onClick={() => setDebateState(prev => ({ ...prev, persona1: persona }))}
                    position="left"
                  />
                ))}
              </div>
            </div>
            
            {debateState.persona1 && (
              <ScoreGauge
                score={debateState.scores.persona1}
                label={debateState.persona1.name}
                color="blue"
              />
            )}
          </div>

          {/* Center Column - Controls & Timer */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Topic Selection</h3>
              
              <Select
                label="Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mb-4"
              >
                {Object.keys(config.topics).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>

              <Select
                label="Topic"
                value={debateState.topic}
                onChange={(e) => setDebateState(prev => ({ ...prev, topic: e.target.value }))}
              >
                <option value="">Select a topic...</option>
                {config.topics[selectedCategory]?.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </Select>
            </div>

            <DebateTimer
              timeRemaining={timer.timeRemaining}
              isActive={timer.isActive}
              isPaused={timer.isPaused}
              onStart={startDebate}
              onPause={timer.pause}
              onResume={timer.resume}
              roundName={currentRound?.name || 'Setup'}
            />

            <div className="text-center">
              <Button
                onClick={nextTurn}
                disabled={!timer.isActive || timer.timeRemaining > 0}
                variant="primary"
                size="lg"
              >
                Next Turn
              </Button>
            </div>
          </div>

          {/* Right Column - Persona 2 */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Debater 2</h2>
              <div className="grid gap-3">
                {config.personas.map((persona) => (
                  <PersonaCard
                    key={persona.name}
                    persona={persona}
                    isSelected={debateState.persona2?.name === persona.name}
                    onClick={() => setDebateState(prev => ({ ...prev, persona2: persona }))}
                    position="right"
                  />
                ))}
              </div>
            </div>
            
            {debateState.persona2 && (
              <ScoreGauge
                score={debateState.scores.persona2}
                label={debateState.persona2.name}
                color="purple"
              />
            )}
          </div>
        </div>

        {/* Transcript */}
        <div className="mt-8">
          <DebateTranscript
            messages={debateState.transcript}
            onExport={() => console.log('Transcript exported')}
          />
        </div>
      </div>
    </div>
  );
}