import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, MoreVertical, Edit, Trash2, GitMerge, FileText, Calendar, Circle, CheckCircle, XCircle, Clock } from 'lucide-react';

import { useEpics } from '../hooks/useEpics';
import { useCreateEpic } from '../hooks/useCreateEpic';
import { useUpdateEpic } from '../hooks/useUpdateEpic';
import { useDeleteEpic } from '../hooks/useDeleteEpic';

import {
    getProjectByKey,
    clearProjectFetchError,
} from '../../projects';

// Component imports
import EpicFormModal from '../components/EpicFormModal';
import StatusBadge from '../components/StatusBadge';

/**
 * A reusable confirmation modal for deletion.
 * In a real project, this would be in its own file: ../components/DeleteConfirmModal.jsx
 */
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, epic, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-60 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 m-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                        <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                            Delete Epic
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Are you sure you want to delete the epic "<strong>{epic?.title}</strong>"?
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                All associated issues will be unlinked. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button type="button" disabled={isLoading} onClick={() => onConfirm(epic.id)} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                    <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

import BreadcrumbNav from '../../../components/layout/components/BreadcrumbNav';

/**
 * The main page component for displaying a list of Epics.
 */
const EpicsPage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEpic, setEditingEpic] = useState(null);
    const [epicToDelete, setEpicToDelete] = useState(null);

    // --- Role-based Access Control ---
    const { user } = useSelector(state => state.auth);
    const isViewer = user?.companyRole === 'VIEWER';
    const restrictedTitle = "Restricted access: Viewers cannot modify epics";

    // --- Redux State for Breadcrumbs ---
    const { currentProject } = useSelector(state => state.projects);
    const project = currentProject?.project;

    // Fetch project details if not already loaded or if projectId changed
    useEffect(() => {
        if (projectId && (!project || project.key !== projectId)) {
            dispatch(getProjectByKey(projectId));
        }
    }, [dispatch, projectId, project]);

    // --- React Query Hooks ---
    const { data: epicsData, isLoading, isError, error } = useEpics(projectId);
    const createMutation = useCreateEpic(projectId);

    // Auto-Navigation for context mismatch
    useEffect(() => {
        const errorStatus = error?.response?.status || error?.status;
        if (error && (errorStatus === 403 || errorStatus === 404)) {
            console.warn("EpicPage: Fetch error detected (likely context mismatch). Redirecting...");
            navigate('/projects');
        }
    }, [error, navigate]);
    const updateMutation = useUpdateEpic(projectId);
    const deleteMutation = useDeleteEpic(projectId);

    // --- Handlers ---
    const handleOpenCreateModal = () => {
        setEditingEpic(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (epic) => {
        setEditingEpic(epic);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEpic(null);
    };

    const handleSaveEpic = (formData) => {
        if (editingEpic) {
            updateMutation.mutate({ epicId: editingEpic.id, ...formData }, {
                onSuccess: () => handleCloseModal(),
            });
        } else {
            createMutation.mutate({ projectId, ...formData }, {
                onSuccess: () => handleCloseModal(),
            });
        }
    };

    const handleConfirmDelete = (epicId) => {
        deleteMutation.mutate(epicId, {
            onSuccess: () => setEpicToDelete(null),
        });
    };

    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) {
            return <p className="text-gray-500 dark:text-gray-400 mt-4">Loading epics...</p>;
        }

        if (isError) {
            return <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20 mt-4">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Failed to load epics</h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-200">{error.message}</p>
            </div>;
        }

        const epics = epicsData?.epics || [];

        if (!epicsData || epics.length === 0) {
            return (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg mt-6">
                    <GitMerge className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No epics yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new epic.</p>
                    <div className="mt-6">
                        <button
                            onClick={handleOpenCreateModal}
                            type="button"
                            disabled={isViewer}
                            title={isViewer ? restrictedTitle : ""}
                            className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isViewer ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Create Epic
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
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Owner</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Issues</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800/50">
                                    {epics.map((epic) => (
                                        <tr key={epic.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-100 sm:pl-6">
                                                <Link
                                                    to={`/epics/${epic.id}`}
                                                    style={{ textDecoration: 'none' }}
                                                    className="hover:text-indigo-600 dark:hover:text-indigo-400"
                                                >
                                                    {epic.title}
                                                </Link>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><StatusBadge status={epic.status} /></td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{epic.owner?.displayName || epic.owner?.username || 'Unassigned'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">{epic.issueCount || 0}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button
                                                    onClick={() => !isViewer && handleOpenEditModal(epic)}
                                                    disabled={isViewer}
                                                    title={isViewer ? restrictedTitle : ""}
                                                    className={`${isViewer ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300'} mr-4`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => !isViewer && setEpicToDelete(epic)}
                                                    disabled={isViewer}
                                                    title={isViewer ? restrictedTitle : ""}
                                                    className={isViewer ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'}
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

            <div className="sm:flex sm:items-center w-full">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Epics</h1>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
                        A list of all the epics in this project. Epics are large bodies of work that can be broken down into a number of smaller tasks.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-auto sm:flex-none">
                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        disabled={isViewer}
                        title={isViewer ? restrictedTitle : ""}
                        className={`inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto ${isViewer ? 'bg-gray-400 cursor-not-allowed opacity-60' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        New Epic
                    </button>
                </div>
            </div>
            {renderContent()}

            <EpicFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveEpic}
                epicToEdit={editingEpic}
                members={project?.members || []}
                isLoading={createMutation.isLoading || updateMutation.isLoading}
            />

            <DeleteConfirmModal
                isOpen={!!epicToDelete}
                onClose={() => setEpicToDelete(null)}
                onConfirm={handleConfirmDelete}
                epic={epicToDelete}
                isLoading={deleteMutation.isLoading}
            />
        </div>
    );
};

export default EpicsPage;