// src/features/sprints/pages/SprintPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useSprints } from '../hooks/useSprints';
import { useDeleteSprint } from '../hooks/useDeleteSprint';
import { openCreateSprintModal } from '../slices/sprintSlice';
import { Plus, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

import {
    getProjectByKey,
} from '../../projects';

import CreateSprintModal from '../components/CreateSprintModal';

import BreadcrumbNav from '../../../components/layout/components/BreadcrumbNav';

const SprintPage = () => {
    const { projectId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('');

    const { data: sprints, isLoading, isError, error } = useSprints(projectId, { status: statusFilter });

    const { isCreateSprintModalOpen } = useSelector((state) => state.sprint);

    // --- Role-based Access Control ---
    const { user } = useSelector(state => state.auth);
    const isViewer = user?.companyRole === 'VIEWER';
    const restrictedTitle = "Restricted access: Viewers cannot modify sprints";

    // --- Redux State for Breadcrumbs ---
    const { currentProject } = useSelector(state => state.projects);
    const project = currentProject?.project;

    // Fetch project details if not already loaded or if projectId changed
    useEffect(() => {
        if (projectId && (!project || project.key !== projectId)) {
            dispatch(getProjectByKey(projectId));
        }
    }, [dispatch, projectId, project]);

    // Auto-Navigation for context mismatch
    useEffect(() => {
        const errorStatus = error?.response?.status || error?.status;
        if (error && (errorStatus === 403 || errorStatus === 404)) {
            console.warn("SprintPage: Fetch error detected (likely context mismatch). Redirecting...");
            navigate('/projects');
        }
    }, [error, navigate]);

    const deleteSprintMutation = useDeleteSprint(projectId);

    const handleDeleteSprint = (sprint) => {
        if (isViewer) return;
        if (window.confirm(`Are you sure you want to delete the sprint "${sprint.title}"?`)) {
            deleteSprintMutation.mutate(sprint.id);
        }
    };

    const renderSprints = () => {
        if (isLoading) return <p className="text-gray-500 dark:text-gray-400 mt-4">Loading sprints...</p>;
        if (isError) return <p className="text-red-500 mt-4">Error: {error.message}</p>;

        if (!sprints || sprints.length === 0) {
            return (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg mt-6">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No sprints yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new sprint.</p>
                    <div className="mt-6">
                        <button
                            onClick={() => !isViewer && dispatch(openCreateSprintModal())}
                            type="button"
                            disabled={isViewer}
                            title={isViewer ? restrictedTitle : ""}
                            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isViewer ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Create Sprint
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-6">Title</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Schedule</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Goal</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                                    {sprints.map((sprint) => (
                                        <tr key={sprint.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-6">
                                                <Link
                                                    to={`/projects/${projectId}/sprints/${sprint.id}`}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
                                                >
                                                    {sprint.title}
                                                </Link>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${sprint.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                                                    : sprint.status === 'COMPLETED'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200'
                                                    }`}>
                                                    {sprint.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-xs text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <span>{format(new Date(sprint.startDate), 'MMM d')}</span>
                                                    <span>-</span>
                                                    <span>{format(new Date(sprint.endDate), 'MMM d, yyyy')}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                {sprint.goal || <span className="italic text-gray-300 dark:text-gray-600 text-xs">No goal defined</span>}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button
                                                    onClick={() => handleDeleteSprint(sprint)}
                                                    disabled={isViewer}
                                                    title={isViewer ? restrictedTitle : "Delete Sprint"}
                                                    className={isViewer ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900">
            <BreadcrumbNav />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sprints</h1>
                <button
                    onClick={() => !isViewer && dispatch(openCreateSprintModal())}
                    disabled={isViewer}
                    title={isViewer ? restrictedTitle : ""}
                    className={`px-4 py-2 font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${isViewer
                        ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                >
                    Create Sprint
                </button>
            </div>

            {renderSprints()}

            {isCreateSprintModalOpen && <CreateSprintModal projectId={projectId} />}
        </div>
    );
};

export default SprintPage;