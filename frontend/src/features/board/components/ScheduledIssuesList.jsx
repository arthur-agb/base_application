import React from 'react';
import { useScheduledIssues } from '../hooks/useScheduledIssues';
import { MdDelete, MdEdit, MdEventRepeat, MdPause, MdPlayArrow } from 'react-icons/md';

const ScheduledIssuesList = ({ boardId, onEdit }) => {
    const { scheduledIssues, isLoading, updateScheduledIssueMutation, deleteScheduledIssueMutation } = useScheduledIssues(boardId);

    if (isLoading) return <div className="p-4 text-center text-gray-500">Loading schedules...</div>;

    if (!scheduledIssues || scheduledIssues.length === 0) {
        return <div className="p-4 text-center text-gray-500 italic">No scheduled issues found.</div>;
    }

    const handleToggleActive = (issue) => {
        updateScheduledIssueMutation.mutate({
            id: issue.id,
            isActive: !issue.isActive
        });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this schedule?')) {
            deleteScheduledIssueMutation.mutate(id);
        }
    };

    return (
        <div className="space-y-3">
            {scheduledIssues.map((issue) => (
                <div key={issue.id} className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${issue.isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400'}`}>
                            <MdEventRepeat className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{issue.title}</h4>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-2">
                                <span className="uppercase font-semibold tracking-wider">{issue.frequency}</span>
                                <span>•</span>
                                <span>Next: {new Date(issue.nextRunAt).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleToggleActive(issue)}
                            className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${issue.isActive ? 'text-amber-500' : 'text-green-500'}`}
                            title={issue.isActive ? "Pause Schedule" : "Resume Schedule"}
                        >
                            {issue.isActive ? <MdPause className="w-4 h-4" /> : <MdPlayArrow className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => onEdit && onEdit(issue)}
                            className="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-500 transition-colors"
                            title="Edit Schedule"
                        >
                            <MdEdit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(issue.id)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                            title="Delete Schedule"
                        >
                            <MdDelete className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScheduledIssuesList;
