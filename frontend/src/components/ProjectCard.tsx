/**
 * ProjectCard - Individual project card in the grid
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { MoreVertical, Trash2, Copy, Edit2, ExternalLink } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  updated_at: Date;
}

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  const { deleteProject, duplicateProject } = useProjectStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpen = () => {
    navigate(`/editor/${project.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${project.name}"?`)) {
      setIsDeleting(true);
      try {
        await deleteProject(project.id);
      } catch (error) {
        console.error('Failed to delete project:', error);
        setIsDeleting(false);
      }
    }
    setShowMenu(false);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await duplicateProject(project.id);
    } catch (error) {
      console.error('Failed to duplicate project:', error);
    }
    setShowMenu(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  if (isDeleting) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 opacity-50">
        <div className="text-center text-gray-500">Deleting...</div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group relative"
      onClick={handleOpen}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ExternalLink size={48} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          
          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={18} className="text-gray-600" />
            </button>
            
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                  <button
                    onClick={handleOpen}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    Open
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Copy size={16} />
                    Duplicate
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-400">
          Updated {formatDate(project.updated_at)}
        </div>
      </div>
    </div>
  );
};
