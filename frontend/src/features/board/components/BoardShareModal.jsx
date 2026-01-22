import React, { useState, useEffect, useRef } from 'react';
import {
    MdClose, MdLink, MdContentCopy, MdCheck,
    MdPersonAdd, MdSearch, MdMoreVert, MdShield
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import boardService from '../services/boardService';
import { toast } from 'react-hot-toast';

const BoardShareModal = ({ isOpen, onClose, boardId, boardName, currentUser, isProjectLead }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [members, setMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [copied, setCopied] = useState(false);
    const [inviteRole, setInviteRole] = useState('MEMBER');

    // For handling the "Invite" state
    const [selectedUser, setSelectedUser] = useState(null);
    const searchTimeout = useRef(null);

    const shareUrl = `${window.location.origin}/boards/${boardId}/join`;

    // Fetch members on open
    useEffect(() => {
        if (isOpen) {
            fetchMembers();
        }
    }, [isOpen, boardId]);

    const fetchMembers = async () => {
        setIsLoadingMembers(true);
        try {
            const data = await boardService.getBoard(boardId);
            // Assuming data.users contains the project members with their roles
            setMembers(data.users || []);
        } catch (error) {
            console.error('Failed to fetch members:', error);
            toast.error('Failed to load members');
        } finally {
            setIsLoadingMembers(false);
        }
    };

    // Handle Search
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await boardService.getEligibleUsers(boardId, searchQuery);
                setSearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout.current);
    }, [searchQuery, boardId]);

    const handleAddUser = async (user) => {
        try {
            await boardService.inviteToBoard(boardId, user.email, inviteRole);
            toast.success(`Added ${user.displayName} as ${inviteRole.toLowerCase()}`);
            setSearchQuery('');
            setSearchResults([]);
            fetchMembers(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add user');
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await boardService.updateMemberRole(boardId, userId, newRole);
            toast.success('Role updated');
            fetchMembers(); // Refresh list
        } catch (error) {
            toast.error('Failed to update role');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Link copied to clipboard');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                        Share "{boardName}"
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <MdClose className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-2 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">

                    {/* Search / Add Section */}
                    <div className="relative">
                        <div className="relative flex items-center">
                            <MdPersonAdd className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Add people and groups"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
                                </div>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {(searchResults.length > 0 || isSearching) && searchQuery.length >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden"
                                >
                                    {searchResults.length > 0 ? (
                                        <div className="py-2">
                                            {searchResults.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => handleAddUser(user)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                                >
                                                    <img
                                                        src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName}&background=random&color=fff`}
                                                        alt=""
                                                        className="h-8 w-8 rounded-full"
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.displayName}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : !isSearching && (
                                        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No eligible users found outside the project
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Member List Section */}
                    <div className="space-y-4">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">People with access</div>

                        <div className="space-y-3">
                            {isLoadingMembers ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                        <div className="flex-grow space-y-2">
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                                            <div className="h-3 w-48 bg-gray-100 dark:bg-gray-800 rounded" />
                                        </div>
                                    </div>
                                ))
                            ) : members.map(member => (
                                <div key={member.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.displayName}&background=random&color=fff`}
                                            alt=""
                                            className="h-10 w-10 rounded-full border border-gray-100 dark:border-gray-700"
                                        />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                {member.displayName}
                                                {member.id === currentUser?.id && (
                                                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold">You</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{member.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        {isProjectLead && member.id !== currentUser?.id ? (
                                            <select
                                                value={member.projectRole || 'MEMBER'}
                                                onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                                className="bg-transparent text-sm text-gray-500 dark:text-gray-400 focus:outline-none hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded cursor-pointer transition-colors"
                                            >
                                                <option value="VIEWER">Viewer</option>
                                                <option value="MEMBER">Member</option>
                                                <option value="LEAD">Lead</option>
                                            </select>
                                        ) : (
                                            <span className="text-sm text-gray-400 dark:text-gray-500 px-2 py-1 flex items-center gap-1">
                                                {member.projectRole === 'LEAD' && <MdShield className="h-3.5 w-3.5" />}
                                                {member.projectRole?.charAt(0).toUpperCase() + member.projectRole?.slice(1).toLowerCase() || 'Member'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 mt-auto bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-lg transition-colors"
                    >
                        {copied ? <MdCheck className="h-5 w-5" /> : <MdLink className="h-5 w-5" />}
                        {copied ? 'Copied link' : 'Copy link'}
                    </button>

                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default BoardShareModal;
