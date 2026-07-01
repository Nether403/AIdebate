'use client';

/**
 * Admin Topic Management Page
 * Interface for reviewing, approving, and retiring debate topics.
 *
 * Presentation only (Requirement 7.4): the topic fetch/generate/retire/activate/
 * validate calls are unchanged from the original. Only the markup/styling was
 * ported to the unified design language — the page renders through the shared
 * AppShell (no own nav or background, single <h1>, Requirement 2.6 / 9.2), sets
 * the top bar via `useTopBar`, and uses the shared Card/Badge/Button primitives.
 */

import { useState, useEffect } from 'react';
import { useTopBar } from '@/components/layout/TopBarContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Topic } from '@/types';

interface TopicWithValidation extends Topic {
  validation?: {
    isBalanced: boolean;
    proAdvantage: number;
    reasoning: string;
    confidence: number;
  };
}

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<TopicWithValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [generating, setGenerating] = useState(false);

  useTopBar({ breadcrumb: [{ label: 'Admin', href: '/admin' }, { label: 'Topics' }] });

  useEffect(() => {
    fetchTopics();
  }, [filter]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/topics?status=${filter}`);
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTopics = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 10 }),
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`Generated ${data.topicsGenerated} new topics`);
        fetchTopics();
      }
    } catch (error) {
      console.error('Error generating topics:', error);
      alert('Failed to generate topics');
    } finally {
      setGenerating(false);
    }
  };

  const retireTopic = async (topicId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retire', reason }),
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Topic retired successfully');
        fetchTopics();
      }
    } catch (error) {
      console.error('Error retiring topic:', error);
      alert('Failed to retire topic');
    }
  };

  const activateTopic = async (topicId: string) => {
    try {
      const response = await fetch(`/api/admin/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' }),
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Topic activated successfully');
        fetchTopics();
      }
    } catch (error) {
      console.error('Error activating topic:', error);
      alert('Failed to activate topic');
    }
  };

  const validateTopic = async (motion: string) => {
    try {
      const response = await fetch('/api/admin/topics/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motion }),
      });
      const data = await response.json();
      return data.validation;
    } catch (error) {
      console.error('Error validating topic:', error);
      return null;
    }
  };

  const handleValidateClick = async (topic: TopicWithValidation) => {
    const validation = await validateTopic(topic.motion);
    if (validation) {
      setTopics(
        topics.map((t) =>
          t.id === topic.id ? { ...t, validation } : t
        )
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Topic management</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Review, approve, and manage debate topics.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        <Button
          onClick={generateTopics}
          disabled={generating}
          size="sm"
          className="ml-auto"
        >
          {generating ? 'Generating…' : 'Generate 10 topics'}
        </Button>
      </div>

      {/* Topics List */}
      {loading ? (
        <Card>
          <p className="px-5 py-4 text-sm text-muted-foreground">Loading topics…</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {topics.map((topic) => (
            <Card key={topic.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge
                      tone={topic.isActive ? 'accent' : 'neutral'}
                    >
                      {topic.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge>{topic.category}</Badge>
                    <Badge>{topic.difficulty}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Used {topic.usageCount} times
                    </span>
                  </div>
                  <p className="mb-2 text-lg font-medium text-foreground">{topic.motion}</p>

                  {topic.validation && (
                    <div className="mt-2 rounded-md border border-border bg-background/40 p-3 text-sm">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`font-semibold ${
                            topic.validation.isBalanced
                              ? 'text-cyan-300'
                              : 'text-rose-400'
                          }`}
                        >
                          {topic.validation.isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
                        </span>
                        <span className="text-muted-foreground">
                          Pro advantage: {(topic.validation.proAdvantage * 100).toFixed(0)}%
                        </span>
                        <span className="text-muted-foreground">
                          Confidence: {(topic.validation.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-muted-foreground">{topic.validation.reasoning}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleValidateClick(topic)}>
                    Validate
                  </Button>
                  {topic.isActive ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        const reason = prompt('Reason for retiring this topic:');
                        if (reason) retireTopic(topic.id, reason);
                      }}
                    >
                      Retire
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => activateTopic(topic.id)}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {topics.length === 0 && (
            <Card>
              <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                No topics found. Generate some topics to get started.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
