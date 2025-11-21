import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause } from 'lucide-react';

interface DebateTimerProps {
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  roundName: string;
}

export function DebateTimer({ 
  timeRemaining, 
  isActive, 
  isPaused, 
  onStart, 
  onPause, 
  onResume, 
  roundName 
}: DebateTimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLowTime = timeRemaining <= 30;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {roundName}
          </span>
        </div>
        
        <motion.div
          animate={isLowTime ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isLowTime ? Infinity : 0, duration: 1 }}
          className={`text-6xl font-mono font-bold ${
            isLowTime ? 'text-red-500' : 'text-gray-900 dark:text-white'
          }`}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.div>
        
        <div className="flex justify-center">
          {!isActive ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>Start</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isPaused ? onResume : onPause}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isPaused 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}