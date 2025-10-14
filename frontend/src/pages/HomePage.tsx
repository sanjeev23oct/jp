/**
 * HomePage - Project list and management
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useModeStore } from '../store/useModeStore';
import { Plus, Search, Loader } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoading, loadProjects, createProject } = useProjectStore();
  const { mode } = useModeStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async () => {
    try {
      const projectType = mode === 'ba' ? 'requirements' : 'prototype';
      const project = await createProject({
        name: 'Untitled Project',
        description: mode === 'ba' ? 'A new requirements document' : 'A new prototype',
        type: projectType,
        html: '',
        css: '',
        js: ''
      });
      navigate(`/editor/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Prototypes</h1>
              <p className="text-sm text-gray-500 mt-1">
                Create and manage your HTML prototypes
              </p>
            </div>
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              New Prototype
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search prototypes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Project Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-gray-400" size={32} />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <div>
                <p className="text-gray-500 text-lg">No prototypes found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-lg mb-4">
                  You haven't created any prototypes yet
                </p>
                <button
                  onClick={handleCreateProject}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  Create your first prototype
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
