// src/features/board/components/IssueDetailModal.jsx
import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient, useMutation } from '@tanstack/react-query';

import boardService from '../services/boardService';

import {
    useCommentMutations,
    useDeleteIssue,
    useEpicSearch,
    useIssueComments,
    useIssueDetails,
    useSprintSearch,
    useUpdateIssue,
    useUserSearch,
    useIssueSearch,
    useDebounce,
} from '../hooks';

import { layoutContants } from '../../../components/layout';

import {
    clearSelectedIssue,
    CommentItem,
} from '../';

import { MdExpandMore, MdCheck, MdSend, MdFullscreen, MdFullscreenExit, MdClose, MdSave, MdArticle, MdComment, MdAspectRatio, MdArrowDownward, MdHistory, MdPersonAdd, MdDelete, MdLinkOff } from 'react-icons/md';

const SubtaskItem = ({ subtask, onUnlink, isViewer }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 overflow-hidden mb-2 last:mb-0">
            <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <MdExpandMore className={`flex-shrink-0 h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    <div className="flex flex-col min-w-0">
                        <span className={`text-sm font-medium text-gray-900 dark:text-gray-100 truncate ${subtask.status === 'DONE' ? 'line-through text-gray-500' : ''}`}>
                            {subtask.title}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${subtask.status === 'DONE' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                            {subtask.column?.name || subtask.status}
                        </span>
                    </div>
                </div>
                {subtask.assignee && (
                    <img
                        src={subtask.assignee.avatarUrl || `https://ui-avatars.com/api/?name=${subtask.assignee.displayName}&background=random`}
                        alt={subtask.assignee.displayName}
                        className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                        title={subtask.assignee.displayName}
                    />
                )}
            </div>

            {isExpanded && (
                <div className="px-3 pb-2 pt-2 text-sm border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow min-w-0">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-0.5">Description</span>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-xs">
                                {subtask.description || <span className="italic text-gray-400">No description provided.</span>}
                            </p>
                        </div>
                        {!isViewer && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to unlink subtask "${subtask.title}"?`)) {
                                        onUnlink(subtask.id);
                                    }
                                }}
                                className="flex-shrink-0 p-1.5 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Unlink Subtask"
                            >
                                <MdLinkOff className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const IssueDetailModal = ({
    isOpen,
    onClose,
    columns,
    issueId,
    user,
    projectKey,
    isViewer,
}) => {
    const queryClient = useQueryClient();

    // --- DATA FETCHING HOOKS (Queries) ---
    const { data: issueData, isLoading: isLoadingIssueDetails, error: issueDetailsError } = useIssueDetails(issueId);
    const { data: commentsData, isLoading: isLoadingComments, error: commentsFetchError } = useIssueComments(issueId);

    // --- MUTATION HOOKS ---
    const updateIssueMutation = useUpdateIssue();
    const deleteIssueMutation = useDeleteIssue(issueData?.boardId);
    const { addComment: addCommentMutation } = useCommentMutations(issueId);

    // --- SEARCH HOOKS ---
    const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
    const [epicSearchQuery, setEpicSearchQuery] = useState('');
    const [sprintSearchQuery, setSprintSearchQuery] = useState('');
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    const [subtaskSearchQuery, setSubtaskSearchQuery] = useState('');

    // --- RECENT SEARCH STATE ---
    const getRecentItem = (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            return null;
        }
    };
    const [recentAssignee, setRecentAssignee] = useState(() => getRecentItem('recentAssigneeObjectBoard'));
    const [recentEpic, setRecentEpic] = useState(() => getRecentItem('recentEpicObjectBoard'));
    const [recentSprint, setRecentSprint] = useState(() => getRecentItem('recentSprintObjectBoard'));
    const [recentParent, setRecentParent] = useState(() => getRecentItem('recentParentObjectBoard'));

    // Use projectKey from props if available as it is more reliable from Board context, otherwise fallback to issueData
    const effectiveProjectKey = projectKey || issueData?.project?.key;

    // --- DEBOUNCED SEARCH QUERIES ---
    const debouncedAssigneeQuery = useDebounce(assigneeSearchQuery, 300);
    const debouncedEpicQuery = useDebounce(epicSearchQuery, 300);
    const debouncedSprintQuery = useDebounce(sprintSearchQuery, 300);
    const debouncedParentQuery = useDebounce(parentSearchQuery, 300);
    const debouncedSubtaskQuery = useDebounce(subtaskSearchQuery, 300);

    const { data: searchedUsers = [], isLoading: isLoadingSearchedUsers } = useUserSearch(debouncedAssigneeQuery);
    const { data: searchedEpics = [], isLoading: isLoadingSearchedEpics } = useEpicSearch(effectiveProjectKey, debouncedEpicQuery);
    const { data: searchedSprints = [], isLoading: isLoadingSearchedSprints } = useSprintSearch(effectiveProjectKey, debouncedSprintQuery);
    const { data: searchedParents = [], isLoading: isLoadingSearchedParents } = useIssueSearch(debouncedParentQuery, issueData?.boardId);
    const { data: searchedSubtasks = [], isLoading: isLoadingSearchedSubtasks } = useIssueSearch(debouncedSubtaskQuery, issueData?.boardId);

    const selectedIssue = issueData;
    const displayComments = commentsData || [];

    // --- LOCAL UI STATE ---
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
    const [isEditingParent, setIsEditingParent] = useState(false);
    const [parentDropdownVisible, setParentDropdownVisible] = useState(false);
    const [pendingParent, setPendingParent] = useState(null);
    const [isLinkingSubtask, setIsLinkingSubtask] = useState(false);
    const [subtaskDropdownVisible, setSubtaskDropdownVisible] = useState(false);
    const [pendingSubtask, setPendingSubtask] = useState(null);
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

    // --- REFS ---
    const assigneeInputRef = useRef(null);
    const assigneeDropdownRef = useRef(null);
    const epicInputRef = useRef(null);
    const epicDropdownRef = useRef(null);
    const sprintInputRef = useRef(null);
    const sprintDropdownRef = useRef(null);
    const parentInputRef = useRef(null);
    const parentDropdownRef = useRef(null);
    const subtaskInputRef = useRef(null);
    const subtaskDropdownRef = useRef(null);
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

    // --- PERMISSION LOGIC ---
    const projectLeadId = selectedIssue?.project?.projectLead?.id;
    const canEditIssueDetails = !isViewer && selectedIssue && user && (user.role === 'ADMIN' || user.id === selectedIssue?.assignee?.id || (projectLeadId && user.id === projectLeadId));

    // --- EFFECTS ---

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

        setIsEditingParent(false);
        setParentDropdownVisible(false);
        setPendingParent(null);
        setIsLinkingSubtask(false);
        setSubtaskDropdownVisible(false);
        setPendingSubtask(null);
        setSubtaskSearchQuery('');

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
            setParentSearchQuery(selectedIssue?.parentIssue?.title || '');
        }
    };

    // Effect to handle successful updates by resetting editing states
    useEffect(() => {
        if (updateIssueMutation.isSuccess) {
            closeAllEditableFields(); // Close fields on successful save
        }
    }, [updateIssueMutation.isSuccess]);

    // Effect to handle successful deletion by closing the modal
    useEffect(() => {
        if (deleteIssueMutation.isSuccess) {
            onClose();
        }
    }, [deleteIssueMutation.isSuccess, onClose]);

    // Effect to populate form state when issue data loads or changes
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
            if (!isEditingParent) setParentSearchQuery(selectedIssue?.parentIssue?.title || '');
        } else if (!issueId) {
            setEditedTitle('');
            setEditedDescription('');
            setSelectedColumnId('');
            setNewTopLevelCommentText('');
            setAssigneeSearchQuery('');
            setPendingAssignee(null);
            setEpicSearchQuery('');
            setPendingEpic(null);
            setSprintSearchQuery('');
            setPendingSprint(null);
            setParentSearchQuery('');
            setPendingParent(null);
            setSubtaskSearchQuery('');
            setPendingSubtask(null);
            setEditedRelatedCode('');
            setEditedLinks('');
            setEditedInstructions('');
            setEditedType('TASK');
            setEditedPriority('LOWEST');
            setIsFullScreen(false);
        }
    }, [selectedIssue, issueId, isEditingAssignee, isEditingEpic, isEditingSprint]);

    const handleClose = useCallback(() => {
        setIsFullScreen(false);
        setMobileView('details');
        onClose();
    }, [onClose]);

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                if (assigneeDropdownVisible) setAssigneeDropdownVisible(false);
                else if (epicDropdownVisible) setEpicDropdownVisible(false);
                else if (sprintDropdownVisible) setSprintDropdownVisible(false);
                else if (parentDropdownVisible) setParentDropdownVisible(false);
                else if (subtaskDropdownVisible) setSubtaskDropdownVisible(false);
                else if (isStatusDropdownOpen) setIsStatusDropdownOpen(false);
                else if (isTypeDropdownOpen) setIsTypeDropdownOpen(false);
                else if (isPriorityDropdownOpen) setIsPriorityDropdownOpen(false);
                else if (isFullScreen) setIsFullScreen(false);
                else handleClose();
            }
        };
        if (isOpen) { window.addEventListener('keydown', handleEscKey); }
        return () => { window.removeEventListener('keydown', handleEscKey); };
    }, [isOpen, handleClose, isFullScreen, assigneeDropdownVisible, epicDropdownVisible, sprintDropdownVisible, parentDropdownVisible, isStatusDropdownOpen, isTypeDropdownOpen, isPriorityDropdownOpen]);

    useEffect(() => {
        const handleClickOutsideDropdown = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) { setIsStatusDropdownOpen(false); }
            if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) { setIsTypeDropdownOpen(false); }
            if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) { setIsPriorityDropdownOpen(false); }
            if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target) &&
                assigneeInputRef.current && !assigneeInputRef.current.contains(event.target)) {
                setAssigneeDropdownVisible(false);
            }
            if (epicDropdownRef.current && !epicDropdownRef.current.contains(event.target) &&
                epicInputRef.current && !epicInputRef.current.contains(event.target)) {
                setEpicDropdownVisible(false);
            }
            if (sprintDropdownRef.current && !sprintDropdownRef.current.contains(event.target) &&
                sprintInputRef.current && !sprintInputRef.current.contains(event.target)) {
                setSprintDropdownVisible(false);
            }
            if (parentDropdownRef.current && !parentDropdownRef.current.contains(event.target) &&
                parentInputRef.current && !parentInputRef.current.contains(event.target)) {
                setParentDropdownVisible(false);
            }
            if (subtaskDropdownRef.current && !subtaskDropdownRef.current.contains(event.target) &&
                subtaskInputRef.current && !subtaskInputRef.current.contains(event.target)) {
                setSubtaskDropdownVisible(false);
            }
        };
        if (isStatusDropdownOpen || assigneeDropdownVisible || epicDropdownVisible || sprintDropdownVisible || parentDropdownVisible || subtaskDropdownVisible || isTypeDropdownOpen || isPriorityDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutsideDropdown);
        }
        return () => { document.removeEventListener('mousedown', handleClickOutsideDropdown); };
    }, [isStatusDropdownOpen, assigneeDropdownVisible, epicDropdownVisible, sprintDropdownVisible, parentDropdownVisible, subtaskDropdownVisible, isTypeDropdownOpen, isPriorityDropdownOpen]);

    const handleMouseDownOnDivider = useCallback((e) => { e.preventDefault(); setIsResizing(true); document.body.style.userSelect = 'none'; document.body.style.cursor = 'col-resize'; }, []);
    const handleMouseMove = useCallback((e) => { if (!isResizing || !resizableContainerRef.current) return; const c = resizableContainerRef.current; const r = c.getBoundingClientRect(); let n = ((e.clientX - r.left) / r.width) * 100; n = Math.max(MIN_PANEL_WIDTH, Math.min(n, MAX_PANEL_WIDTH)); setLeftPanelWidth(n); }, [isResizing]);
    const handleMouseUp = useCallback(() => { if (isResizing) { setIsResizing(false); document.body.style.userSelect = ''; document.body.style.cursor = ''; } }, [isResizing]);

    useEffect(() => { if (isResizing) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); } return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); if (document.body.style.userSelect === 'none') { document.body.style.userSelect = ''; document.body.style.cursor = ''; } }; }, [isResizing, handleMouseMove, handleMouseUp]);

    const handleClickOutside = (event) => {
        if (backdropRef.current && event.target === backdropRef.current) {
            if (isFullScreen) setIsFullScreen(false);
            handleClose();
        }
    };

    // Assignee dropdown visibility
    useEffect(() => {
        if (isEditingAssignee && assigneeSearchQuery.trim().length > 0) {
            setAssigneeDropdownVisible(true);
        }
    }, [isEditingAssignee, assigneeSearchQuery]);

    // Epic dropdown visibility
    useEffect(() => {
        if (isEditingEpic && epicSearchQuery.trim().length > 0) {
            setEpicDropdownVisible(true);
        }
    }, [isEditingEpic, epicSearchQuery]);

    // Sprint dropdown visibility
    useEffect(() => {
        if (isEditingSprint && sprintSearchQuery.trim().length > 0) {
            setSprintDropdownVisible(true);
        }
    }, [isEditingSprint, sprintSearchQuery]);

    // Parent dropdown visibility
    useEffect(() => {
        if (isEditingParent && parentSearchQuery.trim().length > 0) {
            setParentDropdownVisible(true);
        }
    }, [isEditingParent, parentSearchQuery]);

    // Subtask dropdown visibility
    useEffect(() => {
        if (isLinkingSubtask && subtaskSearchQuery.trim().length > 0) {
            setSubtaskDropdownVisible(true);
        }
    }, [isLinkingSubtask, subtaskSearchQuery]);


    // Comment Input Height useEffect
    useEffect(() => {
        const textarea = commentInputRef.current;
        if (textarea) {
            // When enlarged, the button should always be visible.
            if (isCommentInputEnlarged) {
                textarea.style.height = '100%';
                textarea.style.overflowY = 'auto';
                setShowEnlargeButton(true);
                return;
            }

            // In normal view, calculate heights to determine visibility and size.
            textarea.style.height = 'auto';

            const computedStyle = getComputedStyle(textarea);
            const lineHeight = parseFloat(computedStyle.lineHeight) || 20;

            // --- LOGIC FOR VISIBILITY ---
            // Show the button if the scrollHeight exceeds the height of a single line.
            // A 2px buffer is added for consistency across browsers.
            const isMultiLine = textarea.scrollHeight > (lineHeight + 2);
            setShowEnlargeButton(isMultiLine);

            // --- LOGIC FOR 3-LINE LIMIT ---
            const paddingTop = parseFloat(computedStyle.paddingTop);
            const paddingBottom = parseFloat(computedStyle.paddingBottom);
            const maxHeight = (lineHeight * 3) + paddingTop + paddingBottom;
            const scrollHeight = textarea.scrollHeight;

            if (scrollHeight > maxHeight) {
                textarea.style.height = `${maxHeight}px`;
                textarea.style.overflowY = 'auto';
            } else {
                textarea.style.height = `${scrollHeight}px`;
                textarea.style.overflowY = 'hidden';
            }
        } else {
            setShowEnlargeButton(false);
        }
    }, [newTopLevelCommentText, isCommentInputEnlarged]);

    /**
     * Scrolls the comments container to the bottom.
     * The native 'smooth' behavior typically provides an ease-in-out animation,
     * which matches the requirement for a slow acceleration and deceleration.
     * @param {'smooth' | 'auto'} behavior - The scrolling animation behavior.
     */
    const scrollToBottom = useCallback((behavior = 'smooth') => {
        const container = commentsContainerRef.current;
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: behavior,
            });
        }
    }, []);

    // Auto scroll to bottom of comment on modal open
    useLayoutEffect(() => { // useLayoutEffect runs before the browser paints, ensuring the scroll happens immediately.
        if (isOpen && !isLoadingIssueDetails && !isLoadingComments && commentsData?.length > 0) {
            // 'auto' behavior makes the scroll instantaneous.
            scrollToBottom('auto');
        }
    }, [isOpen, isLoadingIssueDetails, isLoadingComments, commentsData, scrollToBottom]);

    // Effect to manage the visibility of the scroll-to-bottom button
    useEffect(() => {
        const container = commentsContainerRef.current;

        const handleScroll = () => {
            if (container) {
                // Show the button if the user has scrolled up more than 300px from the bottom
                const isScrolledUp = container.scrollHeight - container.scrollTop > container.clientHeight + 300;
                setShowScrollToBottomButton(isScrolledUp);
            }
        };

        if (container) {
            // Check initial position and on subsequent scroll events
            handleScroll(); 1
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [commentsData, isLoadingComments]);

    // Effect to scroll to the bottom of comments when switching to the comments tab on mobile
    useLayoutEffect(() => {
        // Use `useLayoutEffect` to scroll *before* the browser paints the screen.
        // This ensures the user does not see a scroll animation when switching to the comments view.
        if (mobileView === 'comments' && !isLoadingComments && commentsData?.length > 0) {
            // The 'auto' behavior makes the scroll instantaneous, which is appropriate
            // since it happens before the component is visually rendered.
            scrollToBottom('auto');
        }
    }, [mobileView, isLoadingComments, commentsData, scrollToBottom]);


    const handleSaveAssignee = (newAssigneeId) => {
        if (!selectedIssueId || newAssigneeId === undefined) {
            console.error("Cannot save assignee, selectedIssueId or newAssigneeId is missing/invalid.");
            return;
        }
        if (newAssigneeId === selectedIssue?.assigneeId) {
            setIsEditingAssignee(false);
            setAssigneeDropdownVisible(false);
            setPendingAssignee(null);
            setAssigneeSearchQuery(selectedIssue?.assignee?.displayName || '');
            return;
        }
        updateIssueMutation.mutate({ assigneeId: newAssigneeId });
    };

    const handleSelectAssigneeFromDropdown = (userToAssign) => {
        setPendingAssignee(userToAssign);
        setAssigneeSearchQuery(userToAssign.displayName);

        // Save the full user object
        if (userToAssign) {
            const userToSave = { id: userToAssign.id, displayName: userToAssign.displayName, email: userToAssign.email, avatarUrl: userToAssign.avatarUrl };
            localStorage.setItem('recentAssigneeObjectBoard', JSON.stringify(userToSave));
            setRecentAssignee(userToSave);
        }

        // setSearchedUsers([]);
        setAssigneeDropdownVisible(false);
        assigneeInputRef.current?.focus();
    };

    const handleAssignToMe = () => {
        if (!user) return;
        const userAsAssignee = {
            id: user.id,
            displayName: user.displayName || user.name || user.email, // Fallback to ensure displayable name
            email: user.email,
            avatarUrl: user.avatarUrl
        };
        handleSelectAssigneeFromDropdown(userAsAssignee);
    };

    const handleCancelAssigneeEdit = () => {
        setIsEditingAssignee(false);
        setAssigneeSearchQuery(selectedIssue?.assignee?.displayName || '');
        setAssigneeDropdownVisible(false);
        setPendingAssignee(null);
    };

    const startAssigneeEdit = async () => {
        if (!canEditIssueDetails) return;
        closeAllEditableFields();
        setIsEditingAssignee(true);
        setPendingAssignee(null);
        const currentAssigneeName = selectedIssue?.assignee?.displayName || '';
        setAssigneeSearchQuery(currentAssigneeName);
        setTimeout(() => assigneeInputRef.current?.focus(), 0);
    };

    // --- Epic Handlers ---
    const handleSelectEpicFromDropdown = (epicToAssign) => {
        // Save the full epic object
        if (epicToAssign) {
            const epicToSave = { id: epicToAssign.id, title: epicToAssign.title };
            localStorage.setItem('recentEpicObjectBoard', JSON.stringify(epicToSave));
            setRecentEpic(epicToSave);
        }

        setPendingEpic(epicToAssign);
        setEpicSearchQuery(epicToAssign.title);
        //setSearchedEpics([]);
        setEpicDropdownVisible(false);
        epicInputRef.current?.focus();
    };

    const handleCancelEpicEdit = () => {
        setIsEditingEpic(false);
        setEpicSearchQuery(selectedIssue?.epic?.title || '');
        setEpicDropdownVisible(false);
        setPendingEpic(null);
    };

    const startEpicEdit = () => {
        if (!canEditIssueDetails) return;
        closeAllEditableFields();
        setIsEditingEpic(true);
        setPendingEpic(null);
        setEpicSearchQuery(selectedIssue?.epic?.title || '');
        setTimeout(() => epicInputRef.current?.focus(), 0);
    };

    // --- Sprint Handlers ---
    const handleSelectSprintFromDropdown = (sprintToAssign) => {
        // Save the full sprint object
        if (sprintToAssign) {
            const sprintToSave = { id: sprintToAssign.id, title: sprintToAssign.title };
            localStorage.setItem('recentSprintObjectBoard', JSON.stringify(sprintToSave));
            setRecentSprint(sprintToSave);
        }

        setPendingSprint(sprintToAssign);
        setSprintSearchQuery(sprintToAssign.title);
        // setSearchedSprints([]);
        setSprintDropdownVisible(false);
        sprintInputRef.current?.focus();
    };

    const handleCancelSprintEdit = () => {
        setIsEditingSprint(false);
        setSprintSearchQuery(selectedIssue?.sprint?.title || '');
        setSprintDropdownVisible(false);
        setPendingSprint(null);
    };

    const startSprintEdit = () => {
        if (!canEditIssueDetails) return;
        closeAllEditableFields();
        setIsEditingSprint(true);
        setPendingSprint(null);
        setSprintSearchQuery(selectedIssue?.sprint?.title || '');
        setTimeout(() => sprintInputRef.current?.focus(), 0);
    };

    // --- Parent Issue Handlers ---
    const handleSelectParentFromDropdown = (parentToAssign) => {
        if (parentToAssign) {
            const parentToSave = { id: parentToAssign.id, title: parentToAssign.title };
            localStorage.setItem('recentParentObjectBoard', JSON.stringify(parentToSave));
            setRecentParent(parentToSave);
        }
        setPendingParent(parentToAssign);
        setParentSearchQuery(parentToAssign.title);
        setParentDropdownVisible(false);
        parentInputRef.current?.focus();
    };

    const handleCancelParentEdit = () => {
        setIsEditingParent(false);
        setParentSearchQuery(selectedIssue?.parentIssue?.title || '');
        setParentDropdownVisible(false);
        setPendingParent(null);
    };

    const startParentEdit = () => {
        if (!canEditIssueDetails) return;
        closeAllEditableFields();
        setIsEditingParent(true);
        setPendingParent(null);
        setParentSearchQuery(selectedIssue?.parentIssue?.title || '');
        setTimeout(() => parentInputRef.current?.focus(), 0);
    };

    const handleConfirmParentChange = () => {
        if (!issueId) return;
        let parentIdToSave;
        if (pendingParent) {
            parentIdToSave = pendingParent.id;
        } else if (parentSearchQuery.trim() === '' && selectedIssue?.parentIssueId !== null) {
            parentIdToSave = null;
        } else {
            setIsEditingParent(false);
            return;
        }
        updateIssueMutation.mutate({
            issueId: issueId,
            updatedDetails: { parentIssueId: parentIdToSave },
            boardId: selectedIssue.boardId
        });
    };

    const handleRemoveParent = () => {
        if (!issueId) return;
        if (window.confirm("Are you sure you want to remove the parent issue?")) {
            updateIssueMutation.mutate({
                issueId: issueId,
                updatedDetails: { parentIssueId: null },
                boardId: selectedIssue.boardId
            }, {
                onSuccess: () => {
                    setIsEditingParent(false);
                    setParentSearchQuery('');
                    setPendingParent(null);
                }
            });
        }
    };

    const handleUnlinkSubtask = (subtaskId) => {
        if (!subtaskId) return;
        updateIssueMutation.mutate({
            issueId: subtaskId,
            updatedDetails: { parentIssueId: null },
            boardId: selectedIssue.boardId
        }, {
            onSuccess: () => {
                queryClient.invalidateQueries(['issue', issueId]);
            }
        });
    };

    const handleSelectSubtaskFromDropdown = (issueToLink) => {
        setPendingSubtask(issueToLink);
        setSubtaskSearchQuery(issueToLink.title);
        setSubtaskDropdownVisible(false);
        subtaskInputRef.current?.focus();
    };

    const handleConfirmSubtaskLink = () => {
        if (!pendingSubtask || !issueId) return;

        updateIssueMutation.mutate({
            issueId: pendingSubtask.id,
            updatedDetails: { parentIssueId: issueId },
            boardId: selectedIssue.boardId
        }, {
            onSuccess: () => {
                setIsLinkingSubtask(false);
                setSubtaskSearchQuery('');
                setPendingSubtask(null);
                queryClient.invalidateQueries(['issue', issueId]);
            }
        });
    };

    const handleCancelSubtaskLink = () => {
        setIsLinkingSubtask(false);
        setSubtaskSearchQuery('');
        setSubtaskDropdownVisible(false);
        setPendingSubtask(null);
    };

    const handleTypeSelect = (newType) => {
        if (!canEditIssueDetails) return;
        setEditedType(newType);
        handleSaveIssueFieldEdit('type', newType);
        setIsTypeDropdownOpen(false);
    };

    const handlePrioritySelect = (newPriority) => {
        if (!canEditIssueDetails) return;
        setEditedPriority(newPriority);
        handleSaveIssueFieldEdit('priority', newPriority);
        setIsPriorityDropdownOpen(false);
    };

    // --- EVENT HANDLERS ---

    const handleSaveIssueFieldEdit = (field, value) => {
        if (!canEditIssueDetails || !issueId) return;

        const updatedDetails = { [field]: value };
        if (field === 'links') {
            updatedDetails.links = value.split('\n').map(link => link.trim()).filter(link => link);
        }

        updateIssueMutation.mutate({
            issueId: issueId, // Use prop
            updatedDetails,
            boardId: selectedIssue.boardId
        });
    };

    const handleStatusSelect = (newColumnId) => {
        if (!canEditIssueDetails || !issueId) return;

        setSelectedColumnId(newColumnId);
        updateIssueMutation.mutate({
            issueId: issueId, // Use prop
            updatedDetails: { columnId: newColumnId },
            boardId: selectedIssue.boardId
        });
        setIsStatusDropdownOpen(false);
    };

    const handleConfirmAssigneeChange = () => {
        if (!issueId) return;
        let assigneeIdToSave;
        if (pendingAssignee) {
            assigneeIdToSave = pendingAssignee.id;
        } else if (assigneeSearchQuery.trim() === '' && selectedIssue?.assigneeId !== null) {
            assigneeIdToSave = null;
        } else {
            setIsEditingAssignee(false);
            return;
        }

        updateIssueMutation.mutate({
            issueId: issueId, // Use prop
            updatedDetails: { assigneeUserId: assigneeIdToSave },
            boardId: selectedIssue.boardId
        });
    };

    const handleConfirmEpicChange = () => {
        if (!issueId) return;
        let epicIdToSave;
        if (pendingEpic) {
            epicIdToSave = pendingEpic.id;
        } else if (epicSearchQuery.trim() === '' && selectedIssue?.epicId !== null) {
            epicIdToSave = null;
        } else {
            setIsEditingEpic(false);
            return;
        }
        updateIssueMutation.mutate({
            issueId: issueId, // Use prop
            updatedDetails: { epicId: epicIdToSave },
            boardId: selectedIssue.boardId
        });
    };

    const handleConfirmSprintChange = () => {
        if (!issueId) return;
        let sprintIdToSave;
        if (pendingSprint) {
            sprintIdToSave = pendingSprint.id;
        } else if (sprintSearchQuery.trim() === '' && selectedIssue?.sprintId !== null) {
            sprintIdToSave = null;
        } else {
            setIsEditingSprint(false);
            return;
        }
        updateIssueMutation.mutate({
            issueId: issueId, // Use prop
            updatedDetails: { sprintId: sprintIdToSave },
            boardId: selectedIssue.boardId
        });
    };

    const handleAddTopLevelComment = () => {
        if (newTopLevelCommentText.trim() && issueId) {
            addCommentMutation.mutate(
                { issueId: issueId, text: newTopLevelCommentText, parentCommentId: null }, // Use prop
                {
                    onSuccess: () => {
                        setNewTopLevelCommentText('');
                        setTimeout(() => scrollToBottom('smooth'), 100);
                    }
                }
            );
        }
    };

    const handleDeleteIssue = () => {
        if (window.confirm("Are you sure you want to delete this issue? This action cannot be undone.")) {
            deleteIssueMutation.mutate(issueId); // Use prop
        }
    };

    const canDeleteIssue = !isViewer && selectedIssue && user && (
        user.role === 'ADMIN' ||
        user.role === 'MANAGER' ||
        (projectLeadId && user.id === projectLeadId)
    );
    const selectedColumnName = columns?.find(col => col.id === selectedColumnId)?.name || 'Select Status';

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
                            <input type={inputType} value={editedValue} onChange={(e) => setEditedValue(e.target.value)} className={commonInputClass} autoFocus placeholder={placeholder} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && inputType !== 'textarea') { e.preventDefault(); handleSaveIssueFieldEdit(fieldName, editedValue); } }} />
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
                                closeAllEditableFields();
                                setIsEditing(true);
                            }
                        }}
                        className={displayClass}
                        title={canEditField ? `Click to edit ${label.toLowerCase()}` : (value || `No ${label.toLowerCase()} provided.`)}>
                        {fieldName === 'links' && Array.isArray(value) && value.length > 0 ? (
                            <ul className="list-disc list-inside">
                                {value.map((link, index) => (
                                    <li key={index} className="truncate">
                                        <a href={link.startsWith('http') ? link : `//${link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : fieldName === 'relatedCode' && value ? (
                            <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 text-gray-800 dark:text-gray-200">{value}</pre>
                        ) : (
                            value || <span className="italic text-gray-400 dark:text-gray-500">{placeholder || `No ${label.toLowerCase()} provided.`}</span>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    const issueTypes = [
        { value: 'TASK', label: 'Task' },
        { value: 'BUG', label: 'Bug' },
        { value: 'STORY', label: 'Story' }
    ];

    const issuePriorities = [
        { value: 'LOWEST', label: 'Lowest' },
        { value: 'LOW', label: 'Low' },
        { value: 'MEDIUM', label: 'Medium' },
        { value: 'HIGH', label: 'High' },
        { value: 'HIGHEST', label: 'Highest' }
    ];

    const selectedTypeName = issueTypes.find(t => t.value === editedType)?.label || 'Select Type';
    const selectedPriorityName = issuePriorities.find(p => p.value === editedPriority)?.label || 'Select Priority';

    const isLoadingInitialData = isLoadingIssueDetails;
    const commonInputClass = "block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";

    return (
        <div
            ref={backdropRef}
            className={`absolute inset-0 z-50 flex justify-center items-start sm:items-center ${isFullScreen ? `px-4 pt-4 pb-4 sm:px-6 sm:pb-6 md:pt-8 lg:px-8 lg:pb-8` : `p-4`} bg-black/50 backdrop-blur-sm -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8 -mt-4 md:-mt-8`}
            onMouseDown={handleClickOutside}
        >
            <div
                ref={modalContentRef}
                onMouseDown={(e) => e.stopPropagation()}
                className={`bg-white dark:bg-gray-800 shadow-xl flex flex-col overflow-hidden border border-gray-300 dark:border-gray-600 transition-all duration-300 ease-in-out
                    ${dynamicMobileHeight} ${dynamicMobileMarginTop} sm:mt-0
                    rounded-none sm:rounded-lg
                    
                    ${isFullScreen
                        ? 'w-full h-full rounded-none'
                        : 'w-full max-w-[1000px] h-[90%] rounded-lg'
                    }
                `}
            >
                {/* Header Section */}
                <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center gap-4">
                    <div className="flex-grow flex flex-col md:flex-row md:items-center gap-3 md:gap-4 min-w-0">
                        {isLoadingInitialData ? (
                            <div className="text-xl font-bold text-gray-900 dark:text-gray-100 animate-pulse">Loading...</div>
                        ) : (
                            <div className="flex-1 min-w-0">
                                {isEditingTitle && canEditIssueDetails ? (
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className={commonInputClass + " text-xl font-bold"} autoFocus onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveIssueFieldEdit('title', editedTitle); } }} />
                                        <button onClick={() => handleSaveIssueFieldEdit('title', editedTitle)} disabled={updateIssueMutation.isPending} className="px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50">Save</button>
                                        <button onClick={() => { setIsEditingTitle(false); setEditedTitle(selectedIssue?.title || ''); }} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800">Cancel</button>
                                    </div>
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
                        {!isLoadingInitialData && selectedIssue && (
                            <div className="relative w-full md:w-auto md:min-w-[180px] lg:min-w-[200px] flex-shrink-0" ref={statusDropdownRef}>
                                <button type="button"
                                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                    onClick={() => canEditIssueDetails && setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                    aria-haspopup="listbox"
                                    aria-expanded={isStatusDropdownOpen}
                                    disabled={!canEditIssueDetails || updateIssueMutation.isPending || isLoadingInitialData}
                                >
                                    <span className="flex items-center justify-between"> <span className="truncate text-gray-900 dark:text-gray-100">{selectedColumnName}</span> <MdExpandMore className={`ml-2 h-5 w-5 text-gray-400 dark:text-gray-500 transform transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} /> </span>
                                </button>
                                {isStatusDropdownOpen && (
                                    <div className="absolute z-30 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
                                        {columns?.map(column => (
                                            <button key={column.id} type="button"
                                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${selectedColumnId === column.id ? 'font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'} ${(!canEditIssueDetails || updateIssueMutation.isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={() => handleStatusSelect(column.id)}
                                                disabled={!canEditIssueDetails || updateIssueMutation.isPending}>
                                                <span className="truncate">{column.name}</span> {selectedColumnId === column.id && (<MdCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />)}
                                            </button>
                                        ))}
                                        {(!columns || columns.length === 0) && (<div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No columns available.</div>)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center flex-shrink-0">
                        <button onClick={() => setIsFullScreen(!isFullScreen)} className="hidden md:block text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 mr-2" aria-label={isFullScreen ? "Exit full screen mode" : "Enter full screen mode"} title={isFullScreen ? "Exit full screen" : "Full screen"} >
                            {isFullScreen ? <MdFullscreenExit className="h-6 w-6" /> : <MdFullscreen className="h-6 w-6" />}
                        </button>
                        <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500" onClick={handleClose} aria-label="Close issue details" title="Close" >
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                {isLoadingInitialData ? (
                    <div className="flex-grow flex justify-center items-center text-gray-600 dark:text-gray-300 p-6">Loading issue details...</div>
                ) : issueDetailsError ? (
                    <div className="flex-grow flex justify-center items-center text-red-600 dark:text-red-400 p-6">Error fetching issue: {issueDetailsError.message}</div>
                ) : (
                    <>
                        {/* --- Mobile View Switcher --- */}
                        <div className="px-4 py-2 border-b border-gray-300 dark:border-gray-600 md:hidden">
                            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setMobileView('details')}
                                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors duration-200 ${mobileView === 'details'
                                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 shadow'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                                        }`}
                                >
                                    <MdArticle className="h-5 w-5" />
                                    Details
                                </button>
                                <button
                                    onClick={() => setMobileView('comments')}
                                    className={`flex-1 py-2 px-4 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors duration-200 ${mobileView === 'comments'
                                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 shadow'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                                        }`}
                                >
                                    <MdComment className="h-5 w-5" />
                                    Comments
                                </button>
                            </div>
                        </div>
                        {/* --- End Mobile View Switcher --- */}

                        <div ref={resizableContainerRef} className="flex-grow flex flex-col md:flex-row overflow-hidden">
                            {/* Left Panel */}
                            <div
                                className={`${mobileView === 'details' ? 'flex' : 'hidden'} md:flex flex-col flex-grow gap-y-3 w-full md:w-auto p-2 sm:p-2 lg:p-4 lg:pb-2 overflow-y-auto custom-scrollbar`}
                                style={{ flexBasis: isResizing || window.innerWidth >= 768 ? `calc(${leftPanelWidth}% - ${DIVIDER_WIDTH_PX / 2}px)` : 'auto', overflowX: 'hidden' }}
                            >
                                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                    <div className="flex flex-col flex-1">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Reporter</h3>
                                        <p className="text-base text-gray-700 dark:text-gray-300 p-2 rounded min-h-[2.5em] bg-gray-50 dark:bg-gray-700/30 truncate">
                                            {selectedIssue?.reporter?.displayName || <span className="italic text-gray-400 dark:text-gray-500">N/A</span>}
                                        </p>
                                    </div>

                                    <div className="flex flex-col flex-1">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Assignee</h3>
                                        {isEditingAssignee && canEditIssueDetails ? (
                                            <div className="relative" ref={assigneeDropdownRef}>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        ref={assigneeInputRef}
                                                        type="text"
                                                        value={assigneeSearchQuery}
                                                        onChange={(e) => {
                                                            setAssigneeSearchQuery(e.target.value);
                                                            if (e.target.value === '') {
                                                            }
                                                        }}
                                                        onFocus={() => {
                                                            if (!assigneeDropdownVisible) setAssigneeDropdownVisible(true);
                                                        }}
                                                        placeholder="Search or type to unassign"
                                                        className={commonInputClass + " flex-grow"}
                                                        disabled={updateIssueMutation.isPending}
                                                    />
                                                    <button
                                                        onClick={handleConfirmAssigneeChange}
                                                        disabled={updateIssueMutation.isPending || (!pendingAssignee && assigneeSearchQuery === (selectedIssue?.assignee?.displayName || '')) || (pendingAssignee && pendingAssignee.id === selectedIssue?.assigneeId && assigneeSearchQuery === selectedIssue?.assignee?.displayName)}
                                                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Save Assignee"
                                                        type="button"
                                                    >
                                                        <MdCheck className="h-5 w-5" />
                                                    </button>
                                                    {/* Assign to Me Button */}
                                                    <button
                                                        onClick={handleAssignToMe}
                                                        className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50"
                                                        title="Assign to Me"
                                                        type="button"
                                                        disabled={updateIssueMutation.isPending}
                                                    >
                                                        <MdPersonAdd className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelAssigneeEdit}
                                                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                        title="Cancel"
                                                        type="button"
                                                    >
                                                        <MdClose className="h-5 w-5" />
                                                    </button>
                                                </div>
                                                {assigneeDropdownVisible && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
                                                        {assigneeSearchQuery === '' && recentAssignee && (
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 border-b border-gray-100 dark:border-gray-600"
                                                                onClick={() => handleSelectAssigneeFromDropdown(recentAssignee)}
                                                            >
                                                                <MdHistory className="h-4 w-4 text-gray-400" />
                                                                <span>Recent: <span className="font-medium">{recentAssignee.displayName}</span> <span className="text-xs text-gray-500">({recentAssignee.email})</span></span>
                                                            </button>
                                                        )}
                                                        {isLoadingSearchedUsers ? (
                                                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
                                                        ) : searchedUsers.length > 0 ? (
                                                            searchedUsers.map(u => (
                                                                <button
                                                                    key={u.id}
                                                                    type="button"
                                                                    className={`w-full text-left px-4 py-2 text-sm ${(pendingAssignee?.id === u.id || selectedIssue?.assigneeId === u.id && !pendingAssignee)
                                                                        ? 'font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30'
                                                                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                                                                        }`}
                                                                    onClick={() => handleSelectAssigneeFromDropdown(u)}
                                                                    disabled={updateIssueMutation.isPending}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span>{u.displayName} <span className="text-xs text-gray-500 dark:text-gray-400">({u.email})</span></span>
                                                                        {(pendingAssignee?.id === u.id || selectedIssue?.assigneeId === u.id && !pendingAssignee) && <MdCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                                                {assigneeSearchQuery ? "No users found." : "Type to search users."}
                                                            </div>
                                                        )}
                                                        {selectedIssue?.assigneeId && !searchedUsers.length && assigneeSearchQuery.trim() === '' && (
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                                onClick={() => {
                                                                    setPendingAssignee({ id: null, name: "Unassigned" });
                                                                    setAssigneeSearchQuery("");
                                                                    setAssigneeDropdownVisible(false);
                                                                }}
                                                            >
                                                                Unassign
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                onClick={startAssigneeEdit}
                                                className={`text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[2.5em] p-2 rounded ${canEditIssueDetails ? 'cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-700/60' : 'cursor-default'} truncate`}
                                                title={canEditIssueDetails ? "Click to change Assignee" : (selectedIssue?.assignee?.displayName || "Unassigned")}
                                            >
                                                {selectedIssue?.assignee?.displayName || <span className="italic text-gray-400 dark:text-gray-500">Unassigned</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {renderEditableField("Description", "description", selectedIssue?.description, editedDescription, setEditedDescription, isEditingDescription, setIsEditingDescription, true, "Detailed description of the issue", 6)}

                                {/* ISSUE HIERARCHY SECTION (Parent & Subtasks) */}
                                <div className="flex flex-col gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50/30 dark:bg-gray-800/30">
                                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Issue Hierarchy</h3>

                                    {/* Parent Issue */}
                                    <div className="flex flex-col">
                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Parent Issue</h4>
                                        {isEditingParent && canEditIssueDetails ? (
                                            <div className="relative" ref={parentDropdownRef}>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        ref={parentInputRef}
                                                        type="text"
                                                        value={parentSearchQuery}
                                                        onChange={(e) => setParentSearchQuery(e.target.value)}
                                                        onFocus={() => { if (!parentDropdownVisible) setParentDropdownVisible(true); }}
                                                        placeholder="Search for parent issue..."
                                                        className={commonInputClass + " flex-grow"}
                                                        disabled={updateIssueMutation.isPending}
                                                    />
                                                    <button
                                                        onClick={handleConfirmParentChange}
                                                        disabled={updateIssueMutation.isPending || (!pendingParent && parentSearchQuery === (selectedIssue?.parentIssue?.title || ''))}
                                                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Save Parent"
                                                        type="button"
                                                    >
                                                        <MdCheck className="h-5 w-5" />
                                                    </button>
                                                    {selectedIssue?.parentIssueId && (
                                                        <button
                                                            onClick={handleRemoveParent}
                                                            disabled={updateIssueMutation.isPending}
                                                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                                            title="Remove Parent"
                                                            type="button"
                                                        >
                                                            <MdLinkOff className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={handleCancelParentEdit}
                                                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                        title="Cancel"
                                                        type="button"
                                                    >
                                                        <MdClose className="h-5 w-5" />
                                                    </button>
                                                </div>
                                                {parentDropdownVisible && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
                                                        {parentSearchQuery === '' && recentParent && (
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 border-b border-gray-100 dark:border-gray-600"
                                                                onClick={() => handleSelectParentFromDropdown(recentParent)}
                                                            >
                                                                <MdHistory className="h-4 w-4 text-gray-400" />
                                                                <span>Recent: <span className="font-medium">{recentParent.title}</span></span>
                                                            </button>
                                                        )}
                                                        {isLoadingSearchedParents ? (
                                                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
                                                        ) : searchedParents.length > 0 ? (
                                                            searchedParents.map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    type="button"
                                                                    className={`w-full text-left px-4 py-2 text-sm ${(pendingParent?.id === p.id || selectedIssue?.parentIssueId === p.id && !pendingParent) ? 'font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                                                    onClick={() => handleSelectParentFromDropdown(p)}
                                                                    disabled={updateIssueMutation.isPending}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="truncate">{p.title}</span>
                                                                        {(pendingParent?.id === p.id || selectedIssue?.parentIssueId === p.id && !pendingParent) && <MdCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                                                {parentSearchQuery ? "No issues found." : "Type to search issues."}
                                                            </div>
                                                        )}
                                                        {selectedIssue?.parentIssueId && !searchedParents.length && parentSearchQuery.trim() === '' && (
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                                onClick={() => {
                                                                    setPendingParent({ id: null, title: "None" });
                                                                    setParentSearchQuery("");
                                                                    setParentDropdownVisible(false);
                                                                }}
                                                            >
                                                                Unlink Parent
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                onClick={startParentEdit}
                                                className={`text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[2.5em] p-2 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 ${canEditIssueDetails ? 'cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-700/60' : 'cursor-default'} truncate`}
                                                title={canEditIssueDetails ? "Click to change Parent" : (selectedIssue?.parentIssue?.title || "None")}
                                            >
                                                {selectedIssue?.parentIssue ? (
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-mono text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1 rounded">Parent</span>
                                                        {selectedIssue.parentIssue.title}
                                                    </span>
                                                ) : <span className="italic text-gray-400 dark:text-gray-500">None</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Subtasks */}
                                    <div className="flex flex-col mt-1">
                                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                                            Subtasks
                                            {!isViewer && !isLinkingSubtask && (
                                                <button onClick={() => setIsLinkingSubtask(true)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-medium">
                                                    + Link Subtask
                                                </button>
                                            )}
                                        </h4>
                                        <div className="flex flex-col">
                                            {selectedIssue?.subTasks?.map(subtask => (
                                                <SubtaskItem key={subtask.id} subtask={subtask} onUnlink={handleUnlinkSubtask} isViewer={isViewer} />
                                            ))}
                                            {(!selectedIssue?.subTasks || selectedIssue.subTasks.length === 0) && !isLinkingSubtask && (
                                                <div className="text-sm text-gray-400 dark:text-gray-500 italic p-2">No subtasks.</div>
                                            )}
                                            {!isViewer && isLinkingSubtask && (
                                                <div className="relative mt-2" ref={subtaskDropdownRef}>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            ref={subtaskInputRef}
                                                            type="text"
                                                            value={subtaskSearchQuery}
                                                            onChange={(e) => setSubtaskSearchQuery(e.target.value)}
                                                            onFocus={() => { if (!subtaskDropdownVisible) setSubtaskDropdownVisible(true); }}
                                                            placeholder="Search for subtask..."
                                                            className={commonInputClass + " flex-grow"}
                                                            disabled={updateIssueMutation.isPending}
                                                        />
                                                        <button
                                                            onClick={handleConfirmSubtaskLink}
                                                            disabled={updateIssueMutation.isPending || !pendingSubtask}
                                                            className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Link Subtask"
                                                            type="button"
                                                        >
                                                            <MdCheck className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelSubtaskLink}
                                                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                            title="Cancel"
                                                            type="button"
                                                        >
                                                            <MdClose className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                    {subtaskDropdownVisible && (
                                                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
                                                            {isLoadingSearchedSubtasks ? (
                                                                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
                                                            ) : searchedSubtasks.length > 0 ? (
                                                                searchedSubtasks
                                                                    .filter(s => s.id !== issueId && s.id !== selectedIssue?.parentIssueId && !selectedIssue?.subTasks?.some(st => st.id === s.id))
                                                                    .map(s => (
                                                                        <button
                                                                            key={s.id}
                                                                            type="button"
                                                                            className={`w-full text-left px-4 py-2 text-sm ${pendingSubtask?.id === s.id ? 'font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                                                            onClick={() => handleSelectSubtaskFromDropdown(s)}
                                                                            disabled={updateIssueMutation.isPending}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="truncate">{s.title}</span>
                                                                                {pendingSubtask?.id === s.id && <MdCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />}
                                                                            </div>
                                                                        </button>
                                                                    ))
                                                            ) : (
                                                                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                                                    {subtaskSearchQuery ? "No issues found." : "Type to search issues."}
                                                                </div>
                                                            )}
                                                            {searchedSubtasks.length > 0 && searchedSubtasks.filter(s => s.id !== issueId && s.id !== selectedIssue?.parentIssueId && !selectedIssue?.subTasks?.some(st => st.id === s.id)).length === 0 && (
                                                                <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                                                    No eligible issues found.
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                    {/* EPIC FIELD */}
                                    <div className="flex flex-col flex-1">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Epic</h3>
                                        {isEditingEpic && canEditIssueDetails ? (
                                            <div className="relative" ref={epicDropdownRef}>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        ref={epicInputRef}
                                                        type="text"
                                                        value={epicSearchQuery}
                                                        onChange={(e) => setEpicSearchQuery(e.target.value)}
                                                        onFocus={() => { if (!epicDropdownVisible) setEpicDropdownVisible(true); }}
                                                        placeholder="Search for an epic..."
                                                        className={commonInputClass + " flex-grow"}
                                                        disabled={updateIssueMutation.isPending}
                                                    />
                                                    <button
                                                        onClick={handleConfirmEpicChange}
                                                        disabled={updateIssueMutation.isPending || (!pendingEpic && epicSearchQuery === (selectedIssue?.epic?.title || ''))}
                                                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Save Epic"
                                                        type="button"
                                                    >
                                                        <MdCheck className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEpicEdit}
                                                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                        title="Cancel"
                                                        type="button"
                                                    >
                                                        <MdClose className="h-5 w-5" />
                                                    </button>
                                                </div>
                                                {epicDropdownVisible && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
                                                        {epicSearchQuery === '' && recentEpic && (
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 border-b border-gray-100 dark:border-gray-600"
                                                                onClick={() => handleSelectEpicFromDropdown(recentEpic)}
                                                            >
                                                                <MdHistory className="h-4 w-4 text-gray-400" />
                                                                <span>Recent: <span className="font-medium">{recentEpic.title}</span></span>
                                                            </button>
                                                        )}
                                                        {isLoadingSearchedEpics ? (
                                                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
                                                        ) : searchedEpics.length > 0 ? (
                                                            searchedEpics.map(e => (
                                                                <button
                                                                    key={e.id}
                                                                    type="button"
                                                                    className={`w-full text-left px-4 py-2 text-sm ${(pendingEpic?.id === e.id || selectedIssue?.epicId === e.id && !pendingEpic) ? 'font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                                                    onClick={() => handleSelectEpicFromDropdown(e)}
                                                                    disabled={updateIssueMutation.isPending}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="truncate">{e.title}</span>
                                                                        {(pendingEpic?.id === e.id || selectedIssue?.epicId === e.id && !pendingEpic) && <MdCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                                                {epicSearchQuery ? "No epics found." : "Type to search epics."}
                                                            </div>
                                                        )}
                                                        {selectedIssue?.epicId && !searchedEpics.length && epicSearchQuery.trim() === '' && (
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                                onClick={() => {
                                                                    setPendingEpic({ id: null, title: "None" });
                                                                    setEpicSearchQuery("");
                                                                    setEpicDropdownVisible(false);
                                                                }}
                                                            >
                                                                Unassign Epic
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                onClick={startEpicEdit}
                                                className={`text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[2.5em] p-2 rounded ${canEditIssueDetails ? 'cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-700/60' : 'cursor-default'} truncate`}
                                                title={canEditIssueDetails ? "Click to change Epic" : (selectedIssue?.epic?.title || "None")}
                                            >
                                                {selectedIssue?.epic?.title || <span className="italic text-gray-400 dark:text-gray-500">None</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* SPRINT FIELD */}
                                    <div className="flex flex-col flex-1">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Sprint</h3>
                                        {isEditingSprint && canEditIssueDetails ? (
                                            <div className="relative" ref={sprintDropdownRef}>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        ref={sprintInputRef}
                                                        type="text"
                                                        value={sprintSearchQuery}
                                                        onChange={(e) => setSprintSearchQuery(e.target.value)}
                                                        onFocus={() => { if (!sprintDropdownVisible) setSprintDropdownVisible(true); }}
                                                        placeholder="Search for a sprint..."
                                                        className={commonInputClass + " flex-grow"}
                                                        disabled={updateIssueMutation.isPending}
                                                    />
                                                    <button
                                                        onClick={handleConfirmSprintChange}
                                                        disabled={updateIssueMutation.isPending || (!pendingSprint && sprintSearchQuery === (selectedIssue?.sprint?.title || ''))}
                                                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Save Sprint"
                                                        type="button"
                                                    >
                                                        <MdCheck className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelSprintEdit}
                                                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                        title="Cancel"
                                                        type="button"
                                                    >
                                                        <MdClose className="h-5 w-5" />
                                                    </button>
                                                </div>
                                                {sprintDropdownVisible && (
                                                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-gray-600 ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
                                                        {sprintSearchQuery === '' && recentSprint && (
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 border-b border-gray-100 dark:border-gray-600"
                                                                onClick={() => handleSelectSprintFromDropdown(recentSprint)}
                                                            >
                                                                <MdHistory className="h-4 w-4 text-gray-400" />
                                                                <span>Recent: <span className="font-medium">{recentSprint.title}</span></span>
                                                            </button>
                                                        )}
                                                        {isLoadingSearchedSprints ? (
                                                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
                                                        ) : searchedSprints.length > 0 ? (
                                                            searchedSprints.map(s => (
                                                                <button
                                                                    key={s.id}
                                                                    type="button"
                                                                    className={`w-full text-left px-4 py-2 text-sm ${(pendingSprint?.id === s.id || selectedIssue?.sprintId === s.id && !pendingSprint) ? 'font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
                                                                    onClick={() => handleSelectSprintFromDropdown(s)}
                                                                    disabled={updateIssueMutation.isPending}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="truncate">{s.title}</span>
                                                                        {(pendingSprint?.id === s.id || selectedIssue?.sprintId === s.id && !pendingSprint) && <MdCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />}
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
                                                                {sprintSearchQuery ? "No sprints found." : "Type to search sprints."}
                                                            </div>
                                                        )}
                                                        {selectedIssue?.sprintId && !searchedSprints.length && sprintSearchQuery.trim() === '' && (
                                                            <button
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                                onClick={() => {
                                                                    setPendingSprint({ id: null, title: "None" });
                                                                    setSprintSearchQuery("");
                                                                    setSprintDropdownVisible(false);
                                                                }}
                                                            >
                                                                Remove from Sprint
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div
                                                onClick={startSprintEdit}
                                                className={`text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap min-h-[2.5em] p-2 rounded ${canEditIssueDetails ? 'cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-700/60' : 'cursor-default'} truncate`}
                                                title={canEditIssueDetails ? "Click to change Sprint" : (selectedIssue?.sprint?.title || "None")}
                                            >
                                                {selectedIssue?.sprint?.title || <span className="italic text-gray-400 dark:text-gray-500">None</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                    {/* Type Dropdown */}
                                    <div className="flex flex-col flex-1">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Type</h3>
                                        <div className="relative" ref={typeDropdownRef}>
                                            <button type="button"
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                                onClick={() => canEditIssueDetails && setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                                                aria-haspopup="listbox"
                                                aria-expanded={isTypeDropdownOpen}
                                                disabled={!canEditIssueDetails || updateIssueMutation.isPending || isLoadingInitialData}>
                                                <span className="flex items-center justify-between">
                                                    <span className="truncate text-gray-900 dark:text-gray-100">{selectedTypeName}</span>
                                                    <MdExpandMore className={`ml-2 h-5 w-5 text-gray-400 dark:text-gray-500 transform transition-transform duration-200 ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                                                </span>
                                            </button>
                                            {isTypeDropdownOpen && (
                                                <div className="absolute z-20 bottom-full mb-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
                                                    {issueTypes.map(type => (
                                                        <button key={type.value} type="button"
                                                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${editedType === type.value ? 'font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'} ${(!canEditIssueDetails || updateIssueMutation.isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            onClick={() => handleTypeSelect(type.value)}
                                                            disabled={!canEditIssueDetails || updateIssueMutation.isPending}>
                                                            <span className="truncate">{type.label}</span>
                                                            {editedType === type.value && <MdCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Priority Dropdown */}
                                    <div className="flex flex-col flex-1">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Priority</h3>
                                        <div className="relative" ref={priorityDropdownRef}>
                                            <button type="button"
                                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                                onClick={() => canEditIssueDetails && setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                                                aria-haspopup="listbox"
                                                aria-expanded={isPriorityDropdownOpen}
                                                disabled={!canEditIssueDetails || updateIssueMutation.isPending || isLoadingInitialData}>
                                                <span className="flex items-center justify-between">
                                                    <span className="truncate text-gray-900 dark:text-gray-100">{selectedPriorityName}</span>
                                                    <MdExpandMore className={`ml-2 h-5 w-5 text-gray-400 dark:text-gray-500 transform transition-transform duration-200 ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                                                </span>
                                            </button>
                                            {isPriorityDropdownOpen && (
                                                <div className="absolute z-20 bottom-full mb-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm custom-scrollbar">
                                                    {issuePriorities.map(priority => (
                                                        <button key={priority.value} type="button"
                                                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${editedPriority === priority.value ? 'font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'} ${(!canEditIssueDetails || updateIssueMutation.isPending) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            onClick={() => handlePrioritySelect(priority.value)}
                                                            disabled={!canEditIssueDetails || updateIssueMutation.isPending}>
                                                            <span className="truncate">{priority.label}</span>
                                                            {editedPriority === priority.value && <MdCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {renderEditableField("Related Code", "relatedCode", selectedIssue?.relatedCode, editedRelatedCode, setEditedRelatedCode, isEditingRelatedCode, setIsEditingRelatedCode, true, "Paste relevant code snippets here...", 8)}
                                {renderEditableField("Links", "links", selectedIssue?.links, editedLinks, setEditedLinks, isEditingLinks, setIsEditingLinks, true, "Enter links, one per line", 4)}
                                {renderEditableField("Instructions", "instructions", selectedIssue?.instructions, editedInstructions, setEditedInstructions, isEditingInstructions, setIsEditingInstructions, true, "Provide instructions for scheduled tasks...", 6)}

                                {/* --- Delete Issue Section --- */}
                                {canDeleteIssue && (
                                    <div className="gap-4 md:gap-6 ">
                                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Group Manager</h3>
                                        <div className='h-[36px] text-right'>
                                            <button
                                                onClick={handleDeleteIssue}
                                                disabled={deleteIssueMutation.isPending}
                                                className="inline-flex items-center px-2 py-1 h-[36px] border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                                            >
                                                Delete Issue
                                            </button>
                                            {deleteIssueMutation.isError && <div className="text-red-600 dark:text-red-400 text-sm mt-2 text-left">Error deleting issue: {deleteIssueMutation.error?.message}</div>}
                                        </div>
                                    </div>
                                )}

                                {updateIssueMutation.isError && <div className="text-red-600 dark:text-red-400 text-sm mt-2">Error updating issue: {updateIssueMutation.error?.message}</div>}
                            </div>

                            {/* Divider */}
                            <div ref={dividerRef} onMouseDown={handleMouseDownOnDivider} className="hidden md:flex flex-shrink-0 bg-gray-300 dark:bg-gray-700 hover:bg-indigo-500 dark:hover:bg-indigo-500 transition-colors duration-150 ease-in-out items-center justify-center group" style={{ width: `${DIVIDER_WIDTH_PX}px`, cursor: 'col-resize' }} role="separator" aria-orientation="vertical" aria-label="Resize panels" tabIndex={0} onKeyDown={(e) => { if (e.key === 'ArrowLeft') { setLeftPanelWidth(prev => Math.max(MIN_PANEL_WIDTH, prev - 1)); } else if (e.key === 'ArrowRight') { setLeftPanelWidth(prev => Math.min(MAX_PANEL_WIDTH, prev + 1)); } }}>
                                <div className="w-1 h-8 bg-gray-500 dark:bg-gray-500 rounded-full group-hover:bg-white dark:group-hover:bg-white"></div>
                            </div>

                            {/* Right Panel: Comments */}
                            <div
                                className={`${mobileView === 'comments' ? 'flex' : 'hidden'} md:flex flex-col flex-grow w-full md:w-auto p-2 pb-0 sm:p-4 sm:pb-0 lg:p-4 lg:pb-0
                                overflow-y-hidden custom-scrollbar border-t border-gray-300 dark:border-gray-600 md:border-t-0 
                                md:border-l md:border-gray-300 md:dark:border-gray-700`
                                }
                                style={{ flexBasis: isResizing || window.innerWidth >= 768 ? `calc(${100 - leftPanelWidth}% - ${DIVIDER_WIDTH_PX / 2}px)` : 'auto', overflowX: 'hidden' }}
                            >
                                {!isCommentInputEnlarged && (
                                    <>
                                        <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0 flex-shrink-0">Comments</h3>
                                        {commentsFetchError && <div className="text-red-600 dark:text-red-400 text-sm -mt-2 mb-2 flex-shrink-0">Error fetching comments: {commentsFetchError.message}</div>}
                                        {addCommentMutation.isError && <div className="text-red-600 dark:text-red-400 text-sm -mt-2 mb-2 flex-shrink-0">Error adding comment: {addCommentMutation.error?.message}</div>}

                                        <div className="relative flex-grow">
                                            <div
                                                ref={commentsContainerRef}
                                                className="absolute inset-0 space-y-0 divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto custom-scrollbar -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
                                            >
                                                {isLoadingComments ? (
                                                    <div className="text-center text-gray-600 dark:text-gray-300 py-10">Loading comments...</div>
                                                ) : displayComments.length > 0 ? (
                                                    displayComments.map(comment => (<CommentItem key={comment.id} comment={comment} issueId={selectedIssue?.id} />))
                                                ) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic py-10 text-center"> No comments yet. </p>
                                                )}
                                            </div>

                                            {/* Scroll to bottom button */}
                                            {showScrollToBottomButton && (
                                                <button
                                                    onClick={() => scrollToBottom('smooth')}
                                                    className="absolute bottom-4 right-4 z-10 p-2 rounded-full bg-indigo-600/80 text-white backdrop-blur-sm
                                                       hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                                                       dark:focus:ring-offset-gray-900 transition-opacity animate-fade-in"
                                                    aria-label="Scroll to latest comments"
                                                    title="Scroll to latest comments"
                                                >
                                                    <MdArrowDownward className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Comment Input Section */}
                                <div className={`mt-auto transition-all duration-300 ${isCommentInputEnlarged ? 'flex-grow flex flex-col h-full' : 'flex-shrink-0'} pb-2 focus:outline-none`}>
                                    <div className={`flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 transition-all duration-300 ${isCommentInputEnlarged ? 'flex-grow flex-col h-full' : 'items-start'}`}>
                                        <textarea
                                            ref={commentInputRef}
                                            value={newTopLevelCommentText}
                                            onChange={(e) => setNewTopLevelCommentText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAddTopLevelComment();
                                                }
                                            }}
                                            placeholder="Message..."
                                            className={`w-full flex-grow bg-transparent border-none focus:outline-none resize-none
                                            text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                                            text-sm sm:text-sm transition-all duration-200 ease-in-out`
                                            }
                                            style={{ overflowY: 'hidden' }}
                                            rows={1}
                                        />
                                        {/* The button container now handles vertical stacking. */}
                                        <div className={`flex self-end gap-2 ${showEnlargeButton || isCommentInputEnlarged ? 'flex-col' : 'flex-row items-center'}`}>
                                            <button
                                                onClick={handleAddTopLevelComment}
                                                disabled={!newTopLevelCommentText.trim() || addCommentMutation.isPending}
                                                className="flex-shrink-0 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 dark:disabled:text-gray-500"
                                                aria-label="Post Comment"
                                                title="Post Comment"
                                            >
                                                <MdSend className="h-5 w-5" />
                                            </button>
                                            {(showEnlargeButton || isCommentInputEnlarged) && (
                                                <button
                                                    onClick={() => setIsCommentInputEnlarged(!isCommentInputEnlarged)}
                                                    className="flex-shrink-0 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                                                    aria-label={isCommentInputEnlarged ? "Shrink comment input" : "Enlarge comment input"}
                                                    title={isCommentInputEnlarged ? "Shrink" : "Enlarge"}
                                                >
                                                    <MdAspectRatio className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IssueDetailModal;