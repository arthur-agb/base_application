// src/features/board/components/IssueDetailModal.jsx
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
    useCommentMutations,
    useDeleteIssue,
    useEpicSearch,
    useIssueComments,
    useIssueDetails,
    useSprintSearch,
    useUpdateIssue,
    useUserSearch,
  } from '../hooks';

import { layoutContants } from '../../../components/layout';
import { CommentItem } from '../';

import { MdExpandMore, MdCheck, MdSend, MdFullscreen, MdFullscreenExit, MdClose, MdSave, MdArticle, MdComment, MdAspectRatio, MdArrowDownward } from 'react-icons/md';

const IssueDetailModal = ({
    isOpen,
    onClose,
    issueId,
    columns,
    currentUser,
}) => {
    // Data fetching, mutation, and search hooks remain the same...
    const { data: issueData, isLoading: isLoadingIssueDetails, error: issueDetailsError } = useIssueDetails(issueId);
    const { data: commentsData, isLoading: isLoadingComments, error: commentsFetchError } = useIssueComments(issueId);
    const updateIssueMutation = useUpdateIssue();
    const deleteIssueMutation = useDeleteIssue(issueData?.boardId);
    const { addComment: addCommentMutation } = useCommentMutations(issueId);
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
    const [epicSearchQuery, setEpicSearchQuery] = useState('');
    const [sprintSearchQuery, setSprintSearchQuery] = useState('');
    const { data: searchedUsers = [], isLoading: isLoadingSearchedUsers } = useUserSearch(assigneeSearchQuery);
    const { data: searchedEpics = [], isLoading: isLoadingSearchedEpics } = useEpicSearch(issueData?.project?.key, epicSearchQuery);
    const { data: searchedSprints = [], isLoading: isLoadingSearchedSprints } = useSprintSearch(issueData?.project?.key, sprintSearchQuery);

    const selectedIssue = issueData;
    const displayComments = commentsData || [];

    // Local UI state remains the same...
    const [mobileView, setMobileView] = useState('details');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [isEditingAssignee, setIsEditingAssignee] = useState(false);
    const [assigneeDropdownVisible, setAssigneeDropdownVisible] = useState(false);
    const [pendingAssignee, setPendingAssignee] = useState(null);
    const [isEditingEpic, setIsEditingEpic] = useState(false);
    const [epicDropdownVisible, setEpicDropdownVisible] = useState(false);
    const [pendingEpic, setPendingEpic] = useState(null);
    const [isEditingSprint, setIsEditingSprint] = useState(false);
    const [sprintDropdownVisible, setSprintDropdownVisible] = useState(false);
    const [pendingSprint, setPendingSprint] = useState(null);
    const [isEditingRelatedCode, setIsEditingRelatedCode] = useState(false);
    const [editedRelatedCode, setEditedRelatedCode] = useState('');
    const [isEditingLinks, setIsEditingLinks] = useState(false);
    const [editedLinks, setEditedLinks] = useState('');
    const [isEditingInstructions, setIsEditingInstructions] = useState(false);
    const [editedInstructions, setEditedInstructions] = useState('');
    const [selectedColumnId, setSelectedColumnId] = useState('');
    const [newTopLevelCommentText, setNewTopLevelCommentText] = useState('');
    const [leftPanelWidth, setLeftPanelWidth] = useState(60);
    const [isResizing, setIsResizing] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
    const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
    const [editedType, setEditedType] = useState('TASK');
    const [editedPriority, setEditedPriority] = useState('LOWEST');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isCommentInputEnlarged, setIsCommentInputEnlarged] = useState(false);
    const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
    const [showEnlargeButton, setShowEnlargeButton] = useState(false);

    // Refs and constants remain the same...
    const assigneeInputRef = useRef(null);
    const assigneeDropdownRef = useRef(null);
    const epicInputRef = useRef(null);
    const epicDropdownRef = useRef(null);
    const sprintInputRef = useRef(null);
    const sprintDropdownRef = useRef(null);
    const statusDropdownRef = useRef(null);
    const typeDropdownRef = useRef(null);
    const priorityDropdownRef = useRef(null);
    const resizableContainerRef = useRef(null);
    const modalContentRef = useRef(null);
    const dividerRef = useRef(null);
    const backdropRef = useRef(null);
    const commentInputRef = useRef(null);
    const commentsContainerRef = useRef(null);
    const { HEADER_HEIGHT_NUMBER, HEADER_HEIGHT_STRING } = layoutContants;
    const dynamicMobileMarginTop = `mt-[${HEADER_HEIGHT_STRING}]`;
    const dynamicMobileHeight = `h-[calc(100vh-${HEADER_HEIGHT_NUMBER * 2}px)]`;
    const MIN_PANEL_WIDTH = 20;
    const MAX_PANEL_WIDTH = 80;
    const DIVIDER_WIDTH_PX = 8;
    
    // Permission logic remains the same...
    const projectLeadId = selectedIssue?.project?.lead?.id;
    const canEditIssueDetails = selectedIssue && currentUser && (currentUser.role === 'ADMIN' || currentUser.id === selectedIssue?.assignee?.id || (projectLeadId && currentUser.id === projectLeadId));
    
    // NEW: Function to close all editable fields
    const closeAllEditableFields = () => {
        setIsEditingTitle(false);
        setIsEditingDescription(false);
        setIsEditingRelatedCode(false);
        setIsEditingLinks(false);
        setIsEditingInstructions(false);

        setIsEditingAssignee(false);
        setAssigneeDropdownVisible(false);
        setPendingAssignee(null);

        setIsEditingEpic(false);
        setEpicDropdownVisible(false);
        setPendingEpic(null);
        
        setIsEditingSprint(false);
        setSprintDropdownVisible(false);
        setPendingSprint(null);

        // Restore any edited values to their original state
        if (selectedIssue) {
            setEditedTitle(selectedIssue.title || '');
            setEditedDescription(selectedIssue.description || '');
            setEditedRelatedCode(selectedIssue.relatedCode || '');
            setEditedLinks(selectedIssue.links ? selectedIssue.links.join('\n') : '');
            setEditedInstructions(selectedIssue.instructions || '');
            setAssigneeSearchQuery(selectedIssue?.assignee?.displayName || '');
            setEpicSearchQuery(selectedIssue?.epic?.title || '');
            setSprintSearchQuery(selectedIssue?.sprint?.title || '');
        }
    };

    // Effects and other handlers remain largely the same...
    useEffect(() => {
        if (updateIssueMutation.isSuccess) {
            closeAllEditableFields(); // Close fields on successful save
        }
    }, [updateIssueMutation.isSuccess]);

    useEffect(() => {
        if (deleteIssueMutation.isSuccess) {
            onClose();
        }
    }, [deleteIssueMutation.isSuccess, onClose]);

    useEffect(() => {
        if (selectedIssue && selectedIssue.id === issueId) {
            setEditedTitle(selectedIssue.title || '');
            setEditedDescription(selectedIssue.description || '');
            setSelectedColumnId(selectedIssue.columnId || '');
            setEditedRelatedCode(selectedIssue.relatedCode || '');
            setEditedLinks(selectedIssue.links ? selectedIssue.links.join('\n') : '');
            setEditedInstructions(selectedIssue.instructions || '');
            setEditedType(selectedIssue.type || 'TASK');
            setEditedPriority(selectedIssue.priority || 'LOWEST');
            setPendingAssignee(null);
            setPendingEpic(null);
            setPendingSprint(null);
            if (!isEditingAssignee) setAssigneeSearchQuery(selectedIssue?.assignee?.displayName || '');
            if (!isEditingEpic) setEpicSearchQuery(selectedIssue?.epic?.title || '');
            if (!isEditingSprint) setSprintSearchQuery(selectedIssue?.sprint?.title || '');
        } else if (!issueId) {
            setEditedTitle(''); setEditedDescription(''); setSelectedColumnId(''); setNewTopLevelCommentText(''); setAssigneeSearchQuery(''); setPendingAssignee(null); setEpicSearchQuery(''); setPendingEpic(null); setSprintSearchQuery(''); setPendingSprint(null); setEditedRelatedCode(''); setEditedLinks(''); setEditedInstructions(''); setEditedType('TASK'); setEditedPriority('LOWEST'); setIsFullScreen(false);
        }
    }, [selectedIssue, issueId, isEditingAssignee, isEditingEpic, isEditingSprint]);

    const handleClose = useCallback(() => {
        setIsFullScreen(false);
        setMobileView('details');
        onClose();
    }, [onClose]);
    
    // ... other useEffects ...

    // --- UPDATED: "Start Editing" Handlers ---
    const startAssigneeEdit = () => {
        if (!canEditIssueDetails) return;
        closeAllEditableFields(); // ADDED
        setIsEditingAssignee(true);
        setPendingAssignee(null);
        const currentAssigneeName = selectedIssue?.assignee?.displayName || '';
        setAssigneeSearchQuery(currentAssigneeName);
        setTimeout(() => assigneeInputRef.current?.focus(), 0);
    };

    const startEpicEdit = () => {
        if (!canEditIssueDetails) return;
        closeAllEditableFields(); // ADDED
        setIsEditingEpic(true);
        setPendingEpic(null);
        setEpicSearchQuery(selectedIssue?.epic?.title || '');
        setTimeout(() => epicInputRef.current?.focus(), 0);
    };

    const startSprintEdit = () => {
        if (!canEditIssueDetails) return;
        closeAllEditableFields(); // ADDED
        setIsEditingSprint(true);
        setPendingSprint(null);
        setSprintSearchQuery(selectedIssue?.sprint?.title || '');
        setTimeout(() => sprintInputRef.current?.focus(), 0);
    };

    // ... other handlers like handleSelect...FromDropdown, handleCancel...Edit, handleSave... remain the same ...
    const handleSelectAssigneeFromDropdown = (userToAssign) => { setPendingAssignee(userToAssign); setAssigneeSearchQuery(userToAssign.displayName); setAssigneeDropdownVisible(false); assigneeInputRef.current?.focus(); };
    const handleCancelAssigneeEdit = () => { setIsEditingAssignee(false); setAssigneeSearchQuery(selectedIssue?.assignee?.displayName || ''); setAssigneeDropdownVisible(false); setPendingAssignee(null); };
    const handleSelectEpicFromDropdown = (epicToAssign) => { setPendingEpic(epicToAssign); setEpicSearchQuery(epicToAssign.title); setEpicDropdownVisible(false); epicInputRef.current?.focus(); };
    const handleCancelEpicEdit = () => { setIsEditingEpic(false); setEpicSearchQuery(selectedIssue?.epic?.title || ''); setEpicDropdownVisible(false); setPendingEpic(null); };
    const handleSelectSprintFromDropdown = (sprintToAssign) => { setPendingSprint(sprintToAssign); setSprintSearchQuery(sprintToAssign.title); setSprintDropdownVisible(false); sprintInputRef.current?.focus(); };
    const handleCancelSprintEdit = () => { setIsEditingSprint(false); setSprintSearchQuery(selectedIssue?.sprint?.title || ''); setSprintDropdownVisible(false); setPendingSprint(null); };
    
    // ... Event Handlers for saving data remain the same ...
    
    // UPDATED: renderEditableField now calls closeAllEditableFields
    const renderEditableField = (label, fieldName, value, editedValue, setEditedValue, isEditing, setIsEditing, isTextArea = false, placeholder = '', rows = 3, inputType = "text") => {
        const canEditField = canEditIssueDetails;
        const commonInputClass = "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
        const displayClass = `text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[2.5em] p-2 rounded ${canEditField ? 'cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-700/60' : 'cursor-default'}`;

        return (
            <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{label}</h3>
                {isEditing && canEditField ? (
                    <div className="flex flex-col gap-2">
                        {isTextArea ? (
                            <textarea value={editedValue} onChange={(e) => setEditedValue(e.target.value)} className={commonInputClass} rows={rows} autoFocus placeholder={placeholder} />
                        ) : (
                            <input type={inputType} value={editedValue} onChange={(e) => setEditedValue(e.target.value)} className={commonInputClass} autoFocus placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && inputType !== 'textarea') { e.preventDefault(); handleSaveIssueFieldEdit(fieldName, editedValue); } }}/>
                        )}
                        <div className="flex items-center gap-2 justify-end">
                            <button onClick={() => handleSaveIssueFieldEdit(fieldName, editedValue)} disabled={updateIssueMutation.isPending} className="px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50">Save</button>
                            <button onClick={() => { setIsEditing(false); setEditedValue(value || (fieldName === 'links' && Array.isArray(value) ? value.join('\n') : '')); }} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div 
                        onClick={() => {
                            if (canEditField) {
                                closeAllEditableFields(); // ADDED
                                setIsEditing(true);
                            }
                        }} 
                        className={displayClass} 
                        title={canEditField ? `Click to edit ${label.toLowerCase()}` : (value || `No ${label.toLowerCase()} provided.` )}>
                        {/* ... display logic ... */}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;
    
    // ... variables for JSX ...
    
    return (
        <div /* ... */ >
            <div /* ... */ >
                {/* Header Section */}
                <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center gap-4">
                    <div className="flex-grow flex flex-col md:flex-row md:items-center gap-3 md:gap-4 min-w-0">
                        {isLoadingInitialData ? ( /* ... */ ) : (
                            <div className="flex-1 min-w-0">
                                {isEditingTitle && canEditIssueDetails ? (
                                    // ... title input ...
                                ) : (
                                    <p className={`text-2xl font-bold text-gray-900 dark:text-gray-100 truncate p-1 -ml-1 rounded ${canEditIssueDetails ? 'cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/60' : 'cursor-default'}`}
                                       onClick={() => {
                                           if (canEditIssueDetails) {
                                               closeAllEditableFields(); // ADDED
                                               setIsEditingTitle(true);
                                           }
                                       }}
                                       title={canEditIssueDetails ? (selectedIssue?.title || "Click to edit title") : (selectedIssue?.title || "No Title")}>
                                        {selectedIssue?.title || <span className="italic text-gray-500 dark:text-gray-400">No Title</span>}
                                    </p>
                                )}
                            </div>
                        )}
                        {/* ... status dropdown ... */}
                    </div>
                    {/* ... fullscreen/close buttons ... */}
                </div>

                {/* Main Content Area */}
                {isLoadingInitialData ? ( /* ... */ ) : issueDetailsError ? ( /* ... */ ) : (
                    <>
                        {/* ... Mobile View Switcher ... */}
                        
                        <div ref={resizableContainerRef} className="flex-grow flex flex-col md:flex-row overflow-hidden">
                            {/* Left Panel */}
                            <div /* ... */ >
                                {/* ... Reporter and Assignee fields ... */}
                                {/* Note: startAssigneeEdit is already updated, so the onClick for the assignee display is correct */}
                                {/* The rest of the fields will now correctly use the updated renderEditableField */}
                                {renderEditableField("Description", "description", selectedIssue?.description, editedDescription, setEditedDescription, isEditingDescription, setIsEditingDescription, true, "Detailed description of the issue", 6)}
                                {renderEditableField("Related Code", "relatedCode", selectedIssue?.relatedCode, editedRelatedCode, setEditedRelatedCode, isEditingRelatedCode, setIsEditingRelatedCode, true, "Paste relevant code snippets here...", 8)}
                                {renderEditableField("Links", "links", selectedIssue?.links, editedLinks, setEditedLinks, isEditingLinks, setIsEditingLinks, true, "Enter links, one per line", 4)}
                                {renderEditableField("Instructions", "instructions", selectedIssue?.instructions, editedInstructions, setEditedInstructions, isEditingInstructions, setIsEditingInstructions, true, "Provide instructions for scheduled tasks...", 6)}
                                {/* ... Type/Priority/Delete sections ... */}
                            </div>

                            {/* ... Divider and Right Panel (Comments) ... */}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IssueDetailModal;