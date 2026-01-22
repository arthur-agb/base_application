// src/features/board/components/CommentItem.jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux'; // useDispatch removed if all actions are RQ mutations here
import { useMutation, useQueryClient } from '@tanstack/react-query';

import boardService from '../services/boardService'; // For all comment operations

// Icons (no changes needed)
import {
    MdReply, MdEdit, MdDelete, MdThumbUp, MdFavorite,
    MdSend, MdCancel
} from 'react-icons/md';
import { FiHeart, FiThumbsUp } from 'react-icons/fi';

// REMOVED Redux thunk imports for comment mutations:
// import {
//     updateCommentOnIssue,
//     deleteCommentFromIssue,
//     toggleReactionOnComment,
// } from '../';

// --- Reaction Button Sub-Component (no changes needed) ---
const ReactionButton = ({ type, count, reacted, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center px-2 py-1 text-xs rounded-full border transition-colors duration-150 ease-in-out
                    ${reacted
                ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200'
                : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
            }`}
        aria-pressed={reacted}
        aria-label={`React with ${type}`}
    >
        {children}
        {count > 0 && <span className="ml-1 font-medium">{count}</span>}
    </button>
);

// --- Main Comment Item Component ---
const CommentItem = ({ comment, issueId, depth = 0 }) => {
    // useDispatch is removed as we are using RQ mutations for all actions here.
    // If there were other Redux dispatches unrelated to these mutations, it would be kept.
    const queryClient = useQueryClient();
    const user = useSelector(state => state.auth.user);

    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.body);

    if (!comment || !user) {
        console.warn("CommentItem rendered without comment or user", { comment, user });
        return null;
    }

    const { id: commentId, author, body, createdAt, edited, editedAt, reactions, replies } = comment;

    const canEdit = user.id === author?.id;
    const canDelete = user.id === author?.id || user.role === 'ADMIN' || user.role === 'MANAGER'; // Ensure role strings match your setup

    // --- React Query Mutations ---

    // For Adding a Reply (already correctly implemented)
    const addReplyMutation = useMutation({
        mutationFn: (commentData) => boardService.addComment(commentData), // { issueId, text, parentCommentId }
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['comments', variables.issueId] });
            // queryClient.invalidateQueries({ queryKey: ['issueDetails', variables.issueId] }); // If needed
            setReplyText('');
            setIsReplying(false);
        },
        onError: (error) => {
            console.error("[CommentItem RQ] Error adding reply:", error);
        }
    });

    // For Updating a Comment
    const updateCommentMutation = useMutation({
        mutationFn: (payload) => boardService.updateComment(payload.commentId, { text: payload.text }), // { commentId, text }
        onSuccess: (data, variables) => {
            // variables here would be { commentId, text, issueId (passed for invalidation) }
            queryClient.invalidateQueries({ queryKey: ['comments', variables.issueId] });
            // queryClient.invalidateQueries({ queryKey: ['issueDetails', variables.issueId] }); // If needed
            setIsEditing(false);
        },
        onError: (error) => {
            console.error("[CommentItem RQ] Error updating comment:", error);
        }
    });

    // For Deleting a Comment
    const deleteCommentMutation = useMutation({
        mutationFn: (payload) => boardService.deleteComment(payload.commentId), // { commentId }
        onSuccess: (data, variables) => {
            // variables here would be { commentId, issueId (passed for invalidation) }
            queryClient.invalidateQueries({ queryKey: ['comments', variables.issueId] });
            // queryClient.invalidateQueries({ queryKey: ['issueDetails', variables.issueId] }); // If needed
        },
        onError: (error) => {
            console.error("[CommentItem RQ] Error deleting comment:", error);
        }
    });

    // For Toggling a Reaction
    const toggleReactionMutation = useMutation({
        mutationFn: (payload) => boardService.toggleReaction(payload.commentId, { type: payload.reactionType }), // { commentId, reactionType }
        onSuccess: (data, variables) => {
            // data would be the updated reaction info from the backend { reactions: { ... } }
            // variables here would be { commentId, reactionType, issueId (for invalidation) }

            // Optimistic update or smart invalidation can be tricky here.
            // For simplicity, just invalidate comments query.
            // A more advanced approach might use queryClient.setQueryData to update the specific comment's reactions.
            queryClient.invalidateQueries({ queryKey: ['comments', variables.issueId] });
            // queryClient.invalidateQueries({ queryKey: ['issueDetails', variables.issueId] }); // If reactions are part of issue details
        },
        onError: (error) => {
            console.error("[CommentItem RQ] Error toggling reaction:", error);
        }
    });


    // --- Action Handlers ---
    const handleReplySubmit = () => {
        if (replyText.trim() && issueId) {
            addReplyMutation.mutate({
                issueId,
                text: replyText,
                parentCommentId: commentId
            });
        }
    };

    const handleEditSubmit = () => {
        if (editText.trim() && editText.trim() !== body && issueId) {
            updateCommentMutation.mutate({
                commentId,
                text: editText,
                issueId // Pass issueId for cache invalidation in onSuccess
            });
        } else if (editText.trim() === body) {
            setIsEditing(false); // No change, just close editor
        }
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
            deleteCommentMutation.mutate({
                commentId,
                issueId // Pass issueId for cache invalidation in onSuccess
            });
        }
    };

    const handleToggleReaction = (reactionType) => {
        toggleReactionMutation.mutate({
            commentId,
            reactionType,
            issueId // Pass issueId for cache invalidation in onSuccess
        });
    };

    const getReactionCount = (type) => reactions?.[type]?.length || 0;
    const hasUserReacted = (type) => reactions?.[type]?.includes(user.id) || false;

    const availableReactions = [
        { type: 'thumbsup', iconDefault: <FiThumbsUp className="mr-1 h-4 w-4" />, iconActive: <MdThumbUp className="mr-1 h-4 w-4 text-indigo-600 dark:text-indigo-400" /> },
        { type: 'heart', iconDefault: <FiHeart className="mr-1 h-4 w-4" />, iconActive: <MdFavorite className="mr-1 h-4 w-4 text-red-500 dark:text-red-400" /> },
    ];

    // --- Render Logic (largely the same, but check mutation loading/error states) ---
    return (
        <div className={`comment-item ${depth > 0 ? 'ml-4 sm:ml-6 md:ml-8 lg:ml-10' : ''} py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0`}>
            <div className="flex items-start space-x-3">
                <img
                    className="h-8 w-8 rounded-full flex-shrink-0"
                    src={author?.avatarUrl || `https://placehold.co/40x40/E2E8F0/A0AEC0?text=${author?.displayName ? author.displayName.charAt(0).toUpperCase() : '?'}`}
                    alt={author?.displayName || 'User avatar'}
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/40x40/E2E8F0/A0AEC0?text=${author?.displayName ? author.displayName.charAt(0).toUpperCase() : '?'}` }}
                />
                <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-x-2">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate" title={author?.displayName || 'Unknown User'}>
                            {author?.displayName || 'Unknown User'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {new Date(createdAt).toLocaleString()}
                            {edited && (
                                <span className="italic" title={editedAt ? `Edited at ${new Date(editedAt).toLocaleString()}` : 'Edited'}> (edited)</span>
                            )}
                        </p>
                    </div>

                    {isEditing ? (
                        <div className="mt-1">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                rows="3"
                                autoFocus
                            />
                            {updateCommentMutation.isError && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Error: {updateCommentMutation.error?.message || "Could not update comment."}
                                </p>
                            )}
                            <div className="mt-2 flex items-center space-x-2">
                                <button
                                    onClick={handleEditSubmit}
                                    disabled={updateCommentMutation.isLoading || editText.trim() === body}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 disabled:opacity-50"
                                >
                                    {updateCommentMutation.isLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => { setIsEditing(false); setEditText(body); }}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{body}</p>
                    )}

                    {!isEditing && (
                        <div className="mt-2 flex items-center flex-wrap gap-x-3 gap-y-1">
                            <button
                                onClick={() => setIsReplying(!isReplying)}
                                className="text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 flex items-center"
                                aria-expanded={isReplying}
                            >
                                <MdReply className="mr-1 h-4 w-4" /> Reply
                            </button>
                            {canEdit && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    disabled={updateCommentMutation.isLoading} // Prevent editing while another save is in progress
                                    className="text-xs text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 flex items-center disabled:opacity-50"
                                >
                                    <MdEdit className="mr-1 h-4 w-4" /> Edit
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteCommentMutation.isLoading}
                                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 flex items-center disabled:opacity-50"
                                >
                                    {deleteCommentMutation.isLoading ? <><MdDelete className="mr-1 h-4 w-4 animate-spin" /> Deleting...</> : <><MdDelete className="mr-1 h-4 w-4" /> Delete</>}
                                </button>
                            )}
                            <div className="flex items-center space-x-1">
                                {availableReactions.map(reaction => (
                                    <ReactionButton
                                        key={reaction.type}
                                        type={reaction.type}
                                        count={getReactionCount(reaction.type)}
                                        reacted={hasUserReacted(reaction.type)}
                                        onClick={() => handleToggleReaction(reaction.type)}
                                    >
                                        {hasUserReacted(reaction.type) ? reaction.iconActive : reaction.iconDefault}
                                    </ReactionButton>
                                ))}
                            </div>
                        </div>
                    )}
                    {deleteCommentMutation.isError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Error deleting: {deleteCommentMutation.error?.message || "Could not delete comment."}
                        </p>
                    )}


                    {isReplying && (
                        <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleReplySubmit();
                                    }
                                }}
                                placeholder={`Replying to ${author?.displayName || 'User'}...`}
                                rows="2"
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                autoFocus
                            />
                            <div className="mt-2 flex items-center space-x-2">
                                <button
                                    onClick={handleReplySubmit}
                                    disabled={!replyText.trim() || addReplyMutation.isLoading}
                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 disabled:opacity-50"
                                >
                                    <MdSend className="mr-1 h-4 w-4" /> {addReplyMutation.isLoading ? 'Posting...' : 'Post Reply'}
                                </button>
                                <button
                                    onClick={() => setIsReplying(false)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none"
                                >
                                    <MdCancel className="mr-1 h-4 w-4" /> Cancel
                                </button>
                            </div>
                            {addReplyMutation.isError && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Error: {addReplyMutation.error?.message || "Could not post reply."}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {replies && replies.length > 0 && (
                <div className="replies-section mt-3 border-l-2 border-gray-200 dark:border-gray-600">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            issueId={issueId}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentItem;