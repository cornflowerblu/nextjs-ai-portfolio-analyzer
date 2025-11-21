'use client';

import React from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  lastUpdated: number;
  metricsCount?: number;
}

export interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string;
  onProjectSelect: (projectId: string) => void;
  onCreateProject?: () => void;
  className?: string;
}

export function ProjectSelector({
  projects,
  selectedProjectId,
  onProjectSelect,
  onCreateProject,
  className = '',
}: ProjectSelectorProps) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between min-w-[200px] ${className}`}
          aria-label={selectedProject?.name ? `Selected project: ${selectedProject.name}` : 'Select a project from the dropdown'}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="truncate">
              {selectedProject?.name || 'Select Project'}
            </span>
            {selectedProject?.metricsCount !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {selectedProject.metricsCount}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        <DropdownMenuLabel>Select Project</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-gray-500">
            No projects available
          </div>
        ) : (
          projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => onProjectSelect(project.id)}
              className="flex items-start gap-2 py-2 cursor-pointer"
            >
              <div className="flex-shrink-0 mt-1">
                {project.id === selectedProjectId ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{project.name}</span>
                  {project.metricsCount !== undefined && project.metricsCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {project.metricsCount}
                    </Badge>
                  )}
                </div>
                {project.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>Created: {formatDate(project.createdAt)}</span>
                  {project.lastUpdated !== project.createdAt && (
                    <span>Updated: {formatDate(project.lastUpdated)}</span>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        {onCreateProject && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onCreateProject}
              className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Project</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
