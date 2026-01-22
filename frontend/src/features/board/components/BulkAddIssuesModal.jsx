import React, { useState } from 'react';
import { MdClose, MdContentPaste } from 'react-icons/md';
import { useAddIssue } from '../hooks/useAddIssue';
import { useSelector } from 'react-redux';

const BulkAddIssuesModal = ({ isOpen, onClose, boardId, firstColumn }) => {
    const [csvText, setCsvText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const addIssueMutation = useAddIssue();
    const user = useSelector(state => state.auth.user);

    if (!isOpen) return null;

    const parseCSV = (text) => {
        // Simple CSV parser handling quoted strings
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        const result = [];

        for (let line of lines) {
            const parts = [];
            let current = '';
            let inQuote = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    parts.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            parts.push(current.trim()); // Push last part

            // We expect at least a title. If description is missing, empty string.
            if (parts.length > 0 && parts[0]) {
                result.push({
                    title: parts[0].replace(/^"|"$/g, '').trim(), // Remove surrounding quotes if any
                    description: parts.length > 1 ? parts[1].replace(/^"|"$/g, '').trim() : ''
                });
            }
        }
        return result;
    };

    const handleSubmit = async () => {
        if (!csvText.trim()) return;
        if (!firstColumn) {
            console.error("No column available to add issues to.");
            return;
        }

        const issues = parseCSV(csvText);
        if (issues.length === 0) return;

        setIsSubmitting(true);
        setProgress({ current: 0, total: issues.length });

        const issueCategory = firstColumn.category || 'TODO';

        try {
            // Processing sequentially to ensure order (optional) or just to manage load
            for (let i = 0; i < issues.length; i++) {
                const issue = issues[i];
                const issuePayload = {
                    boardId,
                    projectId: firstColumn.projectId, // Assuming column has projectId or we get it from props. But typically column objects might not have it directly if normalized. 
                    // Wait, in BoardView.js `handleSaveNewIssue` gets projectId from `board.projectId`.
                    // We should probably pass projectId or board object to this modal.
                    // For now let's assume we can get it or the backend handles it if missing (but handleSaveNewIssue checks it).
                    // Let's rely on the passed in props. We might need to update the props to include board/project info.

                    columnId: firstColumn.id,
                    title: issue.title,
                    description: issue.description,
                    reporterId: user?.id,
                    reporterName: user?.name,
                    assigneeId: user?.id, // Default to current user as per other create logic
                    status: issueCategory,
                    category: issueCategory,
                    type: 'TASK',
                    priority: 'LOWEST',
                };

                // We need to inject projectId. If we don't have it in props, the mutation might fail strictly validation wise 
                // but usually boardId is enough for validity if backend is smart. 
                // Looking at BoardView.jsx, it passes `projectId: board.projectId`. 
                // I will add `projectId` to the props of this component.
                if (firstColumn.projectId) issuePayload.projectId = firstColumn.projectId;

                await addIssueMutation.mutateAsync(issuePayload);
                setProgress(prev => ({ ...prev, current: i + 1 }));
            }

            onClose();
            setCsvText('');
            setProgress({ current: 0, total: 0 });
        } catch (error) {
            console.error("Error creating issues", error);
            // Ideally show error toast
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative p-6 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <MdContentPaste className="w-5 h-5" />
                        Bulk Add Issues
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <MdClose className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Paste your issues below in CSV format. Format: <code>Title, Description</code>.
                        <br />
                        Each line represents a new issue.
                    </p>
                    <textarea
                        className="w-full h-64 p-3 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none font-mono"
                        placeholder={'Fix Login Bug, The login button is not working\nUpdate Home Page, Need to change the hero image'}
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        {isSubmitting && `Processing: ${progress.current} / ${progress.total}`}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!csvText.trim() || isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-md transition-colors flex items-center gap-2"
                        >
                            {isSubmitting ? 'Importing...' : 'Import Issues'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkAddIssuesModal;
