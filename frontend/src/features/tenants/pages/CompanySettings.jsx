import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MdBusiness, MdPersonAdd, MdDelete, MdPayment, MdArrowBack, MdShield } from 'react-icons/md';
import tenantService from '../services/tenantService';
import { Logger } from '../../../utils';
import UserProfileSkeleton from '../../users/skeletons/UserProfileSkeleton';
import { generateInitialsAvatar } from '../../../utils/avatarUtils';

const CompanySettings = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [details, setDetails] = useState(null);
    const [users, setUsers] = useState([]);

    // Invite State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('MEMBER');
    const [isInviting, setIsInviting] = useState(false);

    // Management State
    const [managingUser, setManagingUser] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [roles, setRoles] = useState([]);
    const [roleDescriptions, setRoleDescriptions] = useState({});

    const userCompanyRole = user?.companyRole;
    const isOwner = userCompanyRole === 'OWNER';
    const isAdmin = userCompanyRole === 'ADMIN';
    const isManager = userCompanyRole === 'MANAGER';

    useEffect(() => {
        if (!user || !['OWNER', 'ADMIN', 'MANAGER'].includes(user.companyRole)) {
            Logger.warn('Unauthorized access attempt to Company Settings page.');
            return;
        }
        fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [detailsData, usersData, roleData] = await Promise.all([
                tenantService.getWorkspaceDetails(),
                tenantService.getTenantUsers(),
                tenantService.getRoleDescriptions()
            ]);
            setDetails(detailsData);
            setUsers(usersData);
            setRoles(roleData.roles || []);
            setRoleDescriptions(roleData.descriptions || {});
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch company settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleInviteUser = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setIsInviting(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await tenantService.inviteUserToTenant(inviteEmail, inviteRole);
            setInviteEmail('');
            setInviteRole('MEMBER');
            setSuccessMessage(response.message);
            await fetchData(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to invite user.');
        } finally {
            setIsInviting(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        setIsUpdating(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await tenantService.updateUserRole(userId, newRole);
            setUsers(current => current.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setSuccessMessage(response.message);
            setManagingUser(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user role.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveUser = async (userId) => {
        if (userId === user.id) {
            alert("You cannot remove yourself from the workspace.");
            return;
        }

        if (!window.confirm('Are you sure you want to remove this user?')) return;

        setIsUpdating(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await tenantService.removeUserFromTenant(userId);
            setUsers(current => current.filter(u => u.id !== userId));
            setSuccessMessage('User removed successfully.');
            setManagingUser(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove user.');
        } finally {
            setIsUpdating(false);
        }
    };

    const formatRole = (role) => {
        if (!role) return '';
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
    };

    if (!user || !['OWNER', 'ADMIN', 'MANAGER'].includes(user.companyRole)) {
        return (
            <div className="p-8 text-center text-red-600 dark:text-red-400">
                Access Denied: You do not have permission to view workspace settings.
            </div>
        );
    }

    if (loading) return <UserProfileSkeleton />;

    return (
        <div className="w-full relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <MdArrowBack className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200">
                        Workspace Settings
                    </h1>
                </div>
            </div>

            {successMessage && (
                <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* --- Left Column: Company Info & Billing --- */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Company Info Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <MdBusiness className="text-indigo-500" /> Company Info
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Workspace Name:</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{details.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">URL Slug:</span>
                                <span className="font-mono text-gray-800 dark:text-gray-200">/{details.slug}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Created At:</span>
                                <span className="text-gray-800 dark:text-gray-200">{new Date(details.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Subscription & Billing Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <MdPayment className="text-indigo-500" /> Subscription & Billing
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-md">
                                <div className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-wider mb-1">
                                    Current Plan
                                </div>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">
                                    {details.subscription.planName}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium dark:bg-green-900 dark:text-green-300">
                                        {details.subscription.status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Monthly Cost:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">
                                        {details.subscription.currency} {details.subscription.totalCost.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    disabled
                                    className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md cursor-not-allowed text-sm font-medium"
                                >
                                    Manage Billing (Coming Soon)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Right Column: User Management --- */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        User Management
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Manage people and their roles in your workspace.
                                    </p>
                                </div>

                                <form onSubmit={handleInviteUser} className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="email"
                                        placeholder="Enter email..."
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-48"
                                        required
                                    />
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-32"
                                    >
                                        {roles.map(r => (
                                            <option key={r} value={r}>{formatRole(r)}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={isInviting}
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                                    >
                                        <MdPersonAdd /> {isInviting ? 'Adding...' : 'Add User'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="overflow-x-auto text-sm">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4 flex items-center gap-3">
                                                <img
                                                    src={u.avatarUrl || generateInitialsAvatar(u.name || u.email || 'User', 40)}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = generateInitialsAvatar(u.name || u.email || 'User', 40);
                                                    }}
                                                    className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600"
                                                    alt={u.name}
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{u.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{u.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'OWNER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800' :
                                                        u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                                                            u.role === 'MANAGER' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                                                                u.role === 'MEMBER' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' :
                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setManagingUser(u)}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 text-center border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {users.length} active members. Plan supports up to {details.subscription.maxUsers || 'unlimited'} users.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Management Modal */}
            {managingUser && (
                <div
                    className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setManagingUser(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-800 shadow-xl rounded-lg w-full max-w-lg p-6 space-y-6"
                    >
                        <div>
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                <MdShield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="mt-3 text-center">
                                <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white">
                                    Manage Access: {managingUser.name}
                                </h3>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    {managingUser.email}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 block">Change Role</label>
                                <div className="flex flex-col gap-2">
                                    {roles.map(role => (
                                        <button
                                            key={role}
                                            onClick={() => handleUpdateRole(managingUser.id, role)}
                                            disabled={isUpdating || (!isOwner && role === 'OWNER')}
                                            title={(!isOwner && role === 'OWNER') ? 'Only Owners can assign other Owners' : ''}
                                            className={`flex items-start gap-4 p-2 text-left rounded-xl border transition-all ${managingUser.role === role
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                                        >
                                            <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${managingUser.role === role ? 'border-indigo-600' : 'border-gray-300 dark:border-gray-600'
                                                }`}>
                                                {managingUser.role === role && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className={`text-sm font-bold ${managingUser.role === role ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {formatRole(role)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                                    {roleDescriptions[role]}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                                <button
                                    onClick={() => handleRemoveUser(managingUser.id)}
                                    disabled={isUpdating || (managingUser.id === user.id) || (!isOwner && managingUser.role === 'OWNER')}
                                    className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <MdDelete /> Remove User
                                </button>
                                <button
                                    onClick={() => setManagingUser(null)}
                                    className="w-full inline-flex justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanySettings;
