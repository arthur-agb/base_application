import React, { useState, useEffect } from 'react';

/**
 * A reusable modal component for creating or editing an Epic.
 */
const EpicFormModal = ({ isOpen, onClose, onSave, epicToEdit, members = [], isLoading }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('OPEN'); // Default status
    const [ownerUserId, setOwnerUserId] = useState('');

    useEffect(() => {
        if (epicToEdit) {
            setTitle(epicToEdit.title || '');
            setDescription(epicToEdit.description || '');
            setStatus(epicToEdit.status || 'OPEN');
            setOwnerUserId(epicToEdit.ownerUserId || '');
        } else {
            // Reset form for creation
            setTitle('');
            setDescription('');
            setStatus('OPEN');
            setOwnerUserId('');
        }
    }, [epicToEdit, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({
            title: title.trim(),
            description: description.trim(),
            status,
            ownerUserId: ownerUserId || null,
        });
    };

    if (!isOpen) return null;

    // Common classes from IssueDetailModal for styling consistency
    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
    const commonButtonClass = "px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed";
    const cancelButtonClass = "px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800";
    const labelClass = "block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider";

    return (
        // Backdrop - Styled like IssueDetailModal's container
        <div className="absolute inset-0 z-20 flex justify-center items-center transition-all duration-300 ease-in-out" onClick={onClose}>
            {/* Modal Panel - Styled with height constraints and transitions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90%] overflow-hidden border border-gray-300 dark:border-gray-600 transition-all duration-300 ease-in-out" onClick={e => e.stopPropagation()}>

                {/* Header Section (styled like IssueDetailModal) */}
                <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {epicToEdit ? 'Edit Epic' : 'Create New Epic'}
                    </h2>
                    <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500" onClick={onClose} aria-label="Close epic form" title="Close">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Form Body - structured with flex-grow to handle overflow */}
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
                    {/* Scrollable Content Area */}
                    <div className="flex-grow p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                        <div>
                            <label htmlFor="epic-title" className={labelClass}>Title</label>
                            <input
                                type="text"
                                id="epic-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={commonInputClass}
                                placeholder="e.g., Implement User Authentication"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="epic-description" className={labelClass}>Description</label>
                            <textarea
                                id="epic-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="4"
                                className={commonInputClass}
                                placeholder="Provide a detailed overview of the epic..."
                            />
                        </div>
                        <div>
                            <label htmlFor="epic-status" className={labelClass}>Status</label>
                            <select
                                id="epic-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className={commonInputClass}
                            >
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="epic-owner" className={labelClass}>Owner</label>
                            <select
                                id="epic-owner"
                                value={ownerUserId}
                                onChange={(e) => setOwnerUserId(e.target.value)}
                                className={commonInputClass}
                            >
                                <option value="">Unassigned</option>
                                {members.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.displayName} ({member.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* Form Footer */}
                    <div className="flex-shrink-0 flex justify-end gap-3 px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-300 dark:border-gray-600">
                        <button type="button" onClick={onClose} className={cancelButtonClass}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading || !title.trim()} className={commonButtonClass}>
                            {isLoading ? 'Saving...' : (epicToEdit ? 'Save Changes' : 'Create Epic')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EpicFormModal;