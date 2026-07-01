'use client';

/**
 * Topic Submission Form
 * Allows users to submit debate topic suggestions
 *
 * Presentation only (Requirement 7.4): the state, validation, and POST to
 * /api/topics/submit are unchanged from the original — only the markup/styling
 * was ported to the unified design language (token-styled controls, shadcn
 * Card/Button, cyan focus ring, status conveyed via Badge + text). The page
 * (`app/topics/submit/page.tsx`) owns the single <h1>, so this form no longer
 * renders its own heading.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TopicCategory, TopicDifficulty } from '@/types';

// Shared token-styled control + label classes (consistent with DebateConfigForm).
const controlClass =
  'w-full rounded-md border border-input bg-input/30 px-3 py-2 text-sm text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50';
const labelClass = 'block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2';
const optionClass = 'bg-popover text-popover-foreground';

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
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="motion" className={labelClass}>
              Debate motion *
            </label>
            <textarea
              id="motion"
              value={motion}
              onChange={(e) => setMotion(e.target.value)}
              placeholder='e.g., "This house believes that artificial intelligence will do more good than harm"'
              className={controlClass}
              rows={3}
              required
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Frame as a clear proposition that can be argued from both sides
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className={labelClass}>
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TopicCategory)}
                className={controlClass}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className={optionClass}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className={labelClass}>
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as TopicDifficulty)}
                className={controlClass}
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff} className={optionClass}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full" size="lg">
            {submitting ? 'Validating & submitting…' : 'Submit topic'}
          </Button>
        </form>

        {result && (
          <div
            className={`mt-6 rounded-md border px-4 py-3 ${
              result.success
                ? 'border-cyan-500/30 bg-cyan-500/10'
                : 'border-rose-500/30 bg-rose-500/10'
            }`}
          >
            <p
              className={`font-medium ${
                result.success ? 'text-cyan-300' : 'text-rose-400'
              }`}
            >
              {result.message}
            </p>

            {result.validation && (
              <div className="mt-3 text-sm">
                <p className="mb-1 font-medium text-foreground">Balance assessment</p>
                <p className="text-muted-foreground">
                  Pro advantage: {(result.validation.proAdvantage * 100).toFixed(0)}%
                </p>
                <p className="text-muted-foreground">
                  Confidence: {(result.validation.confidence * 100).toFixed(0)}%
                </p>
                <p className="mt-2 text-muted-foreground">{result.validation.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="border-primary/20 bg-primary/[0.04] p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Tips for good topics</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Ensure both sides can construct valid arguments</li>
          <li>• Avoid topics with overwhelming factual consensus</li>
          <li>• Frame clearly as a proposition (e.g., &quot;This house believes…&quot;)</li>
          <li>• Make it specific enough to debate but broad enough for multiple angles</li>
        </ul>
      </Card>
    </div>
  );
}
