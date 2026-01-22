// src/features/board/pages/BoardView.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Import React Query Hooks
import { useBoardData } from '../hooks/useBoardData';
import { useAddIssue } from '../hooks/useAddIssue';
import { useMoveIssue } from '../hooks/useMoveIssue';
import { useColumnMutations } from '../hooks/useColumnMutations';
import { useDeleteIssue } from '../hooks/useDeleteIssue';

// Import Components
import IssueDetailModal from '../components/IssueDetailModal';
import { useEpicSearch, useSprintSearch, useUpdateIssue, useUserSearch, useIssueSearch } from '../hooks';

// Import Services and Icons
import { socketService } from '../../../services';
import { FiLayers, FiList } from 'react-icons/fi';
import {
    MdAdd, MdRemove, MdArrowBack, MdArrowForward, MdDelete, MdCheckCircle,
    MdSettings, MdFilterList, MdSearch, MdContentPaste, MdSchedule,
    MdArrowUpward, MdArrowDownward, MdKeyboardDoubleArrowUp, MdKeyboardDoubleArrowDown,
    MdPersonOutline, MdBugReport, MdBookmark, MdClose, MdCheckBox, MdCheckBoxOutlineBlank, MdRestore, MdDriveFileMove, MdLink, MdPersonAdd
} from 'react-icons/md';
import BoardFilters from '../components/BoardFilters';
import ScheduleIssueModal from '../components/ScheduleIssueModal';
import BulkAddIssuesModal from '../components/BulkAddIssuesModal';
import BoardShareModal from '../components/BoardShareModal';
import boardService from '../services/boardService';
import BreadcrumbNav from '../../../components/layout/components/BreadcrumbNav';


// Helper function to map column name to status - REMOVED
// We now use column.status directly from the backend

const BoardView = () => {
    const { boardId } = useParams();

    // Local UI State
    const [selectedIssueId, setSelectedIssueId] = useState(null);
    const [addingIssueToColumn, setAddingIssueToColumn] = useState(null);
    const [newIssueTitle, setNewIssueTitle] = useState('');
    const [newIssueDescription, setNewIssueDescription] = useState('');
    const [newIssueType, setNewIssueType] = useState('TASK'); // Default type
    const [newIssuePriority, setNewIssuePriority] = useState('LOWEST'); // Default priority
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();
    const user = useSelector(state => state.auth.user);
    const activeCompanyId = user?.activeCompanyId || null;
    const isViewer = user?.companyRole === 'VIEWER';

    // Column Management State
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');
    const [newColumnCategory, setNewColumnCategory] = useState('TODO');
    const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);

    // Menu State
    const [activeMenu, setActiveMenu] = useState(null); // 'filters', 'functions', 'edit'
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const toggleMenu = (menu) => setActiveMenu(activeMenu === menu ? null : menu);
    const [filters, setFilters] = useState({
        assignees: [],
        priority: [],
        type: [],
        epics: [],
        sprints: [],
        dateRange: { start: '', end: '' }
    });

    // Resize State
    const [resizingColumnId, setResizingColumnId] = useState(null);
    const [resizeStartX, setResizeStartX] = useState(null);
    const [resizeStartWidth, setResizeStartWidth] = useState(null);
    const [optimisticWidths, setOptimisticWidths] = useState({});
    const [minimizedColumns, setMinimizedColumns] = useState({});

    const toggleColumnMinimize = (columnId) => {
        const currentColumn = columnsToRender.find(col => col.id === columnId);
        if (!currentColumn) return;

        const newMinimizedState = !currentColumn.isMinimized;

        // Optimistically update local state
        setMinimizedColumns(prev => ({
            ...prev,
            [columnId]: newMinimizedState
        }));

        // Persist to backend
        updateColumnMutation.mutate({
            columnId: columnId,
            updateData: { isMinimized: newMinimizedState }
        });
    };


    // --- REACT QUERY HOOKS  ---
    const {
        data: boardData,
        isLoading: isLoadingBoard,
        error: fetchBoardError,
        isError: isFetchBoardError,
    } = useBoardData(boardId);

    // Auto-Navigation: Check for context mismatch or error
    useEffect(() => {
        // Condition 1: Fetch Error (likely 403 Forbidden or 404 Not Found from backend context check)
        if (isFetchBoardError) {
            console.warn("BoardView: Fetch error detected (likely context mismatch). Redirecting...");
            navigate('/projects');
            return;
        }

        // Condition 2: Data Mismatch (Strict Client-side check)
        // Only run check if we actually have board data
        if (boardData?.board) {
            const boardCompanyId = boardData.board.companyId ?? null;
            // activeCompanyId is defined in component scope
            if (boardCompanyId !== activeCompanyId) {
                console.warn("BoardView: Context mismatch detected (Board Company !== Active Context). Redirecting...");
                navigate('/projects');
                return;
            }
        }

    }, [isFetchBoardError, navigate, boardData, activeCompanyId]);
    const board = boardData?.board;
    const addIssueMutation = useAddIssue();
    const moveIssueMutation = useMoveIssue(boardId);
    const { createColumnMutation, updateColumnMutation, deleteColumnMutation } = useColumnMutations(boardId);
    const deleteIssueMutation = useDeleteIssue(boardId); // Using the hook directly for bulk delete

    const isModalOpen = !!selectedIssueId;

    // --- Multi-Select State ---
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedIssueIds, setSelectedIssueIds] = useState(new Set()); // Using Set for efficient lookup
    const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false); // Deprecated in favor of activeBulkAction, will remove
    const [activeBulkAction, setActiveBulkAction] = useState(null); // 'move', 'assign', 'epic', 'sprint', 'parent'
    const [bulkSearchQuery, setBulkSearchQuery] = useState('');

    const updateIssueMutation = useUpdateIssue();
    const { data: searchedUsers } = useUserSearch(activeBulkAction === 'assign' ? bulkSearchQuery : '');
    const { data: searchedEpics } = useEpicSearch(board?.projectKey || board?.project?.key, activeBulkAction === 'epic' ? bulkSearchQuery : '');
    const { data: searchedSprints } = useSprintSearch(board?.projectKey || board?.project?.key, activeBulkAction === 'sprint' ? bulkSearchQuery : '');
    const { data: searchedParents } = useIssueSearch(activeBulkAction === 'parent' ? bulkSearchQuery : '', boardId);


    // const columnsFromBoardData = boardData?.columns || []; // REMOVE direct usage

    // --- LOCAL STATE PROXY FOR COLUMNS ---
    // We use local state to drive the UI for instant DnD feedback,
    // while keeping it synced with React Query's global state.
    const [localColumns, setLocalColumns] = useState([]);

    useEffect(() => {
        if (boardData?.columns) {
            setLocalColumns(boardData.columns);
        }
    }, [boardData]);

    const columnsToRender = localColumns; // Use local state for rendering

    // --- Filter Logic ---
    const availableAssignees = React.useMemo(() => {
        if (!columnsToRender) return [];
        const assigneesMap = new Map();
        columnsToRender.forEach(col => {
            if (col.issues) {
                col.issues.forEach(issue => {
                    if (issue.assignee) {
                        assigneesMap.set(issue.assignee.id, issue.assignee);
                    }
                });
            }
        });
        return Array.from(assigneesMap.values());
    }, [columnsToRender]);

    const availableEpics = React.useMemo(() => {
        if (!columnsToRender) return [];
        const epicsMap = new Map();
        columnsToRender.forEach(col => {
            if (col.issues) {
                col.issues.forEach(issue => {
                    if (issue.epic) {
                        epicsMap.set(issue.epic.id, issue.epic);
                    }
                });
            }
        });
        return Array.from(epicsMap.values());
    }, [columnsToRender]);

    const availableSprints = React.useMemo(() => {
        if (!columnsToRender) return [];
        const sprintsMap = new Map();
        columnsToRender.forEach(col => {
            if (col.issues) {
                col.issues.forEach(issue => {
                    if (issue.sprint) {
                        sprintsMap.set(issue.sprint.id, issue.sprint);
                    }
                });
            }
        });
        return Array.from(sprintsMap.values());
    }, [columnsToRender]);

    const filteredColumns = React.useMemo(() => {
        const hasFilters = filters.assignees.length > 0 ||
            filters.priority.length > 0 ||
            filters.type.length > 0 ||
            filters.epics.length > 0 ||
            filters.sprints.length > 0 ||
            filters.dateRange.start ||
            filters.dateRange.end;

        if (!hasFilters) return columnsToRender;

        return columnsToRender.map(column => ({
            ...column,
            issues: (column.issues || []).filter(issue => {
                // Assignee
                if (filters.assignees.length > 0) {
                    const assigneeId = issue.assignee ? issue.assignee.id : 'unassigned';
                    if (!filters.assignees.includes(assigneeId)) return false;
                }
                // Priority
                if (filters.priority.length > 0 && !filters.priority.includes(issue.priority)) return false;
                // Type
                if (filters.type.length > 0 && !filters.type.includes(issue.type)) return false;
                // Epics
                if (filters.epics.length > 0) {
                    const epicId = issue.epic ? issue.epic.id : 'no-epic';
                    if (!filters.epics.includes(epicId)) return false;
                }
                // Sprints
                if (filters.sprints.length > 0) {
                    const sprintId = issue.sprint ? issue.sprint.id : 'no-sprint';
                    if (!filters.sprints.includes(sprintId)) return false;
                }
                // Date
                if (filters.dateRange.start) {
                    // Check if createdAt exists, safe fallback
                    if (!issue.createdAt) return true;
                    const startDate = new Date(filters.dateRange.start);
                    const issueDate = new Date(issue.createdAt);
                    if (issueDate < startDate) return false;
                }
                if (filters.dateRange.end) {
                    if (!issue.createdAt) return true;
                    const endDate = new Date(filters.dateRange.end);
                    endDate.setHours(23, 59, 59, 999);
                    const issueDate = new Date(issue.createdAt);
                    if (issueDate > endDate) return false;
                }
                return true;
            })
        }));
    }, [columnsToRender, filters]);

    const activeFilterCount = React.useMemo(() => {
        let count = filters.assignees.length + filters.priority.length + filters.type.length + filters.epics.length + filters.sprints.length;
        if (filters.dateRange.start) count++;
        if (filters.dateRange.end) count++;
        return count;
    }, [filters]);

    const handleClearFilters = () => {
        setFilters({
            assignees: [],
            priority: [],
            type: [],
            epics: [],
            sprints: [],
            dateRange: { start: '', end: '' }
        });
    };

    // Effect for initial component visibility
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // WebSocket Effect for joining/leaving room
    useEffect(() => {
        let joinedBoardId = null;
        if (boardId) {
            console.log(`BoardView: Joining WebSocket room for board ID: ${boardId}`);
            socketService.joinBoardRoom(boardId);
            joinedBoardId = boardId;
        }
        return () => {
            if (joinedBoardId) {
                console.log(`BoardView: Leaving WebSocket room for board ID: ${joinedBoardId}`);
                socketService.leaveBoardRoom(joinedBoardId);
            }
        };
    }, [boardId]);

    // --- Event Handlers ---
    const onDragEnd = (result) => {
        if (isViewer) return;
        const { source, destination, draggableId } = result;

        // 1. Dropped outside or same place? Do nothing.
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return;
        }

        // 2. APPLY OPTIMISTIC UPDATE TO LOCAL STATE
        const newColumns = JSON.parse(JSON.stringify(localColumns)); // Deep clone
        const sourceCol = newColumns.find(col => col.id.toString() === source.droppableId.toString());
        const destCol = newColumns.find(col => col.id.toString() === destination.droppableId.toString());

        if (sourceCol && destCol) {
            const [movedIssue] = sourceCol.issues.splice(source.index, 1);
            // Update status locally if column changed category (optional but good for consistency)
            // in reality backend handles status, but for UI feedback:
            if (sourceCol.id !== destCol.id) {
                // optionally update status if we had map function exposed
                movedIssue.columnId = destCol.id.toString();
            }
            destCol.issues.splice(destination.index, 0, movedIssue);
            setLocalColumns(newColumns); // INSTANT RENDER
        }

        // 3. Trigger Mutation (Updates Global Cache / Backup)
        moveIssueMutation.mutate({
            issueId: draggableId,
            sourceColumnId: source.droppableId,
            destinationColumnId: destination.droppableId,
            newPosition: destination.index,
            boardId
        });
    };

    const handleAddIssueClick = (columnId) => {
        setAddingIssueToColumn(columnId);
        setNewIssueTitle('');
        setNewIssueDescription('');
        setNewIssueType('TASK');
        setNewIssuePriority('LOWEST');
    };

    const handleCancelAddIssue = () => {
        setAddingIssueToColumn(null);
        setNewIssueTitle('');
        setNewIssueDescription('');
    };

    // --- Resize Handlers ---
    const handleResizeStart = (e, columnId, currentWidth) => {
        e.preventDefault();
        setResizingColumnId(columnId);
        setResizeStartX(e.clientX);
        setResizeStartWidth(currentWidth || 300);
    };

    const handleResizeMove = useCallback((e) => {
        if (!resizingColumnId) return;
        const diff = e.clientX - resizeStartX;
        const newWidth = Math.max(200, resizeStartWidth + diff); // Min width 200
        setOptimisticWidths(prev => ({ ...prev, [resizingColumnId]: newWidth }));
    }, [resizingColumnId, resizeStartX, resizeStartWidth]);

    const handleResizeEnd = useCallback(() => {
        if (!resizingColumnId) return;
        const finalWidth = optimisticWidths[resizingColumnId];
        if (finalWidth && finalWidth !== resizeStartWidth) {
            updateColumnMutation.mutate({
                columnId: resizingColumnId,
                updateData: { width: finalWidth }
            });
        }
        setResizingColumnId(null);
        setResizeStartX(null);
        setResizeStartWidth(null);
    }, [resizingColumnId, optimisticWidths, resizeStartWidth, updateColumnMutation]);

    useEffect(() => {
        if (resizingColumnId) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [resizingColumnId, handleResizeMove, handleResizeEnd]);

    const handleResetWidths = () => {
        if (window.confirm('Reset all columns to default width?')) {
            columnsToRender.forEach(column => {
                if (column.width !== 300) {
                    updateColumnMutation.mutate({
                        columnId: column.id,
                        updateData: { width: 300 }
                    });
                }
            });
            setOptimisticWidths({});
        }
    };

    // --- Multi-Select Handlers ---

    const toggleMultiSelectMode = () => {
        const willBeOn = !isMultiSelectMode;
        setIsMultiSelectMode(willBeOn);
        if (!willBeOn) {
            setSelectedIssueIds(new Set()); // Clear selection when turning off
            setIsMoveMenuOpen(false);
            setActiveBulkAction(null);
            setBulkSearchQuery('');
        }
    };

    const toggleIssueSelection = (issueId) => {
        setSelectedIssueIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(issueId)) {
                newSet.delete(issueId);
            } else {
                newSet.add(issueId);
            }
            return newSet;
        });
    };

    const handleBulkDelete = async () => {
        const issuesToDelete = Array.from(selectedIssueIds);
        if (issuesToDelete.length === 0) return;

        if (window.confirm(`Are you sure you want to delete ${issuesToDelete.length} selected issue(s)? This cannot be undone.`)) {
            // Optimistic/Parallel delete - simpler but effective for now
            // In a production app, we'd want a bulk delete endpoint
            for (const id of issuesToDelete) {
                try {
                    await deleteIssueMutation.mutateAsync(id);
                } catch (e) {
                    console.error(`Failed to delete issue ${id}`, e);
                }
            }
            setSelectedIssueIds(new Set());
        }
    };

    const handleBulkMove = async (targetColumnId) => {
        if (!targetColumnId) return;

        const issuesToMove = [];
        columnsToRender.forEach(col => {
            if (col.issues) {
                col.issues.forEach(issue => {
                    if (selectedIssueIds.has(issue.id)) {
                        issuesToMove.push({ issue, sourceColumnId: col.id });
                    }
                });
            }
        });

        const targetColumn = columnsToRender.find(c => c.id === targetColumnId);
        if (!targetColumn) return;

        let nextPosition = targetColumn.issues ? targetColumn.issues.length : 0;

        const confirmMessage = `Move ${issuesToMove.length} issue(s) to column "${targetColumn.name}"?`;
        if (window.confirm(confirmMessage)) {
            for (const item of issuesToMove) {
                // Skip if already in target column
                if (item.sourceColumnId.toString() === targetColumnId.toString()) continue;

                try {
                    await moveIssueMutation.mutateAsync({
                        issueId: item.issue.id,
                        sourceColumnId: item.sourceColumnId,
                        destinationColumnId: targetColumnId,
                        newPosition: nextPosition,
                        boardId
                    });
                    nextPosition++;
                } catch (error) {
                    console.error("Bulk move error", error);
                }
            }
            setIsMoveMenuOpen(false);
            setSelectedIssueIds(new Set());
        }
    };

    const handleBulkUpdate = async (field, value, confirmMessageSuffix) => {
        const issuesToUpdate = Array.from(selectedIssueIds);
        if (issuesToUpdate.length === 0) return;

        const confirmMessage = `Update ${issuesToUpdate.length} issue(s) ${confirmMessageSuffix}?`;
        if (window.confirm(confirmMessage)) {
            const promises = issuesToUpdate.map(issueId =>
                updateIssueMutation.mutateAsync({
                    issueId,
                    updatedDetails: { [field]: value },
                    boardId
                }).catch(err => console.error(`Failed to update issue ${issueId}`, err))
            );

            await Promise.all(promises);

            setActiveBulkAction(null);
            setBulkSearchQuery('');
            setSelectedIssueIds(new Set());
        }
    };

    const handleSaveNewIssue = (columnId) => {
        const trimmedTitle = newIssueTitle.trim();
        const trimmedDescription = newIssueDescription.trim();

        if (!trimmedTitle) {
            console.log("BoardView: Title is empty, cancelling save.");
            return;
        }
        const userName = user?.displayName || user?.name || user?.username || user?.email || "Unknown";

        if (!user || !user.id) {
            console.error("BoardView: Cannot add issue. User not authenticated or user ID is missing.");
            return;
        }
        if (!board || !board.projectId || !columnsToRender || columnsToRender.length === 0) {
            console.error("BoardView: Cannot add issue. Board/Project ID or columns not available from useBoardData.");
            return;
        }

        const targetColumn = columnsToRender.find(col => col.id.toString() === columnId.toString());

        if (!targetColumn) {
            console.error(`BoardView: Target column with ID ${columnId} not found. Cannot determine status.`);
            return;
        }

        const issueCategory = targetColumn.category || 'TODO';

        const issuePayload = {
            boardId,
            projectId: board.projectId,
            columnId,
            title: trimmedTitle,
            description: trimmedDescription,
            reporterId: user.id,
            reporterName: userName,
            assigneeUserId: user.id, // Set initial assignee to the current user (reporter)
            status: issueCategory,
            category: issueCategory,
            type: newIssueType,
            priority: newIssuePriority,
        };

        addIssueMutation.mutate(issuePayload, {
            onSuccess: () => {
                setAddingIssueToColumn(null);
                setNewIssueTitle('');
                setNewIssueDescription('');
            },
            onError: (error) => {
                console.error("BoardView: addIssueMutation failed (from component). Reason:", error);
            }
        });
    };

    const handleIssueClick = (issueId) => {
        if (isMultiSelectMode) {
            toggleIssueSelection(issueId);
        } else {
            console.log(`BoardView: Clicked issue ID: ${issueId}. Setting local state.`);
            setSelectedIssueId(issueId);
        }
    };

    const handleCloseModal = useCallback(() => {
        console.log(`BoardView: Closing modal. Clearing local state.`);
        setSelectedIssueId(null);
    }, []);

    const handleMoveColumn = (columnId, direction) => {
        const currentIndex = columnsToRender.findIndex(c => c.id === columnId);
        if (currentIndex === -1) return;

        const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;

        // Check bounds
        if (targetIndex < 0 || targetIndex >= columnsToRender.length) return;

        const targetColumn = columnsToRender[targetIndex];
        const currentColumn = columnsToRender[currentIndex];

        // Swap positions
        updateColumnMutation.mutate({
            columnId: currentColumn.id,
            updateData: { position: targetColumn.position }
        });

        updateColumnMutation.mutate({
            columnId: targetColumn.id,
            updateData: { position: currentColumn.position }
        });

        setOpenMenuColumnId(null);
    };

    // --- Render Helper Functions ---
    const renderPriorityIcon = (priority) => {
        const iconContainerClasses = "w-6 h-6 rounded-full flex items-center justify-center ring-1 ring-white dark:ring-gray-800";

        switch (priority) {
            case 'HIGHEST':
                return (
                    <div title="Highest Priority" className={`${iconContainerClasses} bg-red-100 dark:bg-red-500/20`}>
                        <MdKeyboardDoubleArrowUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                );
            case 'HIGH':
                return (
                    <div title="High Priority" className={`${iconContainerClasses} bg-orange-100 dark:bg-orange-500/20`}>
                        <MdArrowUpward className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                    </div>
                );
            case 'MEDIUM':
                return (
                    <div title="Medium Priority" className={`${iconContainerClasses} bg-yellow-100 dark:bg-yellow-500/20`}>
                        <MdRemove className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                    </div>
                );
            case 'LOW':
                return (
                    <div title="Low Priority" className={`${iconContainerClasses} bg-blue-100 dark:bg-blue-500/20`}>
                        <MdArrowDownward className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                );
            case 'LOWEST':
                return (
                    <div title="Lowest Priority" className={`${iconContainerClasses} bg-green-100 dark:bg-green-500/20`}>
                        <MdKeyboardDoubleArrowDown className="h-5 w-5 text-green-500 dark:text-green-400" />
                    </div>
                );
            default:
                return <div className="w-6 h-6" />;
        }
    };

    const renderTypeIcon = (type) => {
        const iconContainerClasses = "w-6 h-6 rounded-full flex items-center justify-center ring-1 ring-white dark:ring-gray-800";

        switch (type) {
            case 'BUG':
                return (
                    <div title="Bug" className={`${iconContainerClasses} bg-red-100 dark:bg-red-500/20`}>
                        <MdBugReport className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                );
            case 'STORY':
                return (
                    <div title="Story" className={`${iconContainerClasses} bg-green-100 dark:bg-green-500/20`}>
                        <MdBookmark className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                );
            case 'TASK':
            default:
                return (
                    <div title="Task" className={`${iconContainerClasses} bg-blue-100 dark:bg-blue-500/20`}>
                        <MdCheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                );
        }
    };

    const renderAssigneeIcon = (assignee) => {
        if (assignee) {
            return (
                <img
                    src={assignee.avatarUrl || `https://ui-avatars.com/api/?name=${assignee.name.split(' ').join('+')}&background=random&color=fff&size=32`}
                    alt={assignee.name}
                    title={`Assigned to ${assignee.name}`}
                    className="w-6 h-6 rounded-full ring-1 ring-white dark:ring-gray-800"
                />
            );
        }
        return (
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center ring-1 ring-white dark:ring-gray-800" title="Unassigned">
                <MdPersonOutline className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
        );
    };

    const renderLoading = () => (<div className="flex-grow flex justify-center items-center p-8"><p className="text-lg font-medium text-gray-600 dark:text-gray-400 animate-pulse">Loading board...</p></div>);
    const renderError = (errorObj) => (<div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20 mx-auto my-4 max-w-2xl"><div className="flex"><div className="ml-3"><h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3><div className="mt-2 text-sm text-red-700 dark:text-red-200"><p>{errorObj?.message || 'An unexpected error occurred while fetching board data.'}</p></div></div></div></div>);
    const renderNotFound = () => (<div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20 mx-auto max-w-2xl"><div className="flex"><div className="ml-3"><h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Board Not Found</h3><div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200"><p>No board data found for ID ({boardId}).</p></div></div></div></div>);

    // --- Main Render ---
    return (
        <div className={`relative h-full ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
            <div className="flex flex-col h-full">
                <BreadcrumbNav />

                <div
                    className={`
                        px-6 py-3 flex-shrink-0 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700
                        transition-all duration-300
                        ${activeMenu ? 'rounded-t-2xl rounded-b-none border-b-gray-200 dark:border-b-gray-700 relative z-20' : 'rounded-2xl mb-4'}
                    `}
                >
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {board?.name || 'Board Loading...'}
                    </h1>

                    <div className="flex items-center gap-3">
                        {/* Share Button */}
                        <button
                            onClick={() => setIsShareModalOpen(true)}
                            className="px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-sm active:scale-95"
                        >
                            <MdPersonAdd className="w-4 h-4" />
                            Share
                        </button>

                        {/* Filters Dropdown Trigger */}
                        <button
                            onClick={() => toggleMenu('filters')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5
                                ${activeMenu === 'filters' || activeFilterCount > 0
                                    ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20'
                                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            <MdFilterList className="w-4 h-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-0.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 rounded-full">
                                    {activeFilterCount}
                                </span>
                            )}
                            <MdKeyboardDoubleArrowDown className={`w-3 h-3 transition-transform ${activeMenu === 'filters' ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Functions Dropdown Trigger */}
                        {!isViewer && (
                            <button
                                onClick={() => toggleMenu('functions')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5
                                    ${activeMenu === 'functions'
                                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20'
                                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <MdSettings className="w-4 h-4" />
                                Functions
                                <MdKeyboardDoubleArrowDown className={`w-3 h-3 transition-transform ${activeMenu === 'functions' ? 'rotate-180' : ''}`} />
                            </button>
                        )}

                        {/* Edit Board Dropdown Trigger */}
                        {!isViewer && (
                            <button
                                onClick={() => toggleMenu('edit')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5
                                    ${activeMenu === 'edit'
                                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/20'
                                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <MdCheckCircle className="w-4 h-4" />
                                Edit Board
                                <MdKeyboardDoubleArrowDown className={`w-3 h-3 transition-transform ${activeMenu === 'edit' ? 'rotate-180' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Unified Dropdown Panel Container */}
                <div
                    className={`
                        flex-shrink-0
                        bg-white dark:bg-gray-800
                        border-x border-b border-gray-200 dark:border-gray-700
                        shadow-sm
                        transition-[max-height,opacity,margin] duration-300 ease-in-out
                        rounded-b-2xl rounded-t-none
                        relative z-10
                        ${activeMenu ? 'max-h-[1000px] opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0 border-none overflow-hidden'}
                    `}
                >
                    {activeMenu === 'filters' && (
                        <BoardFilters
                            filters={filters}
                            setFilters={setFilters}
                            assignees={availableAssignees}
                            onClear={handleClearFilters}
                            projectKey={board?.projectKey || board?.project?.key}
                            isOpen={true} // Kept for prop compatibility though logic is handled by parent now
                        />
                    )}

                    {activeMenu === 'functions' && (
                        <div className="px-6 py-4 grid grid-cols-2 lg:grid-cols-8 gap-4">
                            <button
                                onClick={() => setIsBulkAddModalOpen(true)}
                                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-all w-full"
                            >
                                <MdContentPaste className="w-5 h-5 text-indigo-500" />
                                <span>Bulk Upload</span>
                            </button>

                            <button
                                onClick={toggleMultiSelectMode}
                                className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all border w-full
                                    ${isMultiSelectMode
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {isMultiSelectMode ? <MdCheckBox className="w-5 h-5 text-indigo-600" /> : <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-500" />}
                                <span>Multi-Select {isMultiSelectMode ? '(On)' : ''}</span>
                            </button>

                            <button
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-all w-full"
                            >
                                <MdSchedule className="w-5 h-5 text-green-500" />
                                <span>Scheduler</span>
                            </button>
                        </div>
                    )}

                    {activeMenu === 'edit' && (
                        <div className="px-6 py-4 grid grid-cols-2 lg:grid-cols-8 gap-4">
                            <button
                                onClick={() => setIsAddingColumn(true)}
                                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-all w-full"
                            >
                                <MdAdd className="w-5 h-5 text-indigo-500" />
                                <span>Add Column</span>
                            </button>

                            <button
                                onClick={handleResetWidths}
                                className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-all w-full"
                            >
                                <MdRestore className="w-5 h-5 text-orange-500" />
                                <span>Reset Widths</span>
                            </button>

                            <button
                                onClick={() => setIsGlobalEditMode(!isGlobalEditMode)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all border w-full
                                    ${isGlobalEditMode
                                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {isGlobalEditMode ? <MdCheckCircle className="w-5 h-5" /> : <MdSettings className="w-5 h-5" />}
                                <span>Edit Mode {isGlobalEditMode ? '(On)' : ''}</span>
                            </button>
                        </div>
                    )}
                </div>

                <ScheduleIssueModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    boardId={boardId}
                    columns={columnsToRender}
                    projectKey={board?.projectKey || board?.project?.key}
                />

                <BulkAddIssuesModal
                    isOpen={isBulkAddModalOpen}
                    onClose={() => setIsBulkAddModalOpen(false)}
                    boardId={boardId}
                    firstColumn={columnsToRender.length > 0 ? { ...columnsToRender[0], projectId: board?.projectId } : null}
                />

                {isLoadingBoard ? (
                    <div className="flex-grow flex items-center justify-center animate-pulse text-gray-500">Loading...</div>
                ) : (
                    <>
                        {/* DragDropContext - Disabled in Multi-Select Mode effectively by conditional draggable */}
                        <DragDropContext onDragEnd={isMultiSelectMode ? () => { } : onDragEnd}>
                            <div className="flex flex-grow overflow-x-auto overflow-y-hidden pb-4 pl-1 custom-scrollbar space-x-4">
                                {filteredColumns.map((column, index) => {
                                    // Use backend value as source of truth, with local optimistic state as override
                                    const isMinimized = minimizedColumns[column.id] !== undefined
                                        ? minimizedColumns[column.id]
                                        : (column.isMinimized || false);
                                    const currentWidth = isMinimized ? 60 : (optimisticWidths[column.id] || column.width || 300);
                                    return (
                                        <div
                                            key={column.id}
                                            className="flex-shrink-0 flex flex-col h-full max-h-full relative transition-all duration-75 ease-out"
                                            style={{ width: `${currentWidth}px` }}
                                        >
                                            {isMinimized ? (
                                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg flex flex-col h-full max-h-[calc(100vh-150px)] border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                    <Droppable droppableId={column.id.toString()} type="ISSUE">
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className={`flex-grow w-full flex flex-col items-center py-2 gap-4 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                                                    }`}
                                                            >
                                                                <button
                                                                    onClick={() => !isViewer && toggleColumnMinimize(column.id)}
                                                                    disabled={isViewer}
                                                                    className={`p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400 transition-colors mt-2 ${isViewer ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    title={isViewer ? "Viewers cannot expand columns" : "Expand Column"}
                                                                >
                                                                    <MdAdd className="w-6 h-6" />
                                                                </button>
                                                                <div className="h-full w-full flex justify-center pb-4 overflow-hidden">
                                                                    <div className="text-gray-500 dark:text-gray-400 font-bold tracking-wider text-sm whitespace-nowrap" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                                                                        {column.name}
                                                                    </div>
                                                                </div>
                                                                <div className="w-0 h-0 overflow-hidden">
                                                                    {provided.placeholder}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg flex flex-col h-full max-h-[calc(100vh-150px)] relative">
                                                    {/* Header */}
                                                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg group/header min-h-[50px] flex items-center flex-shrink-0">
                                                        {isGlobalEditMode ? (
                                                            <div className="flex flex-col gap-2 w-full">
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => handleMoveColumn(column.id, 'left')}
                                                                        disabled={index === 0}
                                                                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${index === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}`}
                                                                        title="Move Left"
                                                                    >
                                                                        <MdArrowBack className="w-4 h-4" />
                                                                    </button>
                                                                    <input
                                                                        type="text"
                                                                        className="flex-grow p-1 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                                                                        defaultValue={column.name}
                                                                        onBlur={(e) => {
                                                                            if (e.target.value.trim() && e.target.value !== column.name) {
                                                                                updateColumnMutation.mutate({
                                                                                    columnId: column.id,
                                                                                    updateData: { name: e.target.value }
                                                                                });
                                                                            }
                                                                        }}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleMoveColumn(column.id, 'right')}
                                                                        disabled={index === columnsToRender.length - 1}
                                                                        className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${index === columnsToRender.length - 1 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'}`}
                                                                        title="Move Right"
                                                                    >
                                                                        <MdArrowForward className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <select
                                                                        className="flex-grow p-1 text-xs border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-gray-100"
                                                                        value={column.category}
                                                                        onChange={(e) => {
                                                                            updateColumnMutation.mutate({
                                                                                columnId: column.id,
                                                                                updateData: { category: e.target.value }
                                                                            });
                                                                        }}
                                                                    >
                                                                        <option value="TODO">To Do</option>
                                                                        <option value="IN_PROGRESS">In Prog</option>
                                                                        <option value="IN_REVIEW">Review</option>
                                                                        <option value="DONE">Done</option>
                                                                        <option value="BACKLOG">Backlog</option>
                                                                    </select>
                                                                    <button
                                                                        onClick={() => toggleColumnMinimize(column.id)}
                                                                        className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                                                        title="Minimize Column"
                                                                    >
                                                                        <MdRemove className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (column.issues && column.issues.length > 0) {
                                                                                alert('Cannot delete column. Please move or delete all remaining issues before deletion.');
                                                                                return;
                                                                            }
                                                                            if (window.confirm('Delete this column?')) {
                                                                                deleteColumnMutation.mutate(column.id);
                                                                            }
                                                                        }}
                                                                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                        title="Delete Column"
                                                                    >
                                                                        <MdDelete className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between w-full">
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">
                                                                        {column.name}
                                                                    </h3>
                                                                    <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                                                                        {column.issues?.length || 0}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Resize Handle */}
                                                    {isGlobalEditMode && (
                                                        <div
                                                            className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-indigo-500/20 z-10 flex items-center justify-center group/resize"
                                                            style={{ right: '-8px' }}
                                                            onMouseDown={(e) => handleResizeStart(e, column.id, currentWidth)}
                                                        >
                                                            <div className="w-1 h-8 bg-gray-300 dark:bg-gray-600 rounded-full group-hover/resize:bg-indigo-500 transition-colors" />
                                                        </div>
                                                    )}

                                                    {/* Droppable Area */}
                                                    <Droppable droppableId={column.id.toString()} type="ISSUE">
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className={`flex-grow overflow-y-auto p-2 custom-scrollbar min-h-[100px] transition-colors duration-200
                                                    ${snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                                                `}
                                                            >
                                                                {column.issues?.map((issue, index) => {
                                                                    // Determine if this is our "Optimistic" held issue
                                                                    const isOptimistic = issue.isOptimistic === true;

                                                                    return (
                                                                        <Draggable
                                                                            key={issue.id.toString()}
                                                                            draggableId={issue.id.toString()}
                                                                            index={index}
                                                                            isDragDisabled={isMultiSelectMode || isViewer}
                                                                        >
                                                                            {(providedDrag, snapshotDrag) => {
                                                                                const style = {
                                                                                    ...providedDrag.draggableProps.style,
                                                                                };

                                                                                if (snapshotDrag.isDropAnimating && style.transition) {
                                                                                    style.transition = 'all 0.15s cubic-bezier(0.2, 0, 0, 1)';
                                                                                }

                                                                                return (
                                                                                    <div
                                                                                        ref={providedDrag.innerRef}
                                                                                        {...providedDrag.draggableProps}
                                                                                        {...providedDrag.dragHandleProps}
                                                                                        style={style}
                                                                                        className={`relative group mb-3 ${snapshotDrag.isDragging ? 'z-50' : ''}`}
                                                                                    >
                                                                                        <div
                                                                                            onClick={() => !isOptimistic && handleIssueClick(issue.id)}
                                                                                            className={`
                                                                                                p-3 rounded-md shadow-sm border 
                                                                                                bg-white dark:bg-gray-700
                                                                                                hover:shadow-md transition-all duration-200
                                                                                                ${snapshotDrag.isDragging ? 'ring-2 ring-indigo-500 shadow-xl rotate-2' : 'border-gray-200 dark:border-gray-600'}
                                                                                                ${isMultiSelectMode && selectedIssueIds.has(issue.id) ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md' : ''}
                                                                                                ${isMultiSelectMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
                                                                                                group-hover:-translate-y-0.5
                                                                                            `}
                                                                                        >
                                                                                            <div className="flex flex-col gap-2">
                                                                                                <div className="flex justify-between items-start">
                                                                                                    <p className="text-sm text-gray-800 dark:text-gray-100 font-medium line-clamp-2 leading-snug w-full">
                                                                                                        {issue.title}
                                                                                                    </p>
                                                                                                </div>

                                                                                                <div className="flex items-center justify-between mt-1">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        {renderTypeIcon(issue.type)}
                                                                                                        {renderPriorityIcon(issue.priority)}
                                                                                                        <span className="text-xs text-gray-400">
                                                                                                            ID-{issue.id.toString().substring(0, 4)}
                                                                                                        </span>
                                                                                                        {issue.parentIssue && (
                                                                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 rounded text-[10px] font-medium text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800" title={`Parent: ${issue.parentIssue.title}`}>
                                                                                                                <MdArrowUpward className="w-3 h-3" />
                                                                                                                <span className="max-w-[60px] truncate">Parent</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {issue.subTasks && issue.subTasks.length > 0 && (
                                                                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 rounded text-[10px] font-medium text-gray-600 dark:text-gray-300" title={`${issue.subTasks.length} Subtasks`}>
                                                                                                                <span className="text-xs">↳</span>
                                                                                                                <span>{issue.subTasks.length}</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    {renderAssigneeIcon(issue.assignee)}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }}
                                                                        </Draggable>
                                                                    )
                                                                })}
                                                                {provided.placeholder}

                                                                {/* Column "Empty" state (only if strictly empty) */}
                                                                {!snapshot.isDraggingOver && (!column.issues || column.issues.length === 0) && (
                                                                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                                                        <span className="text-xs text-gray-400">Empty</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Droppable>

                                                    {/* Footer for "Add Issue" - Simplified */}
                                                    {!isViewer && (
                                                        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg flex-shrink-0">
                                                            {addingIssueToColumn === column.id ? (
                                                                <div className="flex flex-col gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700">
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        placeholder="Issue Title"
                                                                        className="w-full p-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                                                        value={newIssueTitle}
                                                                        onChange={(e) => setNewIssueTitle(e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                e.preventDefault();
                                                                                // Optional: focus description?
                                                                            }
                                                                            if (e.key === 'Escape') {
                                                                                handleCancelAddIssue();
                                                                            }
                                                                        }}
                                                                    />
                                                                    <textarea
                                                                        placeholder="Description"
                                                                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 resize-none"
                                                                        rows={3}
                                                                        value={newIssueDescription}
                                                                        onChange={(e) => setNewIssueDescription(e.target.value)}
                                                                    />

                                                                    <div className="flex gap-2">
                                                                        <select
                                                                            value={newIssueType}
                                                                            onChange={(e) => setNewIssueType(e.target.value)}
                                                                            className="flex-1 p-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                                                                        >
                                                                            <option value="TASK">Task</option>
                                                                            <option value="BUG">Bug</option>
                                                                            <option value="STORY">Story</option>
                                                                        </select>
                                                                        <select
                                                                            value={newIssuePriority}
                                                                            onChange={(e) => setNewIssuePriority(e.target.value)}
                                                                            className="flex-1 p-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                                                                        >
                                                                            <option value="LOWEST">Lowest</option>
                                                                            <option value="LOW">Low</option>
                                                                            <option value="MEDIUM">Medium</option>
                                                                            <option value="HIGH">High</option>
                                                                            <option value="HIGHEST">Highest</option>
                                                                        </select>
                                                                    </div>

                                                                    <div className="flex justify-end gap-2 mt-1">
                                                                        <button
                                                                            onClick={handleCancelAddIssue}
                                                                            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSaveNewIssue(column.id)}
                                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
                                                                        >
                                                                            Add Issue
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleAddIssueClick(column.id)}
                                                                    className="w-full py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-center gap-1"
                                                                >
                                                                    <span>+</span> Create Issue
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                { /* Add Column Form */}

                                {isAddingColumn && (
                                    <div className="flex-shrink-0 w-72 sm:w-80 flex flex-col h-full max-h-full">
                                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col gap-3">
                                            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200">New Column</h3>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Column Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g., QA, Review"
                                                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                                                    value={newColumnName}
                                                    onChange={(e) => setNewColumnName(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status Category</label>
                                                <select
                                                    className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                                                    value={newColumnCategory}
                                                    onChange={(e) => setNewColumnCategory(e.target.value)}
                                                >
                                                    <option value="TODO">To Do</option>
                                                    <option value="IN_PROGRESS">In Progress</option>
                                                    <option value="IN_REVIEW">Review</option>
                                                    <option value="DONE">Done</option>
                                                    <option value="BACKLOG">Backlog</option>
                                                </select>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Determines how issues in this column are treated (e.g., considered "Done").
                                                </p>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setIsAddingColumn(false);
                                                        setNewColumnName('');
                                                        setNewColumnCategory('TODO');
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (newColumnName.trim()) {
                                                            createColumnMutation.mutate({ name: newColumnName, category: newColumnCategory });
                                                            setIsAddingColumn(false);
                                                            setNewColumnName('');
                                                            setNewColumnCategory('TODO');
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                )}
                            </div>
                        </DragDropContext>
                    </>
                )
                }
            </div >

            {/* Modals would go here */}
            {
                isModalOpen && (
                    <IssueDetailModal
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        issueId={selectedIssueId}
                        user={user}
                        columns={columnsToRender}
                        projectKey={board?.projectKey || board?.project?.key}
                        isViewer={isViewer}
                    />
                )
            }
            {/* Multi-Select Action Bar */}
            {isMultiSelectMode && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl px-4 py-2 border border-gray-200 dark:border-gray-700 flex items-center gap-4 animate-in slide-in-from-bottom-5 max-w-[95vw] overflow-visible">
                    <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-4 shrink-0">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                            {selectedIssueIds.size}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
                            Selected
                        </span>
                        <button
                            onClick={() => setSelectedIssueIds(new Set())}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 ml-2 font-medium"
                            disabled={selectedIssueIds.size === 0}
                        >
                            Clear
                        </button>
                    </div>

                    <div className="relative flex items-center gap-2">
                        {/* Shared Action Popover */}
                        {activeBulkAction && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[60] flex flex-col max-h-[300px]"
                                style={{ minWidth: '250px' }}
                            >
                                {activeBulkAction !== 'move' && (
                                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder={`Search ${activeBulkAction}...`}
                                            className="w-full text-sm px-2 py-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:text-gray-200"
                                            value={bulkSearchQuery}
                                            onChange={(e) => setBulkSearchQuery(e.target.value)}
                                        />
                                    </div>
                                )}
                                {activeBulkAction === 'move' && (
                                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">Move to...</div>
                                )}

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                    {/* MOVE List */}
                                    {activeBulkAction === 'move' && columnsToRender.map(col => (
                                        <button key={col.id} onClick={() => handleBulkMove(col.id)} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 block truncate">
                                            {col.name}
                                        </button>
                                    ))}

                                    {/* ASSIGN List */}
                                    {activeBulkAction === 'assign' && (
                                        <>
                                            <button onClick={() => handleBulkUpdate('assigneeUserId', null, 'to Unassigned')} className="w-full text-left px-3 py-2 text-sm rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 block font-medium mb-1">Unassign</button>
                                            {searchedUsers?.map(u => (
                                                <button key={u.id} onClick={() => handleBulkUpdate('assigneeUserId', u.id, `to ${u.displayName}`)} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                                    {u.avatarUrl && <img src={u.avatarUrl} className="w-5 h-5 rounded-full" alt="" />} {u.displayName}
                                                </button>
                                            ))}
                                            {(!searchedUsers || searchedUsers.length === 0) && <div className="p-4 text-center text-xs text-gray-400">No users found</div>}
                                        </>
                                    )}

                                    {/* EPIC List */}
                                    {activeBulkAction === 'epic' && (
                                        <>
                                            <button onClick={() => handleBulkUpdate('epicId', null, 'to No Epic')} className="w-full text-left px-3 py-2 text-sm rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 block font-medium mb-1">Clear Link</button>
                                            {searchedEpics?.map(e => (
                                                <button key={e.id} onClick={() => handleBulkUpdate('epicId', e.id, `to Epic: ${e.title}`)} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 block truncate" title={e.title}>{e.title}</button>
                                            ))}
                                            {(!searchedEpics || searchedEpics.length === 0) && <div className="p-4 text-center text-xs text-gray-400">No epics found</div>}
                                        </>
                                    )}

                                    {/* SPRINT List */}
                                    {activeBulkAction === 'sprint' && (
                                        <>
                                            <button onClick={() => handleBulkUpdate('sprintId', null, 'to No Sprint')} className="w-full text-left px-3 py-2 text-sm rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 block font-medium mb-1">Clear Link</button>
                                            {searchedSprints?.map(s => (
                                                <button key={s.id} onClick={() => handleBulkUpdate('sprintId', s.id, `to Sprint: ${s.title}`)} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 block truncate" title={s.title}>{s.title}</button>
                                            ))}
                                            {(!searchedSprints || searchedSprints.length === 0) && <div className="p-4 text-center text-xs text-gray-400">No sprints found</div>}
                                        </>
                                    )}

                                    {/* PARENT List */}
                                    {activeBulkAction === 'parent' && (
                                        <>
                                            <button onClick={() => handleBulkUpdate('parentIssueId', null, 'to No Parent')} className="w-full text-left px-3 py-2 text-sm rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 block font-medium mb-1">Clear Link</button>
                                            {searchedParents?.map(p => (
                                                <button key={p.id} onClick={() => handleBulkUpdate('parentIssueId', p.id, `to Parent: ${p.title}`)} className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 block truncate" title={p.title}>
                                                    <span className="text-gray-400 mr-1 text-xs">#{p.id.toString().substring(0, 4)}</span>{p.title}
                                                </button>
                                            ))}
                                            {(!searchedParents || searchedParents.length === 0) && <div className="p-4 text-center text-xs text-gray-400">No issues found</div>}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {[
                            { id: 'move', icon: MdDriveFileMove, label: 'Move' },
                            { id: 'assign', icon: MdPersonOutline, label: 'Assign' },
                            { id: 'epic', icon: FiLayers, label: 'Epic' },
                            { id: 'sprint', icon: FiList, label: 'Sprint' },
                            { id: 'parent', icon: MdArrowUpward, label: 'Parent' },
                        ].map((action) => (
                            <button
                                key={action.id}
                                onClick={() => {
                                    if (activeBulkAction === action.id) {
                                        setActiveBulkAction(null);
                                        setBulkSearchQuery('');
                                    } else {
                                        setActiveBulkAction(action.id);
                                        setBulkSearchQuery('');
                                    }
                                }}
                                disabled={selectedIssueIds.size === 0}
                                className={`
                                    p-2 rounded-lg transition-all relative group
                                    ${activeBulkAction === action.id
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                                        : 'hover:bg-gray-100 text-gray-600 dark:hover:bg-gray-700 dark:text-gray-400'
                                    }
                                    ${selectedIssueIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                title={action.label}
                            >
                                <action.icon className="w-5 h-5" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900/50 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                    {action.label}
                                </span>
                            </button>
                        ))}

                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                        <button
                            onClick={handleBulkDelete}
                            disabled={selectedIssueIds.size === 0}
                            className={`
                                p-2 rounded-lg transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                                ${selectedIssueIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            title="Delete Selected"
                        >
                            <MdDelete className="w-5 h-5" />
                        </button>

                        <button
                            onClick={toggleMultiSelectMode}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 ml-2"
                            title="Close Multi-Select"
                        >
                            <MdClose className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <BoardShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                boardId={boardId}
                boardName={board?.name}
                currentUser={user}
                isProjectLead={user?.id === board?.leadId}
            />
        </div>
    );
};

export default BoardView;