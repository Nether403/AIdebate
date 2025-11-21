import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebateOrchestrator } from '../components/DebateOrchestrator';
import type { DebateConfig, DebateSettings } from '../types/debate';

const mockConfig: DebateConfig = {
  config_version: '1.0.0',
  global_settings: {
    voice_provider: 'google',
    model_provider: ['OpenAI'],
    model_selection: ['gpt-4'],
    model_temperature: [0.7],
    global_rules: {
      debate_rules: 'Standard rules',
      acknowledgment: 'Thank you',
      structure: {
        opening: 'Opening statement',
        rebuttal: 'Rebuttal',
        closing: 'Closing'
      },
      time_limit: '3 minutes',
      word_limit: 50
    }
  },
  personas: [
    {
      name: 'Test Persona 1',
      pov: 'Test POV 1',
      voice: { voice_name: 'test-voice-1' },
      template: 'Test template 1',
      wildcards: {},
      avatar_prompt: 'Test avatar 1'
    },
    {
      name: 'Test Persona 2',
      pov: 'Test POV 2',
      voice: { voice_name: 'test-voice-2' },
      template: 'Test template 2',
      wildcards: {},
      avatar_prompt: 'Test avatar 2'
    }
  ],
  topics: {
    'Test Category': ['Test Topic 1', 'Test Topic 2']
  }
};

const mockSettings: DebateSettings = {
  temperature: 0.7,
  darkMode: false,
  moderatorEnabled: true,
  suddenDeathEnabled: false
};

describe('DebateOrchestrator', () => {
  const mockOnSettingsChange = jest.fn();

  beforeEach(() => {
    mockOnSettingsChange.mockClear();
  });

  it('renders without crashing', () => {
    render(
      <DebateOrchestrator
        config={mockConfig}
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    
    expect(screen.getByText('AI Debate Arena')).toBeInTheDocument();
  });

  it('displays personas correctly', () => {
    render(
      <DebateOrchestrator
        config={mockConfig}
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    
    expect(screen.getByText('Test Persona 1')).toBeInTheDocument();
    expect(screen.getByText('Test Persona 2')).toBeInTheDocument();
  });

  it('allows persona selection', async () => {
    render(
      <DebateOrchestrator
        config={mockConfig}
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    
    const persona1Card = screen.getByText('Test Persona 1').closest('div');
    fireEvent.click(persona1Card!);
    
    await waitFor(() => {
      expect(persona1Card).toHaveClass('from-blue-500');
    });
  });

  it('randomizes all selections', async () => {
    render(
      <DebateOrchestrator
        config={mockConfig}
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    
    const randomizeButton = screen.getByText('Randomize All');
    fireEvent.click(randomizeButton);
    
    await waitFor(() => {
      const topicSelect = screen.getByDisplayValue(/Test Topic/);
      expect(topicSelect).toBeInTheDocument();
    });
  });

  it('toggles settings panel', async () => {
    render(
      <DebateOrchestrator
        config={mockConfig}
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Temperature')).toBeInTheDocument();
    });
  });

  it('updates settings when changed', async () => {
    render(
      <DebateOrchestrator
        config={mockConfig}
        settings={mockSettings}
        onSettingsChange={mockOnSettingsChange}
      />
    );
    
    const settingsButton = screen.getByText('Settings');
    fireEvent.click(settingsButton);
    
    await waitFor(() => {
      const temperatureSlider = screen.getByRole('slider');
      fireEvent.change(temperatureSlider, { target: { value: '0.8' } });
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...mockSettings,
        temperature: 0.8
      });
    });
  });
});