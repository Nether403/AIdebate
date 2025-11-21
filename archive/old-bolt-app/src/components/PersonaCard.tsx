import React from 'react';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import type { Persona } from '../types/debate';

interface PersonaCardProps {
  persona: Persona;
  isSelected: boolean;
  onClick: () => void;
  position?: 'left' | 'right';
}

export function PersonaCard({ persona, isSelected, onClick, position }: PersonaCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl ring-4 ring-blue-300' 
          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-lg hover:shadow-xl'
        }
        ${position === 'left' ? 'border-l-4 border-blue-500' : ''}
        ${position === 'right' ? 'border-r-4 border-purple-500' : ''}
      `}
    >
      <div className="flex items-center space-x-3">
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center
          ${isSelected ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}
        `}>
          <User className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            {persona.name}
          </h3>
          <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
            {persona.pov}
          </p>
        </div>
      </div>
      
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 pt-3 border-t border-white/20"
        >
          <p className="text-xs text-white/70">
            Voice: {persona.voice.voice_name}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}