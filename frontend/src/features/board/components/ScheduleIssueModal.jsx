import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdSave, MdSchedule, MdList, MdAdd, MdFullscreen, MdFullscreenExit, MdCheck, MdHistory } from 'react-icons/md';
import { useScheduledIssues } from '../hooks/useScheduledIssues';
import { useUserSearch, useEpicSearch, useSprintSearch } from '../hooks';
import { useSelector } from 'react-redux';
import ScheduledIssuesList from './ScheduledIssuesList';

const ScheduleIssueModal = ({ isOpen, onClose, boardId, columns, projectKey }) => {
    const { createScheduledIssueMutation, updateScheduledIssueMutation } = useScheduledIssues(boardId);
    const user = useSelector(state => state.auth.user);

    const [activeTab, setActiveTab] = useState('create'); // 'create' or 'list'
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [editingScheduleId, setEditingScheduleId] = useState(null);

    // --- Form State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [frequency, setFrequency] = useState('DAILY');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('09:00');
    const [priority, setPriority] = useState('MEDIUM');
    const [type, setType] = useState('TASK');
    const [columnId, setColumnId] = useState(columns && columns.length > 0 ? columns[0].id : '');

    // Checkboxes (New Fields)
    const [relatedCode, setRelatedCode] = useState('');
    const [links, setLinks] = useState(''); // Stored as string, split on submit
    const [instructions, setInstructions] = useState('');

    // Schedule Specific
    const [repeatInterval, setRepeatInterval] = useState(1);
    const [selectedWeekDays, setSelectedWeekDays] = useState([]); // 0=Sun, 1=Mon, etc.
    const [monthDay, setMonthDay] = useState(1);

    // --- Search State (New Fields) ---
    // Assignee
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
    const [assigneeDropdownVisible, setAssigneeDropdownVisible] = useState(false);
    const [selectedAssignee, setSelectedAssignee] = useState(null); // { id, displayName, avatarUrl }

    // Epic
    const [epicSearchQuery, setEpicSearchQuery] = useState('');
    const [epicDropdownVisible, setEpicDropdownVisible] = useState(false);
    const [selectedEpic, setSelectedEpic] = useState(null); // { id, title }

    // Sprint
    const [sprintSearchQuery, setSprintSearchQuery] = useState('');
    const [sprintDropdownVisible, setSprintDropdownVisible] = useState(false);
    const [selectedSprint, setSelectedSprint] = useState(null); // { id, title }


    // --- Hooks ---
    const { data: searchedUsers = [], isLoading: isLoadingSearchedUsers } = useUserSearch(assigneeSearchQuery);
    const { data: searchedEpics = [], isLoading: isLoadingSearchedEpics } = useEpicSearch(projectKey, epicSearchQuery);
    const { data: searchedSprints = [], isLoading: isLoadingSearchedSprints } = useSprintSearch(projectKey, sprintSearchQuery);

    // --- Refs ---
    const backdropRef = useRef(null);
    const assigneeInputRef = useRef(null);
    const assigneeDropdownRef = useRef(null);
    const epicInputRef = useRef(null);
    const epicDropdownRef = useRef(null);
    const sprintInputRef = useRef(null);
    const sprintDropdownRef = useRef(null);


    if (!isOpen) return null;

    const weekDays = [
        { label: 'S', value: 0 },
        { label: 'M', value: 1 },
        { label: 'T', value: 2 },
        { label: 'W', value: 3 },
        { label: 'T', value: 4 },
        { label: 'F', value: 5 },
        { label: 'S', value: 6 },
    ];

    const toggleWeekDay = (day) => {
        if (selectedWeekDays.includes(day)) {
            setSelectedWeekDays(selectedWeekDays.filter(d => d !== day));
        } else {
            setSelectedWeekDays([...selectedWeekDays, day].sort());
        }
    };

    // --- Search Handlers ---

    // Assignee
    const handleSelectAssignee = (user) => {
        setSelectedAssignee(user);
        setAssigneeSearchQuery(user.displayName);
        setAssigneeDropdownVisible(false);
    };

    // Epic
    const handleSelectEpic = (epic) => {
        setSelectedEpic(epic);
        setEpicSearchQuery(epic.title);
        setEpicDropdownVisible(false);
    };

    // Sprint
    const handleSelectSprint = (sprint) => {
        setSelectedSprint(sprint);
        setSprintSearchQuery(sprint.title);
        setSprintDropdownVisible(false);
    };



    // --- Edit Handler ---
    const handleEdit = (schedule) => {
        setEditingScheduleId(schedule.id);

        // Schedule Details
        setTitle(schedule.title);
        setDescription(schedule.description);
        setFrequency(schedule.frequency);

        // Handle Date & Time
        // The backend might not return explicit startDate/time, but gives us nextRunAt (UTC).
        // We defer to explicit fields if present, otherwise calculate local date/time from nextRunAt.
        if (schedule.startDate) {
            setStartDate(new Date(schedule.startDate).toISOString().split('T')[0]);
        } else if (schedule.nextRunAt) {
            // derive from nextRunAt (converted to local YYYY-MM-DD)
            const dateObj = new Date(schedule.nextRunAt);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            setStartDate(`${year}-${month}-${day}`);
        }

        if (schedule.time) {
            setTime(schedule.time);
        } else if (schedule.nextRunAt) {
            // derive from nextRunAt (converted to local HH:mm)
            const dateObj = new Date(schedule.nextRunAt);
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            setTime(`${hours}:${minutes}`);
        }

        // Custom Config
        if (schedule.customConfig) {
            if (schedule.frequency === 'DAILY') {
                setRepeatInterval(schedule.customConfig.interval || 1);
            } else if (schedule.frequency === 'WEEKLY') {
                setSelectedWeekDays(schedule.customConfig.days || []);
            } else if (schedule.frequency === 'MONTHLY') {
                setMonthDay(schedule.customConfig.dayOfMonth || 1);
            }
        } // If no custom config, we leave defaults (Daily: 1, etc.)

        // Template Details
        if (schedule.template) {
            // ... (rest of template handling)
            setPriority(schedule.template.priority || 'MEDIUM');
            setType(schedule.template.type || 'TASK');
            setColumnId(schedule.template.columnId || (columns && columns.length > 0 ? columns[0].id : ''));

            // Text Areas
            setInstructions(schedule.template.instructions || '');
            setRelatedCode(schedule.template.relatedCode || '');
            setLinks(schedule.template.links ? schedule.template.links.join('\n') : '');

            // Complex Fields (Search based)
            // Assignee
            if (schedule.template.assigneeId) {
                // Note: The user JSON shows assigneeId, not the full object. 
                // If we don't have the full object, we can't show the name.
                // We'll try to check if the 'assignee' object exists as in our previous logic,
                // but if not, we might be stuck with just an ID until we fetch user.
                // For now, let's stick to the previous logic of checking for the object.
                // If the user payload only has IDs (as shown in the request body), we have a display issue.
                // It does NOT show 'assignee': { ... } inside template in the provided JSON.
                // This means existing logic `if (schedule.template.assignee)` will FAIL.

                // TODO: We probably need to fetch the user display name if only ID is present.
                // LIMITATION: For this step, I will focus on the TIME issue requested by the user.
                // But I should preserve the existing check just in case.
            }

            // Existing logic preservation for Assignee/Epic/Sprint objects if they happen to exist
            if (schedule.template.assignee) {
                setSelectedAssignee(schedule.template.assignee);
                setAssigneeSearchQuery(schedule.template.assignee.displayName || schedule.template.assignee.name);
            } else {
                // If we have an ID but no object, we can't search-replace pre-fill easily without a fetch.
                // For now, clear it to avoid stale state.
                setSelectedAssignee(null);
                setAssigneeSearchQuery('');
            }
            // (Similiar for Epic/Sprint)
            if (schedule.template.epic) {
                setSelectedEpic(schedule.template.epic);
                setEpicSearchQuery(schedule.template.epic.title);
            } else {
                setSelectedEpic(null);
                setEpicSearchQuery('');
            }
            if (schedule.template.sprint) {
                setSelectedSprint(schedule.template.sprint);
                setSprintSearchQuery(schedule.template.sprint.title);
            } else {
                setSelectedSprint(null);
                setSprintSearchQuery('');
            }
        }

        setActiveTab('create');
    };

    const handleCancelEdit = () => {
        setEditingScheduleId(null);
        resetForm();
        setActiveTab('list');
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setFrequency('DAILY');
        setRepeatInterval(1);
        setSelectedWeekDays([]);
        setMonthDay(1);
        // Reset Date/Time to defaults if needed or keep current? 
        // setStartDate(new Date().toISOString().split('T')[0]); 
        // setTime('09:00');

        setRelatedCode('');
        setLinks('');
        setInstructions('');

        setSelectedAssignee(null);
        setAssigneeSearchQuery('');
        setSelectedEpic(null);
        setEpicSearchQuery('');
        setSelectedSprint(null);
        setSprintSearchQuery('');
        setEditingScheduleId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!title || !startDate || !time) return;

        let customConfig = {};
        if (frequency === 'DAILY') {
            customConfig = { interval: parseInt(repeatInterval) || 1 };
        } else if (frequency === 'WEEKLY') {
            customConfig = { days: selectedWeekDays };
        } else if (frequency === 'MONTHLY') {
            customConfig = { dayOfMonth: parseInt(monthDay) || 1 };
        }

        // Calculate nextRunAt from startDate + time (interpreted in local time)
        // This ensures the backend receives an explicit updated run time
        const [year, month, day] = startDate.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        // Create date in local time
        const nextRunDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
        const nextRunAt = nextRunDate.toISOString();

        const schedulePayload = {
            boardId,
            title,
            description,
            frequency,
            startDate,
            time,
            nextRunAt,
            customConfig,
            template: {
                priority,
                type,
                columnId,
                reporterId: user?.id,
                assigneeId: selectedAssignee?.id || user?.id,
                status: 'TODO',
                category: 'TODO',
                epicId: selectedEpic?.id || null,
                sprintId: selectedSprint?.id || null,
                relatedCode: relatedCode || null,
                links: links ? links.split('\n').map(l => l.trim()).filter(l => l) : [],
                instructions: instructions || null,
            }
        };

        if (editingScheduleId) {
            updateScheduledIssueMutation.mutate({
                id: editingScheduleId,
                ...schedulePayload
            }, {
                onSuccess: () => {
                    resetForm();
                    setActiveTab('list');
                }
            });
        } else {
            createScheduledIssueMutation.mutate(schedulePayload, {
                onSuccess: () => {
                    resetForm();
                    setActiveTab('list');
                }
            });
        }
    };

    const handleClickOutside = (event) => {
        if (backdropRef.current && event.target === backdropRef.current) {
            onClose();
        }
    };

    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";


    return (
        <div
            ref={backdropRef}
            className={`absolute inset-0 z-50 flex justify-center items-start sm:items-center ${isFullScreen ? `px-4 pt-4 pb-4 sm:px-6 sm:pb-6 md:pt-8 lg:px-8 lg:pb-8` : `p-4`} bg-black/50 backdrop-blur-sm -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8 -mt-4 md:-mt-8`}
            onMouseDown={handleClickOutside}
        >
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full flex flex-col overflow-hidden transition-all duration-300
                ${isFullScreen ? 'h-full rounded-none sm:rounded-lg' : 'max-w-3xl max-h-[90vh]'}
            `}>

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <MdSchedule className="w-6 h-6" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Scheduler</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors hidden sm:block"
                            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                        >
                            {isFullScreen ? <MdFullscreenExit className="w-6 h-6" /> : <MdFullscreen className="w-6 h-6" />}
                        </button>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors">
                            <MdClose className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'create' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <MdAdd className="w-4 h-4" /> {editingScheduleId ? 'Edit Schedule' : 'Create Schedule'}
                        </div>
                    </button>
                    <button
                        onClick={() => {
                            if (editingScheduleId) handleCancelEdit();
                            else setActiveTab('list');
                        }}
                        className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <MdList className="w-4 h-4" /> Active Schedules
                        </div>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                    {activeTab === 'create' ? (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Section: Schedule Configuration */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schedule Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className={commonInputClass}
                                            required
                                        />
                                    </div>
                                    {/* Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                        <input
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className={commonInputClass}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Frequency */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                                        <select
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value)}
                                            className={commonInputClass}
                                        >
                                            <option value="DAILY">Daily</option>
                                            <option value="WEEKLY">Weekly</option>
                                            <option value="MONTHLY">Monthly</option>
                                        </select>
                                    </div>
                                    {/* Dynamic Frequency Options */}
                                    <div className="flex items-end">
                                        {frequency === 'DAILY' && (
                                            <div className="flex items-center gap-2 w-full bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Repeat every</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={repeatInterval}
                                                    onChange={(e) => setRepeatInterval(e.target.value)}
                                                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-center dark:bg-gray-700 dark:text-white"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">days</span>
                                            </div>
                                        )}

                                        {frequency === 'WEEKLY' && (
                                            <div className="w-full">
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Repeat on</label>
                                                <div className="flex gap-1">
                                                    {weekDays.map((day) => (
                                                        <button
                                                            key={day.value}
                                                            type="button"
                                                            onClick={() => toggleWeekDay(day.value)}
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${selectedWeekDays.includes(day.value)
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500'
                                                                }`}
                                                        >
                                                            {day.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {frequency === 'MONTHLY' && (
                                            <div className="flex items-center gap-2 w-full bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-200 dark:border-gray-600">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">On day</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="31"
                                                    value={monthDay}
                                                    onChange={(e) => setMonthDay(e.target.value)}
                                                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-center dark:bg-gray-700 dark:text-white"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">of month</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-200 dark:border-gray-700" />

                            {/* Section: Template Details */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issue Template</h3>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className={commonInputClass}
                                        placeholder="e.g., Weekly Status Report"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className={commonInputClass}
                                        >
                                            <option value="TASK">Task</option>
                                            <option value="STORY">Story</option>
                                            <option value="BUG">Bug</option>
                                        </select>
                                    </div>
                                    {/* Priority */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className={commonInputClass}
                                        >
                                            <option value="HIGHEST">Highest</option>
                                            <option value="HIGH">High</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="LOW">Low</option>
                                            <option value="LOWEST">Lowest</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Column */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Column</label>
                                        <select
                                            value={columnId}
                                            onChange={(e) => setColumnId(e.target.value)}
                                            className={commonInputClass}
                                        >
                                            {columns?.map(col => (
                                                <option key={col.id} value={col.id}>{col.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Assignee Search */}
                                    <div className="relative" ref={assigneeDropdownRef}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
                                        <input
                                            ref={assigneeInputRef}
                                            type="text"
                                            value={assigneeSearchQuery}
                                            onChange={(e) => {
                                                setAssigneeSearchQuery(e.target.value);
                                                setAssigneeDropdownVisible(true);
                                                if (selectedAssignee && e.target.value !== selectedAssignee.displayName) {
                                                    setSelectedAssignee(null); // Clear selection if typing
                                                }
                                            }}
                                            onFocus={() => setAssigneeDropdownVisible(true)}
                                            className={commonInputClass}
                                            placeholder="Search user..."
                                        />
                                        {assigneeDropdownVisible && assigneeSearchQuery.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-48 rounded-md py-1 overflow-auto focus:outline-none text-sm custom-scrollbar ring-1 ring-black ring-opacity-5">
                                                {isLoadingSearchedUsers ? (
                                                    <div className="px-3 py-2 text-gray-500">Searching...</div>
                                                ) : searchedUsers.length > 0 ? (
                                                    searchedUsers.map(u => (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between ${selectedAssignee?.id === u.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'}`}
                                                            onClick={() => handleSelectAssignee(u)}
                                                        >
                                                            <span>{u.displayName}</span>
                                                            {selectedAssignee?.id === u.id && <MdCheck className="w-4 h-4" />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-gray-500 italic">No users found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Epic Search */}
                                    <div className="relative" ref={epicDropdownRef}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Epic</label>
                                        <input
                                            ref={epicInputRef}
                                            type="text"
                                            value={epicSearchQuery}
                                            onChange={(e) => {
                                                setEpicSearchQuery(e.target.value);
                                                setEpicDropdownVisible(true);
                                                if (selectedEpic && e.target.value !== selectedEpic.title) {
                                                    setSelectedEpic(null);
                                                }
                                            }}
                                            onFocus={() => setEpicDropdownVisible(true)}
                                            className={commonInputClass}
                                            placeholder="Search epic..."
                                        />
                                        {epicDropdownVisible && epicSearchQuery.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-48 rounded-md py-1 overflow-auto focus:outline-none text-sm custom-scrollbar ring-1 ring-black ring-opacity-5">
                                                {isLoadingSearchedEpics ? (
                                                    <div className="px-3 py-2 text-gray-500">Searching...</div>
                                                ) : searchedEpics.length > 0 ? (
                                                    searchedEpics.map(e => (
                                                        <button
                                                            key={e.id}
                                                            type="button"
                                                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between ${selectedEpic?.id === e.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'}`}
                                                            onClick={() => handleSelectEpic(e)}
                                                        >
                                                            <span className="truncate">{e.title}</span>
                                                            {selectedEpic?.id === e.id && <MdCheck className="w-4 h-4 flex-shrink-0" />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-gray-500 italic">No epics found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sprint Search */}
                                    <div className="relative" ref={sprintDropdownRef}>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sprint</label>
                                        <input
                                            ref={sprintInputRef}
                                            type="text"
                                            value={sprintSearchQuery}
                                            onChange={(e) => {
                                                setSprintSearchQuery(e.target.value);
                                                setSprintDropdownVisible(true);
                                                if (selectedSprint && e.target.value !== selectedSprint.title) {
                                                    setSelectedSprint(null);
                                                }
                                            }}
                                            onFocus={() => setSprintDropdownVisible(true)}
                                            className={commonInputClass}
                                            placeholder="Search sprint..."
                                        />
                                        {sprintDropdownVisible && sprintSearchQuery.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-48 rounded-md py-1 overflow-auto focus:outline-none text-sm custom-scrollbar ring-1 ring-black ring-opacity-5">
                                                {isLoadingSearchedSprints ? (
                                                    <div className="px-3 py-2 text-gray-500">Searching...</div>
                                                ) : searchedSprints.length > 0 ? (
                                                    searchedSprints.map(s => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between ${selectedSprint?.id === s.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-100'}`}
                                                            onClick={() => handleSelectSprint(s)}
                                                        >
                                                            <span className="truncate">{s.title}</span>
                                                            {selectedSprint?.id === s.id && <MdCheck className="w-4 h-4 flex-shrink-0" />}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-gray-500 italic">No sprints found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>


                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className={commonInputClass}
                                        placeholder="Detailed description of the issue..."
                                    />
                                </div>

                                {/* Instructions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instructions</label>
                                    <textarea
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        rows={3}
                                        className={commonInputClass}
                                        placeholder="Specific instructions for this scheduled task..."
                                    />
                                </div>

                                {/* Related Code */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Related Code</label>
                                    <textarea
                                        value={relatedCode}
                                        onChange={(e) => setRelatedCode(e.target.value)}
                                        rows={3}
                                        className={`${commonInputClass} font-mono text-xs`}
                                        placeholder="Paste relevant code snippets..."
                                    />
                                </div>

                                {/* Links */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Links</label>
                                    <textarea
                                        value={links}
                                        onChange={(e) => setLinks(e.target.value)}
                                        rows={3}
                                        className={commonInputClass}
                                        placeholder="Enter links, one per line..."
                                    />
                                </div>

                            </div>
                        </form>
                    ) : (
                        <ScheduledIssuesList boardId={boardId} onEdit={handleEdit} />
                    )}
                </div>

                {/* Footer */}
                {activeTab === 'create' && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 flex-shrink-0">
                        <button
                            onClick={editingScheduleId ? handleCancelEdit : onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            {editingScheduleId ? 'Cancel' : 'Cancel'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2"
                        >
                            <MdSave className="w-4 h-4" />
                            {editingScheduleId ? 'Update Schedule' : 'Save Schedule'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScheduleIssueModal;
