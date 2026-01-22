import React, { useState, useEffect } from 'react';
import tenantService from '../services/tenantService';

export default function TenantManagerPage() {
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('MEMBER');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Management UI State
  const [managingUser, setManagingUser] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [roles, setRoles] = useState([]);
  const [roleDescriptions, setRoleDescriptions] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null); // Clear previous success messages
        const [tenantUsers, roleData] = await Promise.all([
          tenantService.getTenantUsers(),
          tenantService.getRoleDescriptions()
        ]);
        setUsers(tenantUsers);
        setRoles(roleData.roles || []);
        setRoleDescriptions(roleData.descriptions || {});
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch workspace data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      setError('Please enter an email address.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await tenantService.inviteUserToTenant(newUserEmail, newUserRole);
      setSuccessMessage(response.message);
      // Add the new user to the UI list immediately for a great UX
      setUsers(currentUsers => [...currentUsers, response.user].sort((a, b) => a.name.localeCompare(b.name)));
      setNewUserEmail(''); // Clear input on success
      setNewUserRole('MEMBER');
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setIsUpdating(true);
    setError(null);
    try {
      await tenantService.updateUserRole(userId, newRole);
      setUsers(current => current.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setSuccessMessage('User role updated successfully.');
      setManagingUser(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the workspace?')) {
      return;
    }

    setIsUpdating(true);
    setError(null);
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

  // Helper to format role from enum (e.g., ADMIN -> Admin)
  const formatRole = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:p-6 lg:p-8 min-h-dvh">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
              Workspace Members
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your team and their access levels.
            </p>
          </div>
        </div>

        {/* Invite Section */}
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Invite New Member
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
              <p>Enter the email address of the person you want to invite to this workspace.</p>
            </div>
            <form onSubmit={handleInviteUser} className="mt-5 sm:flex sm:items-center">
              <div className="w-full sm:max-w-xs">
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="team@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mt-3 sm:mt-0 sm:ml-3">
                <select
                  id="role"
                  name="role"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                >
                  {roles.map(r => (
                    <option key={r} value={r}>{formatRole(r)}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Inviting...' : 'Invite'}
              </button>
            </form>
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            {successMessage && <p className="mt-2 text-sm text-green-600 dark:text-green-400">{successMessage}</p>}
          </div>
        </div>

        {/* User List */}
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Manage</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          Loading members...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No members found.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {u.avatarUrl ? (
                                  <img className="h-10 w-10 rounded-full" src={u.avatarUrl} alt="" />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {u.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'OWNER' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              u.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                u.role === 'MANAGER' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }`}>
                              {formatRole(u.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setManagingUser(u)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Manage Access
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Management Modal */}
      {managingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setManagingUser(null)}
            ></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900">
                  <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                    Manage Access: {managingUser.name}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Update the role for {managingUser.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 space-y-3">
                <div className="flex flex-col gap-2">
                  {roles.map(role => (
                    <button
                      key={role}
                      onClick={() => handleUpdateRole(managingUser.id, role)}
                      disabled={isUpdating}
                      className={`flex items-start gap-4 p-4 text-left rounded-xl border transition-all ${managingUser.role === role
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
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

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50"
                    onClick={() => handleRemoveUser(managingUser.id)}
                    disabled={isUpdating}
                  >
                    Remove from Workspace
                  </button>
                </div>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={() => setManagingUser(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}