import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';

import {
  fetchProjects,
  createProject,
  ProjectListSkeleton,
} from '../';

import { FiExternalLink, FiGrid, FiLayers, FiList } from 'react-icons/fi';

const ProjectList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading, error: projectsError } = useSelector(state => state.projects);
  const { user } = useSelector(state => state.auth); // Get user to access activeCompanyId
  const activeCompanyId = user?.activeCompanyId || null;
  const { theme } = useTheme();

  // Determine if the user has permission to create projects
  const canCreateProject = !activeCompanyId || ['MANAGER', 'ADMIN', 'OWNER'].includes(user?.companyRole);

  useEffect(() => {
    // Auto-Navigation for context mismatch
    if (projectsError && (projectsError.status === 404 || projectsError.status === 403)) {
      console.warn("ProjectList: Fetch error detected (likely context mismatch). Refreshing...");
      // For the main list, a context mismatch often clears when fetching fresh data for the new context.
      // But if we persist in error, maybe just clear local state or something.
      // Actually, fetching fresh data is what `fetchProjects` does. 
      // If we get 403/404 here, it might be that the context switch hasn't fully propagated or the token is invalid.
    }
  }, [projectsError]);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortOrder, setSortOrder] = useState('created_desc');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    } else {
      // Re-fetch whenever activeCompanyId changes
      dispatch(fetchProjects(showArchived));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, activeCompanyId, showArchived]); // Add activeCompanyId dependency

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (newProjectName.trim() && newProjectKey.trim()) {
      // +++ Create the data object to be sent +++
      const projectData = {
        name: newProjectName,
        key: newProjectKey,
        description: '',
      };

      // +++ ADD THIS LOG to see the request payload before it's sent +++
      console.log('[ProjectList] Dispatching createProject with payload:', projectData);

      setIsCreating(true);
      try {
        await dispatch(createProject(projectData)).unwrap();
        setNewProjectName('');
        setNewProjectKey('');
      } catch (createError) {
        console.error("Failed to create project:", createError);
        const errorMessage = createError?.message || (typeof createError === 'string' ? createError : 'An unknown error occurred.');
        alert(`Failed to create project: ${errorMessage}`);
      } finally {
        setIsCreating(false);
      }
    } else {
      alert('Please provide both a project name and key.');
    }
  };

  // Function to render the main content (skeleton, error, or project list)
  const renderContent = () => {
    const isLoading = projectsLoading && (!projects || projects.length === 0);

    if (isLoading) {
      return <ProjectListSkeleton />;
    }

    if (projectsError) {
      return (
        <div className="p-4 text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-md w-full">
          Error loading projects: {projectsError.message || String(projectsError)}
        </div>
      );
    }

    // Custom keyframes for gravity bounce effect
    const gravityBounceXKeyframes = `
      @keyframes gravity-bounce-x {
        0% { transform: translateX(0); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
        40% { transform: translateX(12px); animation-timing-function: ease-in; }
        48% { transform: translateX(0); animation-timing-function: ease-out; }
        53% { transform: translateX(4px); animation-timing-function: ease-in-out; }
        58% { transform: translateX(0); }
        100% { transform: translateX(0); }
      }
    `;

    const sortedProjects = [...(projects || [])].sort((a, b) => {
      if (sortOrder === 'name_asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name_desc') return b.name.localeCompare(a.name);
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createAt || b.created_at || 0);
      if (sortOrder === 'created_desc') return dateB - dateA;
      if (sortOrder === 'created_asc') return dateA - dateB;
      return 0;
    });

    return (
      <div className="flex flex-col gap-6">
        <style>{gravityBounceXKeyframes}</style>

        {/* --- Top Bar Start --- */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch w-full gap-4">

          {/* Left Side: Empty State Bubble - Takes available space */}
          {!projectsLoading && (!projects || projects.length === 0) ? (
            <div className="flex-grow flex">
              {/* Removed "w-full" to allow flex-grow to handle width naturally with the sibling elements */}
              <div className="flex-grow relative bg-white dark:bg-gray-800 px-6 rounded-lg shadow-lg border border-indigo-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 h-auto sm:h-12 py-2 sm:py-0">
                <div className="flex items-center gap-4 w-full">
                  {/* Gravity Bounce Title - Static for non-managers */}
                  <h3
                    className="text-lg font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap flex-shrink-0"
                    style={canCreateProject ? { animation: 'gravity-bounce-x 2.5s infinite' } : {}}
                  >
                    Get Started!
                  </h3>
                  {/* description based on role */}
                  <span className="text-gray-600 dark:text-gray-300 text-sm truncate">
                    {canCreateProject
                      ? "To get started, create your first project below."
                      : "Projects will show below once you are added to your first one!"}
                  </span>
                </div>

                {/* Arrow pointing down - only if we can create project below */}
                {canCreateProject && (
                  <div className="absolute -bottom-2 left-10 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white dark:border-t-gray-800"></div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-grow"></div>
          )}

          {/* Right Side: Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-shrink-0">

            {/* Sort Dropdown - Wrapped to match the exact height and style of the toggle */}
            <div className="relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm h-12 flex items-center min-w-[200px]">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="appearance-none bg-transparent border-none text-gray-700 dark:text-gray-300 w-full h-full pl-4 pr-10 text-sm focus:ring-0 focus:outline-none cursor-pointer font-medium"
              >
                <option value="name_asc">A to Z</option>
                <option value="name_desc">Z to A</option>
                <option value="created_desc">Newest to Oldest</option>
                <option value="created_asc">Oldest to Newest</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
              </div>
            </div>

            {/* Archived Toggle - Fixed Height h-12 to match Sort Dropdown */}
            <div className="h-12 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm flex items-center justify-between px-4 gap-3 min-w-[180px]">
              <span className={`text-sm font-medium transition-colors whitespace-nowrap ${showArchived ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {showArchived ? 'Showing Archived' : 'Show Archived'}
              </span>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`${showArchived ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
                aria-pressed={showArchived}
                role="switch"
              >
                <span className="sr-only">Toggle archived projects</span>
                <span
                  className={`${showArchived ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>

          </div>
        </div>
        {/* --- Top Bar End --- */}

        <div className="flex flex-wrap gap-6">
          {/* Card for Creating a New Project */}
          {canCreateProject && (
            <div className="w-96">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col h-full border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <div className="p-6 flex-grow">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs">+</span>
                    Create Project
                  </h2>
                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      required
                      disabled={projectsLoading || isCreating}
                      className="block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 dark:focus:ring-indigo-500 sm:text-sm disabled:opacity-70"
                    />
                    <input
                      type="text"
                      placeholder="Project Key (e.g., PROJ)"
                      value={newProjectKey}
                      onChange={(e) => setNewProjectKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      maxLength={10}
                      required
                      disabled={projectsLoading || isCreating}
                      className="block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 dark:focus:ring-indigo-500 sm:text-sm disabled:opacity-70"
                    />
                    <button
                      type="submit"
                      disabled={projectsLoading || isCreating}
                      className="w-full inline-flex justify-center items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-colors duration-150 ease-in-out"
                    >
                      {isCreating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating...
                        </>
                      ) : 'Create Project'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* List of Existing Projects */}
          {sortedProjects && sortedProjects.length > 0 && sortedProjects.map(project => (
            <div className="w-96" key={project.id}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col h-full">
                <div className="p-6 flex-grow">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 truncate" title={project.name}>
                    {project.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Key: {project.key}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {project.description || 'No description provided.'}
                  </p>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-start space-x-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project.key}`)}
                      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors duration-150 ease-in-out"
                      title="View Project Details"
                    >
                      <FiExternalLink className="mr-1 h-4 w-4" />
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/board/${project.key}`)}
                      className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-150 ease-in-out"
                      title="Go to Project Board"
                    >
                      <FiGrid className="mr-1 h-4 w-4" />
                      Board
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project.key}/epics`)}
                      className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors duration-150 ease-in-out"
                      title="View Project Epics"
                    >
                      <FiLayers className="mr-1 h-4 w-4" />
                      Epics
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${project.key}/sprints`)}
                      className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors duration-150 ease-in-out"
                      title="View Project Sprints"
                    >
                      <FiList className="mr-1 h-4 w-4" />
                      Sprints
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProjectList;