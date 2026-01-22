// src/features/sprints/components/SprintListItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDeleteSprint } from '../hooks/useDeleteSprint';
import { format } from 'date-fns';

const SprintListItem = ({ sprint, projectId }) => {
    const deleteSprintMutation = useDeleteSprint(projectId);

    // --- Role-based Access Control ---
    const { user } = useSelector(state => state.auth);
    const isViewer = user?.companyRole === 'VIEWER';
    const restrictedTitle = "Restricted access: Viewers cannot modify sprints";

    const handleDelete = (e) => {
        e.preventDefault();
        if (isViewer) return;
        if (window.confirm(`Are you sure you want to delete the sprint "${sprint.title}"?`)) {
            deleteSprintMutation.mutate(sprint.id);
        }
    };

    return (
        <Link
            to={`/projects/${projectId}/sprints/${sprint.id}`}
            style={{ textDecoration: 'none' }}
            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">{sprint.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{sprint.goal}</p>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-4">
                    <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${sprint.status === 'ACTIVE' ? 'bg-green-500' : sprint.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                        {sprint.status}
                    </span>
                    <button
                        onClick={handleDelete}
                        disabled={isViewer}
                        className={`${isViewer ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}
                        title={isViewer ? restrictedTitle : "Delete Sprint"}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                <span>{format(new Date(sprint.startDate), 'MMM d')}</span> - <span>{format(new Date(sprint.endDate), 'MMM d, yyyy')}</span>
            </div>
        </Link>
    );
};

export default SprintListItem;