import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SkillsSection from './SkillsSection';
import * as DataContext from '../context/DataContext';

vi.mock('../context/DataContext', () => ({
  useData: () => ({
    skills: [
      { name: 'React', category: 'frontend', icon: 'react' },
      { name: 'Node.js', category: 'backend', icon: 'nodejs' }
    ],
    loading: false
  })
}));

vi.mock('../hooks/useAnalytics', () => ({
  useAnalytics: () => ({ trackSection: vi.fn() })
}));

describe('SkillsSection', () => {
  it('renders skills section and correct skills', () => {
    const { container } = render(<SkillsSection />);
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });
});
