import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScoreGauge } from '../components/ScoreGauge';

describe('ScoreGauge', () => {
  it('renders with correct score', () => {
    render(<ScoreGauge score={7.5} label="Test Player" />);
    
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText('7.5')).toBeInTheDocument();
  });

  it('calculates percentage correctly', () => {
    render(<ScoreGauge score={8} maxScore={10} label="Test Player" />);
    
    expect(screen.getByText('80% of maximum')).toBeInTheDocument();
  });

  it('handles zero score', () => {
    render(<ScoreGauge score={0} label="Test Player" />);
    
    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.getByText('0% of maximum')).toBeInTheDocument();
  });

  it('caps at 100% for scores above maximum', () => {
    render(<ScoreGauge score={15} maxScore={10} label="Test Player" />);
    
    expect(screen.getByText('100% of maximum')).toBeInTheDocument();
  });
});