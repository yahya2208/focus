import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

describe('App', () => {
  it('should render the landing screen', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: 'Landing page' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Start Now' }).length).toBeGreaterThanOrEqual(1);
  });

  it('should render all landing buttons', () => {
    render(<App />);
    expect(screen.getAllByRole('button', { name: 'Start Now' }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: 'How it works?' }).length).toBeGreaterThanOrEqual(1);
  });
});
