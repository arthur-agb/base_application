// src/features/sprints/components/CreateSprintModal.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useCreateSprint } from '../hooks/useCreateSprint';
import { closeCreateSprintModal } from '../slices/sprintSlice';

const CreateSprintModal = ({ projectId }) => {
    const dispatch = useDispatch();
    const createSprintMutation = useCreateSprint(projectId);
    const [formData, setFormData] = useState({
        title: '',
        goal: '',
        startDate: '',
        endDate: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClose = () => {
        dispatch(closeCreateSprintModal());
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createSprintMutation.mutate(
            { ...formData, projectId },
            {
                onSuccess: () => {
                    handleClose();
                },
            }
        );
    };

    return (
        <div 
            className="absolute inset-0 z-30 flex justify-center items-center transition-all duration-300 ease-in-out"
            onMouseDown={handleClose}
        >
            <div 
                className={`
                    bg-white dark:bg-gray-800
                    shadow-xl 
                    flex flex-col 
                    overflow-hidden 
                    border border-gray-300 dark:border-gray-600
                    rounded-lg 
                    w-full max-w-md
                `}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-300 dark:border-gray-600">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Sprint</h2>
                </div>
                
                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                        </div>
                         <div>
                            <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goal</label>
                            <textarea name="goal" id="goal" value={formData.goal} onChange={handleChange} required rows="3" className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                        </div>
                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                <input type="date" name="endDate" id="endDate" value={formData.endDate} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
                            </div>
                        </div>
                         {createSprintMutation.isError && <p className="text-red-500 text-sm">Error: {createSprintMutation.error.message}</p>}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 py-4 px-6 border-t border-gray-300 dark:border-gray-600">
                        <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800">
                            Cancel
                        </button>
                        <button type="submit" disabled={createSprintMutation.isLoading} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50">
                            {createSprintMutation.isLoading ? 'Creating...' : 'Create Sprint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateSprintModal;