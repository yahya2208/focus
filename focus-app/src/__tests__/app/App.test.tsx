import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

describe('App', () => {
  it('should render the home screen', () => {
    render(<App />);
    expect(screen.getByText('FOCUS')).toBeTruthy();
    expect(screen.getByText('Start Measurement')).toBeTruthy();
  });

  it('should render all navigation buttons', () => {
    render(<App />);
    expect(screen.getByText('Start Measurement')).toBeTruthy();
    expect(screen.getByText('Session History')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
  });
});
