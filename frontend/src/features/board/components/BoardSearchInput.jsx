
import React, { useState, useRef, useEffect } from 'react';
import { MdSearch, MdClose, MdCheck } from 'react-icons/md';

const BoardSearchInput = ({
    category,
    placeholder,
    projectKey,
    filters,
    setFilters,
    useSearchHook
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isListOpen, setIsListOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Use the passed hook for searching
    const { data: searchResults = [], isLoading } = useSearchHook(projectKey, searchQuery);

    // Selected items are stored in filters[category] (array of IDs)
    // We also rely on filters[`${category}Objects`] (array of objects {id, title}) for display
    const selectedObjects = filters[`${category}Objects`] || [];

    const toggleSelection = (item) => {
        setFilters(prev => {
            const currentIds = prev[category] || [];
            const currentObjects = prev[`${category}Objects`] || [];

            if (currentIds.includes(item.id)) {
                // Remove
                return {
                    ...prev,
                    [category]: currentIds.filter(id => id !== item.id),
                    [`${category}Objects`]: currentObjects.filter(obj => obj.id !== item.id)
                };
            } else {
                // Add
                return {
                    ...prev,
                    [category]: [...currentIds, item.id],
                    [`${category}Objects`]: [...currentObjects, item]
                };
            }
        });
        setSearchQuery('');
        setIsListOpen(false);
    };

    const handleRemove = (e, item) => {
        e.stopPropagation(); // Prevent opening dropdown when clicking remove
        toggleSelection(item);
    };

    // Handle outside click to close list
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsListOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="flex items-center bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white dark:focus-within:bg-gray-900 border border-transparent focus-within:border-indigo-500 w-64 overflow-hidden">
                <MdSearch className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1.5 flex-shrink-0" />

                {/* Selected Items (Chips inside input) */}
                <div className="flex-1 min-w-0 flex gap-1 items-center overflow-x-auto no-scrollbar mask-linear-fade">
                    {selectedObjects.map(obj => (
                        <span
                            key={obj.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 whitespace-nowrap flex-shrink-0"
                        >
                            {obj.title}
                            <button
                                onClick={(e) => handleRemove(e, obj)}
                                className="hover:text-indigo-600 dark:hover:text-indigo-100 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                            >
                                <MdClose className="w-3 h-3" />
                            </button>
                        </span>
                    ))}

                    <input
                        type="text"
                        className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 min-w-[50px] flex-grow"
                        placeholder={selectedObjects.length > 0 ? "" : placeholder}
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (e.target.value.trim().length > 0) setIsListOpen(true);
                        }}
                        onFocus={() => {
                            // if (searchQuery.trim().length > 0) setIsListOpen(true); 
                            // Optional: open on focus? User asked for "type to search", implying functionality is triggered by typing. 
                            // But usually showing recent/all if empty is nice. Let's stick to "type to search".
                        }}
                    />
                </div>
            </div>

            {/* Dropdown Results */}
            {isListOpen && searchQuery.length > 1 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto custom-scrollbar min-w-[200px]">
                    {isLoading ? (
                        <div className="px-3 py-2 text-xs text-gray-400">Loading...</div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map(item => {
                            const isSelected = (filters[category] || []).includes(item.id);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => toggleSelection(item)}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} text-gray-700 dark:text-gray-200`}
                                >
                                    <span className="truncate mr-2">{item.title}</span>
                                    {isSelected && <MdCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                                </button>
                            );
                        })
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 italic">No matches found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BoardSearchInput;
