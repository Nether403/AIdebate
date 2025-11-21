import { useState, useEffect } from 'react';
import type { DebateConfig } from '../types/debate';
import { validateDebateConfig } from '../utils/configValidator';
import debateConfigData from '../config/debate_config.json';

export function useDebateConfig() {
  const [config, setConfig] = useState<DebateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (validateDebateConfig(debateConfigData)) {
        setConfig(debateConfigData);
      } else {
        setError('Invalid configuration format');
      }
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  return { config, loading, error };
}