/**
 * Tests for ProjectSelector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectSelector, type Project } from '@/components/trends/project-selector';

describe('ProjectSelector', () => {
  const mockProjects: Project[] = [
    {
      id: 'project-1',
      name: 'Main Website',
      description: 'Primary production site',
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      lastUpdated: Date.now(),
      metricsCount: 1250,
    },
    {
      id: 'project-2',
      name: 'Staging',
      description: 'Staging environment',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastUpdated: Date.now() - 24 * 60 * 60 * 1000,
      metricsCount: 340,
    },
  ];

  it('renders without crashing', () => {
    const onSelect = vi.fn();
    render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId="project-1"
        onProjectSelect={onSelect}
      />
    );
  });

  it('displays selected project name', () => {
    const onSelect = vi.fn();
    render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId="project-1"
        onProjectSelect={onSelect}
      />
    );
    
    // Check that the button shows the selected project name
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Main Website');
  });

  it('displays metrics count badge', () => {
    const onSelect = vi.fn();
    render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId="project-1"
        onProjectSelect={onSelect}
      />
    );
    
    // Check that the badge is in the button
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('1250');
  });

  it('shows "Select Project" when no project selected', () => {
    const onSelect = vi.fn();
    render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId=""
        onProjectSelect={onSelect}
      />
    );
    
    expect(screen.getByText('Select Project')).toBeTruthy();
  });

  it('shows empty state when no projects available', () => {
    const onSelect = vi.fn();
    render(
      <ProjectSelector
        projects={[]}
        selectedProjectId=""
        onProjectSelect={onSelect}
      />
    );
    
    // Button should still render
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('has proper aria-label for accessibility', () => {
    const onSelect = vi.fn();
    render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId="project-1"
        onProjectSelect={onSelect}
      />
    );
    
    const button = screen.getByRole('button');
    const ariaLabel = button.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('Main Website');
  });

  it('has aria-label when no project selected', () => {
    const onSelect = vi.fn();
    render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId=""
        onProjectSelect={onSelect}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toContain('Select a project');
  });

  it('applies custom className', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <ProjectSelector
        projects={mockProjects}
        selectedProjectId="project-1"
        onProjectSelect={onSelect}
        className="custom-class"
      />
    );
    
    const button = container.querySelector('.custom-class');
    expect(button).toBeTruthy();
  });
});
