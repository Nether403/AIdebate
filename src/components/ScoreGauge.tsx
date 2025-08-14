import React from 'react';
import { motion } from 'framer-motion';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  label: string;
  color?: string;
}

export function ScoreGauge({ score, maxScore = 10, label, color = 'blue' }: ScoreGaugeProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {score.toFixed(1)}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} rounded-full relative`}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </motion.div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {percentage.toFixed(0)}% of maximum
      </div>
    </div>
  );
}