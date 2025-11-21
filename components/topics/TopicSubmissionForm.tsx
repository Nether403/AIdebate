'use client';

/**
 * Topic Submission Form
 * Allows users to submit debate topic suggestions
 */

import { useState } from 'react';
import type { TopicCategory, TopicDifficulty } from '@/types';

export function TopicSubmissionForm() {
  const [motion, setMotion] = useState('');
  const [category, setCategory] = useState<TopicCategory>('philosophy');
  const [difficulty, setDifficulty] = useState<TopicDifficulty>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    validation?: any;
  } | null>(null);

  const categories: TopicCategory[] = [
    'technology',
    'ethics',
    'politics',
    'science',
    'education',
    'economics',
    'health',
    'environment',
    'culture',
    'philosophy',
  ];

  const difficulties: TopicDifficulty[] = ['easy', 'medium', 'hard'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motion.trim()) {
      alert('Please enter a debate motion');
      return;
    }

    try {
      setSubmitting(true);
      setResult(null);

      const response = await fetch('/api/topics/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motion: motion.trim(),
          category,
          difficulty,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setMotion('');
      }
    } catch (error) {
      console.error('Error submitting topic:', error);
      setResult({
        success: false,
        message: 'Failed to submit topic. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Submit a Debate Topic</h2>
      <p className="text-gray-600 mb-6">
        Suggest a balanced debate motion for the community. Topics are automatically
        validated for side-balance before approval.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="motion" className="block text-sm font-medium mb-2">
            Debate Motion *
          </label>
          <textarea
            id="motion"
            value={motion}
            onChange={(e) => setMotion(e.target.value)}
            placeholder='e.g., "This house believes that artificial intelligence will do more good than harm"'
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Frame as a clear proposition that can be argued from both sides
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TopicCategory)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium mb-2">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as TopicDifficulty)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-medium"
        >
          {submitting ? 'Validating & Submitting...' : 'Submit Topic'}
        </button>
      </form>

      {result && (
        <div
          className={`mt-6 p-4 rounded-md ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <p
            className={`font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {result.message}
          </p>

          {result.validation && (
            <div className="mt-3 text-sm">
              <p className="text-gray-700 mb-1">
                <strong>Balance Assessment:</strong>
              </p>
              <p className="text-gray-600">
                Pro Advantage: {(result.validation.proAdvantage * 100).toFixed(0)}%
              </p>
              <p className="text-gray-600">
                Confidence: {(result.validation.confidence * 100).toFixed(0)}%
              </p>
              <p className="text-gray-700 mt-2">{result.validation.reasoning}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-medium text-blue-900 mb-2">Tips for Good Topics:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure both sides can construct valid arguments</li>
          <li>• Avoid topics with overwhelming factual consensus</li>
          <li>• Frame clearly as a proposition (e.g., "This house believes...")</li>
          <li>• Make it specific enough to debate but broad enough for multiple angles</li>
        </ul>
      </div>
    </div>
  );
}
