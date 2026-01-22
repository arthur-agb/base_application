import React, { useState, useRef, useEffect } from 'react';
import {
    MdKeyboardDoubleArrowUp, MdArrowUpward, MdRemove, MdArrowDownward, MdKeyboardDoubleArrowDown,
    MdBugReport, MdCheckCircle, MdBookmark, MdPersonOutline, MdClose, MdFilterListOff,
    MdLayers, MdList, MdSearch, MdCheck, MdKeyboardArrowDown
} from 'react-icons/md';

import { useEpicSearch, useSprintSearch } from '../hooks';

const AsyncSearchableFilter = ({
    title,
    icon: Icon,
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
    const selectedIds = filters[category] || [];

    // Helper to toggle selection
    const toggleSelection = (item) => {
        setFilters(prev => {
            const currentIds = prev[category] || [];
            const currentObjects = prev[`${category}Objects`] || []; // Store full objects for display

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
        setSearchQuery(''); // Clear search on select (optional UX choice)
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

    // Get selected objects for display (retrieve from state)
    // We rely on the parent state to hold these "Objects" arrays we added above.
    const selectedObjects = filters[`${category}Objects`] || [];

    return (
        <div className="flex flex-col gap-2 relative" ref={wrapperRef}>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Icon className="w-3.5 h-3.5" /> {title}
            </label>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <MdSearch className={`h-4 w-4 ${selectedIds.length > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                </div>
                <input
                    type="text"
                    className={`w-full h-10 pl-8 pr-9 py-1.5 text-xs rounded-md border focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors ${selectedIds.length > 0
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 placeholder-indigo-400 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 dark:placeholder-indigo-500'
                        : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                        }`}
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsListOpen(true);
                    }}
                    onFocus={() => {
                        setIsListOpen(true);
                    }}
                />
                {selectedIds.length > 0 && (
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white">
                            <MdKeyboardArrowDown className="w-4 h-4" />
                        </span>
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {isListOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto custom-scrollbar">

                    {/* Selected Items Section */}
                    {selectedObjects.length > 0 && (
                        <div className="border-b border-gray-100 dark:border-gray-700">
                            <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                                Selected
                            </div>
                            {selectedObjects.map(obj => (
                                <button
                                    key={obj.id}
                                    onClick={() => toggleSelection(obj)}
                                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 group text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20"
                                >
                                    <span className="truncate">{obj.title}</span>
                                    <MdClose className="w-3.5 h-3.5 text-indigo-500 group-hover:text-red-500" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Search Results Section */}
                    {isLoading ? (
                        <div className="px-3 py-2 text-xs text-gray-400">Loading...</div>
                    ) : searchQuery.length > 0 ? (
                        searchResults.length > 0 ? (
                            searchResults
                                .filter(item => !selectedIds.includes(item.id)) // Exclude already selected
                                .map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleSelection(item)}
                                        className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                    >
                                        <span className="truncate">{item.title}</span>
                                    </button>
                                ))
                        ) : (
                            <div className="px-3 py-2 text-xs text-gray-400 italic">No matches found</div>
                        )
                    ) : (
                        selectedObjects.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400 italic">Type to search...</div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

const TypeFilter = ({ filters, setFilters }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const types = [
        { id: 'BUG', label: 'Bug', icon: MdBugReport, color: 'text-red-600', bg: 'bg-red-100', text: 'text-red-800', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-200' },
        { id: 'STORY', label: 'Story', icon: MdBookmark, color: 'text-green-600', bg: 'bg-green-100', text: 'text-green-800', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-200' },
        { id: 'TASK', label: 'Task', icon: MdCheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', text: 'text-blue-800', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-200' }
    ];

    const toggleType = (typeId) => {
        setFilters(prev => {
            const current = prev.type || [];
            if (current.includes(typeId)) {
                return { ...prev, type: current.filter(t => t !== typeId) };
            } else {
                return { ...prev, type: [...current, typeId] };
            }
        });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-2 relative" ref={wrapperRef}>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                Type
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-10 px-3 py-1.5 text-xs text-left rounded-md border focus:ring-1 focus:ring-indigo-500 focus:outline-none flex justify-between items-center transition-colors ${filters.type.length > 0
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                    }`}
            >
                <span className={`block truncate mr-2 ${filters.type.length === 0 ? 'text-gray-400' : ''}`}>
                    {filters.type.length > 0 ? `${filters.type.length} selected` : 'Select types...'}
                </span>
                <span className={`flex items-center justify-center w-5 h-5 rounded-full ${filters.type.length > 0 ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>
                    <MdKeyboardArrowDown className="w-4 h-4 flex-shrink-0" />
                </span>
            </button>

            {/* Selected Chips - REMOVED */}

            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto custom-scrollbar">
                    {types.map(t => {
                        const isSelected = filters.type.includes(t.id);
                        return (
                            <button
                                key={t.id}
                                onClick={() => toggleType(t.id)}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} text-gray-700 dark:text-gray-200`}
                            >
                                <span className="flex items-center gap-2">
                                    <t.icon className={`w-4 h-4 ${t.color}`} />
                                    {t.label}
                                </span>
                                {isSelected && <MdCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const AssigneeFilter = ({ filters, setFilters, assignees }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const toggleAssignee = (userId) => {
        setFilters(prev => {
            const current = prev.assignees || [];
            if (current.includes(userId)) {
                return { ...prev, assignees: current.filter(id => id !== userId) };
            } else {
                return { ...prev, assignees: [...current, userId] };
            }
        });
    };

    // Helper to toggle 'unassigned' specifically
    const toggleUnassigned = () => toggleAssignee('unassigned');

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCount = filters.assignees.length;

    return (
        <div className="flex flex-col gap-2 relative" ref={wrapperRef}>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                Assignee
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-10 px-3 py-1.5 text-xs text-left rounded-md border focus:ring-1 focus:ring-indigo-500 focus:outline-none flex justify-between items-center transition-colors ${selectedCount > 0
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                    }`}
            >
                <span className={`block truncate mr-2 ${selectedCount === 0 ? 'text-gray-400' : ''}`}>
                    {selectedCount > 0 ? `${selectedCount} selected` : 'Select assignees...'}
                </span>
                <span className={`flex items-center justify-center w-5 h-5 rounded-full ${selectedCount > 0 ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>
                    <MdKeyboardArrowDown className="w-4 h-4 flex-shrink-0" />
                </span>
            </button>

            {/* Chips for selected assignees */}
            {/* Selected Chips - REMOVED */}

            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto custom-scrollbar">
                    {assignees.map(user => {
                        const isSelected = filters.assignees.includes(user.id);
                        return (
                            <button
                                key={user.id}
                                onClick={() => toggleAssignee(user.id)}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} text-gray-700 dark:text-gray-200`}
                            >
                                <div className="flex items-center gap-2">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                    <span className="truncate">{user.name}</span>
                                </div>
                                {isSelected && <MdCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                            </button>
                        );
                    })}
                    {/* Unassigned Option */}
                    <button
                        onClick={toggleUnassigned}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700 ${filters.assignees.includes('unassigned') ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} text-gray-700 dark:text-gray-200`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-gray-400">
                                <MdPersonOutline className="w-3 h-3" />
                            </div>
                            <span>Unassigned</span>
                        </div>
                        {filters.assignees.includes('unassigned') && <MdCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                </div>
            )}
        </div>
    );
};

const PriorityFilter = ({ filters, setFilters }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const priorities = [
        { id: 'HIGHEST', label: 'Highest', icon: MdKeyboardDoubleArrowUp, colorClass: 'text-red-600', activeClass: 'bg-red-600' },
        { id: 'HIGH', label: 'High', icon: MdArrowUpward, colorClass: 'text-orange-500', activeClass: 'bg-orange-500' },
        { id: 'MEDIUM', label: 'Medium', icon: MdRemove, colorClass: 'text-yellow-500', activeClass: 'bg-yellow-500' },
        { id: 'LOW', label: 'Low', icon: MdArrowDownward, colorClass: 'text-blue-500', activeClass: 'bg-blue-500' },
        { id: 'LOWEST', label: 'Lowest', icon: MdKeyboardDoubleArrowDown, colorClass: 'text-green-500', activeClass: 'bg-green-500' }
    ];

    const togglePriority = (priority) => {
        setFilters(prev => {
            const current = prev.priority || [];
            if (current.includes(priority)) {
                return { ...prev, priority: current.filter(p => p !== priority) };
            } else {
                return { ...prev, priority: [...current, priority] };
            }
        });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCount = filters.priority.length;

    return (
        <div className="flex flex-col gap-2 relative" ref={wrapperRef}>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                Priority
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-10 px-3 py-1.5 text-xs text-left rounded-md border focus:ring-1 focus:ring-indigo-500 focus:outline-none flex justify-between items-center transition-colors ${selectedCount > 0
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300'
                    : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                    }`}
            >
                <span className={`block truncate mr-2 ${selectedCount === 0 ? 'text-gray-400' : ''}`}>
                    {selectedCount > 0 ? `${selectedCount} selected` : 'Select priorities...'}
                </span>
                <span className={`flex items-center justify-center w-5 h-5 rounded-full ${selectedCount > 0 ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>
                    <MdKeyboardArrowDown className="w-4 h-4 flex-shrink-0" />
                </span>
            </button>

            {/* Chips */}
            {/* Selected Chips - REMOVED */}

            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {priorities.map(p => {
                        const isSelected = filters.priority.includes(p.id);
                        return (
                            <button
                                key={p.id}
                                onClick={() => togglePriority(p.id)}
                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} text-gray-700 dark:text-gray-200`}
                            >
                                <span className="flex items-center gap-2">
                                    <p.icon className={`w-4 h-4 ${p.colorClass}`} />
                                    {p.label}
                                </span>
                                {isSelected && <MdCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


const BoardFilters = ({ filters, setFilters, assignees, isOpen, onClear, projectKey }) => {






    const toggleFilter = (category, value) => {
        setFilters(prev => {
            const current = prev[category] || [];
            if (current.includes(value)) {
                return { ...prev, [category]: current.filter(item => item !== value) };
            } else {
                return { ...prev, [category]: [...current, value] };
            }
        });
    };



    return (
        <div className="px-6 py-4">
            <div className="flex flex-col lg:flex-row gap-6 items-start">

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 flex-grow w-full">

                    {/* Type Filter */}
                    <TypeFilter filters={filters} setFilters={setFilters} />

                    {/* Assignee Filter */}
                    <AssigneeFilter filters={filters} setFilters={setFilters} assignees={assignees} />

                    {/* Priority Filter */}
                    <PriorityFilter filters={filters} setFilters={setFilters} />

                    {/* Epic Search */}
                    <AsyncSearchableFilter
                        title="Epic"
                        icon={MdLayers}
                        category="epics"
                        placeholder="Search epics..."
                        projectKey={projectKey}
                        filters={filters}
                        setFilters={setFilters}
                        useSearchHook={useEpicSearch}
                    />

                    {/* Sprint Search */}
                    <AsyncSearchableFilter
                        title="Sprint"
                        icon={MdList}
                        category="sprints"
                        placeholder="Search sprints..."
                        projectKey={projectKey}
                        filters={filters}
                        setFilters={setFilters}
                        useSearchHook={useSprintSearch}
                    />
                </div>

                {/* Clear Filters - Aligned right in its own column on Desktop, at bottom on Mobile */}
                <div className="flex flex-col gap-2 lg:w-auto w-full flex-shrink-0">
                    <div className="h-4 hidden lg:block"></div> {/* Spacer to match label height on desktop */}
                    <button
                        onClick={onClear}
                        className="h-10 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex items-center justify-center lg:justify-end gap-1.5 w-full whitespace-nowrap"
                    >
                        <MdFilterListOff className="w-4 h-4" /> Clear Filters
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BoardFilters;
