import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEpicDetails } from '../hooks/useEpicDetails';
import { useEpicIssues } from '../hooks/useEpicIssues';
import { useUpdateEpic } from '../hooks/useUpdateEpic';
import { useDeleteEpic } from '../hooks/useDeleteEpic';
import StatusBadge from '../components/StatusBadge';
import { FileText, User, Calendar, GitCommit, CheckSquare, List, Edit, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getProjectByKey } from '../../projects';
import EpicFormModal from '../components/EpicFormModal';

/**
 * A reusable confirmation modal for deletion.
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

const EpicDetailPage = () => {
    const { epicId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const { data: epicData, isLoading: isLoadingEpic, isError: isErrorEpic, error: epicError } = useEpicDetails(epicId);

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: '',
        ownerUserId: '',
        startDate: '',
        endDate: ''
    });

    // --- Role-based Access Control ---
    const { user } = useSelector(state => state.auth);
    const isViewer = user?.companyRole === 'VIEWER';
    const restrictedTitle = "Restricted access: Viewers cannot modify epics";

    // Auto-Navigation for context mismatch
    useEffect(() => {
        const errorStatus = epicError?.response?.status || epicError?.status;
        if (epicError && (errorStatus === 403 || errorStatus === 404)) {
            console.warn("EpicDetailPage: Fetch error detected. Redirecting...");
            navigate('/projects');
        }
    }, [epicError, navigate]);
    const { data: issuesData, isLoading: isLoadingIssues, isError: isErrorIssues, error: issuesError } = useEpicIssues(epicId);

    const updateMutation = useUpdateEpic(epicData?.project?.key);
    const deleteMutation = useDeleteEpic(epicData?.project?.key);

    const handleSaveEpic = () => {
        // Sanitize data: convert empty strings to null for optional date fields
        const sanitizedData = {
            ...formData,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            ownerUserId: formData.ownerUserId || null
        };
        updateMutation.mutate({ epicId, ...sanitizedData }, {
            onSuccess: () => setIsEditing(false),
        });
    };

    const handleCancelEdit = () => {
        if (epicData) {
            setFormData({
                title: epicData.title || '',
                description: epicData.description || '',
                status: epicData.status || 'OPEN',
                ownerUserId: epicData.ownerUserId || '',
                startDate: epicData.startDate ? new Date(epicData.startDate).toISOString().split('T')[0] : '',
                endDate: epicData.endDate ? new Date(epicData.endDate).toISOString().split('T')[0] : ''
            });
        }
        setIsEditing(false);
    };

    useEffect(() => {
        if (epicData) {
            setFormData({
                title: epicData.title || '',
                description: epicData.description || '',
                status: epicData.status || 'OPEN',
                ownerUserId: epicData.ownerUserId || '',
                startDate: epicData.startDate ? new Date(epicData.startDate).toISOString().split('T')[0] : '',
                endDate: epicData.endDate ? new Date(epicData.endDate).toISOString().split('T')[0] : ''
            });
        }
    }, [epicData]); // synced metadata

    const handleConfirmDelete = (id) => {
        deleteMutation.mutate(id, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                navigate(`/projects/${epicData?.project?.key}/epics`);
            },
        });
    };

    // --- FIX: Assign epicData directly to the epic variable ---
    const epic = epicData;
    const issues = issuesData || [];

    // --- Redux State for Breadcrumbs ---
    const { currentProject } = useSelector(state => state.projects);
    const project = currentProject?.project;

    // Fetch project details once epic is loaded
    useEffect(() => {
        if (epic?.project?.key && (!project || project.key !== epic.project.key)) {
            dispatch(getProjectByKey(epic.project.key));
        }
    }, [dispatch, epic, project]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const progressStats = useMemo(() => {
        if (!issues || issues.length === 0) {
            return { total: 0, done: 0, percentage: 0 };
        }
        const total = issues.length;
        const done = issues.filter(issue => issue.status === 'COMPLETED').length;
        const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
        return { total, done, percentage };
    }, [issues]);

    if (isLoadingEpic) {
        return <div className="p-8 text-center">Loading epic details...</div>;
    }

    if (isErrorEpic) {
        return <div className="p-8 text-center text-red-500">Error loading epic: {epicError.message}</div>;
    }

    if (!epic) {
        // This check will now correctly pass once data is loaded
        return <div className="p-8 text-center">Epic not found.</div>
    }

    return (
        <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <BreadcrumbNav />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-grow">
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Epic</p>
                    {isEditing ? (
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 w-full focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>
                    ) : (
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-4">
                            <span>{epic.title}</span>
                            <StatusBadge status={epic.status} />
                        </h1>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveEpic}
                                disabled={updateMutation.isLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                            >
                                <span>{updateMutation.isLoading ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-sm font-medium shadow-sm transition-colors"
                            >
                                <span>Cancel</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => !isViewer && setIsEditing(true)}
                                disabled={isViewer}
                                title={isViewer ? restrictedTitle : "Edit Epic"}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isViewer ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'}`}
                            >
                                <Edit size={16} />
                                <span>Edit</span>
                            </button>
                            <button
                                onClick={() => !isViewer && setIsDeleteModalOpen(true)}
                                disabled={isViewer}
                                title={isViewer ? restrictedTitle : "Delete Epic"}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isViewer ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 shadow-sm'}`}
                            >
                                <Trash2 size={16} />
                                <span>Delete</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>Owner:</span>
                        <select
                            name="ownerUserId"
                            value={formData.ownerUserId}
                            onChange={handleInputChange}
                            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">Unassigned</option>
                            {project?.members?.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.displayName} ({member.email})
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <>
                        {epic.owner && (
                            <div className="flex items-center gap-2">
                                <User size={16} />
                                <span>Owner: <strong>{epic.owner.displayName || epic.owner.username}</strong></span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Progress and Description */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <FileText size={20} />
                        Description
                    </h2>
                    {isEditing ? (
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={8}
                            className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 whitespace-pre-wrap focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter epic description..."
                        />
                    ) : (
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {epic.description || 'No description provided.'}
                        </p>
                    )}
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <GitCommit size={20} />
                        Progress
                    </h2>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div
                            className="bg-indigo-600 h-4 rounded-full text-xs font-medium text-blue-100 text-center p-0.5 leading-none"
                            style={{ width: `${progressStats.percentage}%` }}
                        >
                            {progressStats.percentage > 10 && `${progressStats.percentage}%`}
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex justify-between">
                        <span>{progressStats.percentage}% Complete</span>
                        <span><strong>{progressStats.done}</strong> of <strong>{progressStats.total}</strong> issues</span>
                    </div>

                    {/* Date Section (Display or Edit) */}
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar size={16} className="text-indigo-500" />
                            <div className="flex flex-col flex-grow">
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Start Date</span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                ) : (
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {epic.startDate ? new Date(epic.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'TBD'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar size={16} className="text-rose-500" />
                            <div className="flex flex-col flex-grow">
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">Due Date</span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                ) : (
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                        {epic.endDate ? new Date(epic.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'TBD'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Issues List */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <List size={20} />
                    Issues in this Epic
                </h2>

                {isLoadingIssues && (
                    <div className="text-center py-4 text-gray-500">Loading issues...</div>
                )}

                {isErrorIssues && (
                    <div className="text-center text-red-500 py-4">Error loading issues: {issuesError.message}</div>
                )}

                {!isLoadingIssues && !isErrorIssues && (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {issues.length > 0 ? issues.map(issue => (
                            <li key={issue.id} className="py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {issue.status === 'COMPLETED' ? <CheckSquare size={16} className="text-green-500" /> : <CheckSquare size={16} className="text-gray-400" />}
                                    <Link to={`/issues/${issue.id}`} className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                                        {issue.title}
                                    </Link>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{issue.assignee?.displayName || issue.assignee?.username || 'Unassigned'}</span>
                                    <span>{issue.status.replace('_', ' ')}</span>
                                </div>
                            </li>
                        )) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">No issues have been added to this epic yet.</p>
                        )}
                    </ul>
                )}
            </div>

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                epic={epic}
                isLoading={deleteMutation.isLoading}
            />
        </div >
    );
};

export default EpicDetailPage;