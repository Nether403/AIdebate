import React from 'react';
import { DebateOrchestrator } from './components/DebateOrchestrator';
import { useDebateConfig } from './hooks/useDebateConfig';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { DebateSettings } from './types/debate';

function App() {
  const { config, loading, error } = useDebateConfig();
  const [settings, setSettings] = useLocalStorage<DebateSettings>('debate-settings', {
    temperature: 0.7,
    darkMode: false,
    moderatorEnabled: true,
    suddenDeathEnabled: false
  });

  // Apply dark mode to document
  React.useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading debate configuration...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Configuration Error</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <DebateOrchestrator
      config={config}
      settings={settings}
      onSettingsChange={setSettings}
    />
  );
}

export default App;