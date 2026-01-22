// src/features/sprints/pages/SprintDetailPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getProjectByKey } from '../../projects';
import { useSprintDetails } from '../hooks/useSprintDetails';
import { useSprintIssues } from '../hooks/useSprintIssues';
import { useUpdateSprint } from '../hooks/useUpdateSprint';
import { format } from 'date-fns';
import { Edit, Save, X, Calendar, Flag, List, ClipboardList, CheckCircle2 } from 'lucide-react';

import SprintIssueList from '../components/SprintIssueList';

import BreadcrumbNav from '../../../components/layout/components/BreadcrumbNav';

const SprintDetailPage = () => {
    // This will correctly get both parameters from the URL
    // e.g. /projects/DEV/sprints/sprint123
    const { projectId, sprintId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isVisible, setIsVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        goal: '',
        startDate: '',
        endDate: ''
    });

    React.useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const { currentProject } = useSelector(state => state.projects);
    const project = currentProject?.project;

    // --- Role-based Access Control ---
    const { user } = useSelector(state => state.auth);
    const isViewer = user?.companyRole === 'VIEWER';
    const restrictedTitle = "Restricted access: Viewers cannot modify sprints";

    // Fetch project details if missing
    React.useEffect(() => {
        if (projectId && (!project || project.key !== projectId)) {
            dispatch(getProjectByKey(projectId));
        }
    }, [dispatch, projectId, project]);

    const { data: sprint, isLoading, isError, error } = useSprintDetails(sprintId);
    const { data: issues, isLoading: isLoadingIssues } = useSprintIssues(sprintId);
    const updateSprintMutation = useUpdateSprint();

    // Sync formData with sprint data
    React.useEffect(() => {
        if (sprint) {
            setFormData({
                title: sprint.title || '',
                goal: sprint.goal || '',
                startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
                endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : ''
            });
        }
    }, [sprint]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSprint = () => {
        updateSprintMutation.mutate({
            sprintId,
            data: {
                title: formData.title,
                goal: formData.goal,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            },
            projectId: project?.key || projectId
        }, {
            onSuccess: () => setIsEditing(false)
        });
    };

    const handleCancelEdit = () => {
        if (sprint) {
            setFormData({
                title: sprint.title || '',
                goal: sprint.goal || '',
                startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
                endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : ''
            });
        }
        setIsEditing(false);
    };

    const handleUpdateStatus = (newStatus) => {
        updateSprintMutation.mutate({
            sprintId,
            data: { status: newStatus },
            projectId: projectId // Pass the correct projectId for query invalidation
        });
    };

    // Auto-Navigation for context mismatch
    React.useEffect(() => {
        const errorStatus = error?.response?.status || error?.status;
        if (error && (errorStatus === 403 || errorStatus === 404)) {
            console.warn("SprintDetailPage: Fetch error detected. Redirecting...");
            navigate('/projects');
        }
    }, [error, navigate]);

    if (isLoading) return <div className="p-8 text-center">Loading sprint details...</div>;
    if (isError) return <div className="p-8 text-center text-red-500">Error: {error?.message}</div>;
    if (!sprint) return <div className="p-8 text-center">Sprint not found.</div>;

    return (
        <div className={`h-full flex flex-col bg-gray-50 dark:bg-gray-900 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <BreadcrumbNav />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex-grow">
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Sprint</p>
                    {isEditing ? (
                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 w-full focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Sprint Title"
                            />
                        </div>
                    ) : (
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-4">
                            <span>{sprint.title}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${sprint.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                                : sprint.status === 'COMPLETED'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                }`}>
                                {sprint.status}
                            </span>
                        </h1>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveSprint}
                                disabled={updateSprintMutation.isLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                            >
                                <Save size={16} />
                                <span>{updateSprintMutation.isLoading ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-sm font-medium shadow-sm transition-colors"
                            >
                                <X size={16} />
                                <span>Cancel</span>
                            </button>
                        </>
                    ) : (
                        <>
                            {!isViewer && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-sm font-medium shadow-sm transition-colors"
                                    title="Edit Sprint"
                                >
                                    <Edit size={16} />
                                    <span>Edit</span>
                                </button>
                            )}
                            {sprint.status === 'PLANNED' && (
                                <button
                                    onClick={() => !isViewer && handleUpdateStatus('ACTIVE')}
                                    disabled={isViewer}
                                    title={isViewer ? restrictedTitle : "Start Sprint"}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isViewer
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                                        }`}
                                >
                                    <CheckCircle2 size={16} />
                                    <span>Start Sprint</span>
                                </button>
                            )}
                            {sprint.status === 'ACTIVE' && (
                                <button
                                    onClick={() => !isViewer && handleUpdateStatus('COMPLETED')}
                                    disabled={isViewer}
                                    title={isViewer ? restrictedTitle : "Complete Sprint"}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isViewer
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                        }`}
                                >
                                    <CheckCircle2 size={16} />
                                    <span>Complete Sprint</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Sprint Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Sprint Goal Box */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <ClipboardList size={20} className="text-indigo-500" />
                        Sprint Goal
                    </h2>
                    {isEditing ? (
                        <textarea
                            name="goal"
                            value={formData.goal}
                            onChange={handleInputChange}
                            rows={8}
                            className="w-full text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 whitespace-pre-wrap focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="What are we achieving in this sprint?"
                        />
                    ) : (
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {sprint.goal || <span className="italic text-gray-400">No goal defined for this sprint.</span>}
                        </p>
                    )}
                </div>

                {/* Dates and Summary Sidebar Box */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 border-b border-gray-50 dark:border-gray-700 pb-2">
                        <Calendar size={20} className="text-indigo-500" />
                        Schedule
                    </h2>

                    <div className="space-y-6">
                        {/* Start Date */}
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar size={18} className="text-indigo-500 shrink-0" />
                            <div className="flex flex-col flex-grow">
                                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Start Date</span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                ) : (
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                                        {sprint.startDate ? format(new Date(sprint.startDate), 'PPP') : 'TBD'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar size={18} className="text-rose-500 shrink-0" />
                            <div className="flex flex-col flex-grow">
                                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">End Date</span>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                ) : (
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                                        {sprint.endDate ? format(new Date(sprint.endDate), 'PPP') : 'TBD'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Status Checkup */}
                        <div className="flex items-center gap-3 text-sm pt-4 border-t border-gray-50 dark:border-gray-700">
                            <div className="flex flex-col flex-grow">
                                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Sprint Health</span>
                                <div className="flex items-center gap-2">
                                    <Flag size={14} className={sprint.status === 'ACTIVE' ? 'text-green-500' : 'text-gray-400'} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {sprint.status === 'ACTIVE'
                                            ? 'Currently Active'
                                            : sprint.status === 'COMPLETED'
                                                ? 'Sprint Finished'
                                                : 'Planning Phase'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-grow bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-100 dark:border-gray-700 overflow-y-auto">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-50 dark:border-gray-700 pb-4">
                    <List size={22} className="text-indigo-500" />
                    Sprint Backlog
                </h2>
                <SprintIssueList issues={issues} isLoading={isLoadingIssues} />
            </div>
        </div>
    );
};

export default SprintDetailPage;