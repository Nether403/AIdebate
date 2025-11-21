'use client';

/**
 * Admin Topic Management Page
 * Interface for reviewing, approving, and retiring debate topics
 */

import { useState, useEffect } from 'react';
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
  const [selectedTopic, setSelectedTopic] = useState<TopicWithValidation | null>(null);

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
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Topic Management</h1>
        <p className="text-gray-600">
          Review, approve, and manage debate topics
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded ${
              filter === 'inactive'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Inactive
          </button>
        </div>

        <button
          onClick={generateTopics}
          disabled={generating}
          className="ml-auto px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {generating ? 'Generating...' : 'Generate 10 Topics'}
        </button>
      </div>

      {/* Topics List */}
      {loading ? (
        <div className="text-center py-12">Loading topics...</div>
      ) : (
        <div className="space-y-4">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        topic.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {topic.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {topic.category}
                    </span>
                    <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                      {topic.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      Used {topic.usageCount} times
                    </span>
                  </div>
                  <p className="text-lg font-medium mb-2">{topic.motion}</p>
                  
                  {topic.validation && (
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-semibold ${
                            topic.validation.isBalanced
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {topic.validation.isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
                        </span>
                        <span className="text-gray-600">
                          Pro Advantage: {(topic.validation.proAdvantage * 100).toFixed(0)}%
                        </span>
                        <span className="text-gray-600">
                          Confidence: {(topic.validation.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-gray-700">{topic.validation.reasoning}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleValidateClick(topic)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Validate
                  </button>
                  {topic.isActive ? (
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for retiring this topic:');
                        if (reason) retireTopic(topic.id, reason);
                      }}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Retire
                    </button>
                  ) : (
                    <button
                      onClick={() => activateTopic(topic.id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {topics.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No topics found. Generate some topics to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
