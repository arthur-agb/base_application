import React, { useState } from 'react';
import { MdAdd, MdClose, MdBusiness } from 'react-icons/md';

const CreateCompanyModal = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onCreate({ name, slug });
            onClose();
            setName('');
            setSlug('');
        } catch (err) {
            setError(err.message || 'Failed to create company. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        // Auto-generate slug from name if it hasn't been manually edited and is empty or matches previous auto-slug
        if (!slug || slug === name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')) {
            setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8 -mt-4 md:-mt-8"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-gray-500/30 dark:bg-gray-900/50 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl transform transition-all overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <MdBusiness className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100" id="modal-title">
                            Create a New Company
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        aria-label="Close modal"
                    >
                        <MdClose className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Set up your organization's workspace. You'll be assigned as the **Owner** and can invite team members later.
                    </p>

                    <div className="space-y-5">
                        {/* Company Name */}
                        <div className="space-y-1.5">
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Company Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                value={name}
                                onChange={handleNameChange}
                                className="block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white sm:text-sm transition-all outline-none"
                                placeholder="e.g. Acme Corp"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Slug / URL */}
                        <div className="space-y-1.5">
                            <label htmlFor="slug" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Organization URL
                            </label>
                            <div className="flex rounded-lg shadow-sm">
                                <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-sm font-medium">
                                    app.momentum/
                                </span>
                                <input
                                    type="text"
                                    name="slug"
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                                    className="flex-1 block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-none rounded-r-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm transition-all outline-none"
                                    placeholder="acme-corp"
                                    required
                                />
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 px-1">
                                This will be your unique workspace identifier. Only lowercase letters, numbers, and hyphens.
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !name || !slug}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </>
                        ) : 'Create Company'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-bold border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateCompanyModal;
