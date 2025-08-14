import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, MessageSquare } from 'lucide-react';
import type { DebateMessage } from '../types/debate';
import { Button } from './ui/Button';

interface DebateTranscriptProps {
  messages: DebateMessage[];
  onExport: () => void;
}

export function DebateTranscript({ messages, onExport }: DebateTranscriptProps) {
  const exportToMarkdown = () => {
    const markdown = messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString();
      return `## ${msg.speaker} - ${msg.round} (${timestamp})\n\n${msg.content}\n\n${msg.score ? `**Score: ${msg.score}/10**\n\n` : ''}---\n\n`;
    }).join('');
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debate-transcript-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onExport();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Debate Transcript</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={exportToMarkdown}
          disabled={messages.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>
      
      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Debate transcript will appear here...</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="border-l-4 border-blue-500 pl-4 py-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {message.speaker}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{message.round}</span>
                    {message.score && (
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {message.score}/10
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {message.content}
                </p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}