import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

describe('App', () => {
  it('should render the home screen by default', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start Assessment' })).toBeTruthy();
  });

  it('should render all home screen buttons', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Start Assessment' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'History' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'About' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'AI Coach' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Phone Services' })).toBeTruthy();
  });
});
