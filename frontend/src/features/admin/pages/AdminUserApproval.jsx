import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // Added useRef
import { useTheme } from '../../../context/ThemeContext';
import adminService from '../services/adminService';

// Placeholder for a proper toast notification system
const showToast = (message, type = 'info') => {
  alert(`[${type.toUpperCase()}] ${message}`);
};

// Helper for formatting dates
const formatDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const AdminUserApproval = () => {
  const { theme } = useTheme();

  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'createdAt', order: 'desc' }); // Default sort by createdAt
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [userToAction, setUserToAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const selectAllCheckboxRef = useRef(null); // Create a ref for the select all checkbox

  // Memoize users to prevent re-renders of the table if data hasn't changed
  const memoizedUsers = useMemo(() => pendingUsers, [pendingUsers]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPendingUsers({
        status: ['PENDING_APPROVAL', 'PENDING_VERIFICATION'],
        page: currentPage,
        limit: usersPerPage,
        searchTerm: searchTerm,
        sortField: sortConfig.field,
        sortOrder: sortConfig.order,
      });
      setPendingUsers(data.users || []);
      setTotalPages(data.totalPages || 0);
      setTotalUsers(data.totalUsers || 0);
      setCurrentPage(data.currentPage || 1);
    } catch (err) {
      const errorMessage = err.message || err.error || 'Could not load users.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, usersPerPage, searchTerm, sortConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect to manage the indeterminate state of the "select all" checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const numSelected = selectedUserIds.length;
      const numUsersOnPage = memoizedUsers.length;
      if (numUsersOnPage > 0) {
        selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numUsersOnPage;
      } else {
        selectAllCheckboxRef.current.indeterminate = false; // No users, not indeterminate
      }
    }
  }, [selectedUserIds, memoizedUsers]); // Add memoizedUsers to dependencies

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    const order = sortConfig.field === field && sortConfig.order === 'asc' ? 'desc' : 'asc';
    setSortConfig({ field, order });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openApproveModal = (user) => {
    setUserToAction(user);
    setShowApproveModal(true);
  };

  const openRejectModal = (user) => {
    setUserToAction(user);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const openUserDetailsModal = (user) => {
    setUserToAction(user);
    setShowUserDetailsModal(true);
  };

  const closeModals = () => {
    setShowApproveModal(false);
    setShowRejectModal(false);
    setShowUserDetailsModal(false);
    setUserToAction(null);
  };

  const confirmApprove = async () => {
    if (!userToAction) return;
    setIsProcessingAction(true);
    try {
      await adminService.approveUser(userToAction.id);
      showToast(`User ${userToAction.name || userToAction.email} approved.`, 'success');
      fetchData(); // Refresh list
      setSelectedUserIds(prev => prev.filter(id => id !== userToAction.id));
    } catch (err) {
      showToast(err.message || err.error || 'Failed to approve user.', 'error');
    } finally {
      setIsProcessingAction(false);
      closeModals();
    }
  };

  const confirmReject = async () => {
    if (!userToAction) return;
    setIsProcessingAction(true);
    try {
      await adminService.rejectUser(userToAction.id, rejectionReason);
      showToast(`User ${userToAction.name || userToAction.email} rejected. Reason: ${rejectionReason || 'N/A'}`, 'success');
      fetchData(); // Refresh list
      setSelectedUserIds(prev => prev.filter(id => id !== userToAction.id));
    } catch (err)      {
      showToast(err.message || err.error || 'Failed to reject user.', 'error');
    } finally {
      setIsProcessingAction(false);
      closeModals();
    }
  };

  const handleResendVerification = async (userId, userNameOrEmail) => {
    setIsProcessingAction(true);
    try {
        await adminService.resendVerificationEmail(userId);
        showToast(`Verification email resent to ${userNameOrEmail}.`, 'success');
    } catch (err) {
        showToast(err.message || err.error || 'Failed to resend verification email.', 'error');
    } finally {
        setIsProcessingAction(false);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUserIds(prevSelected =>
      prevSelected.includes(userId)
        ? prevSelected.filter(id => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(memoizedUsers.map(user => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUserIds.length === 0) {
      showToast('No users selected for bulk approval.', 'warning');
      return;
    }
    if (!window.confirm(`Are you sure you want to approve ${selectedUserIds.length} selected users?`)) return;
    
    setIsProcessingAction(true);
    try {
      for (const userId of selectedUserIds) {
        await adminService.approveUser(userId);
      }
      showToast(`${selectedUserIds.length} users approved successfully.`, 'success');
      fetchData();
      setSelectedUserIds([]);
    } catch (err) {
      showToast(err.message || err.error || 'Bulk approval failed for some users.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedUserIds.length === 0) {
      showToast('No users selected for bulk rejection.', 'warning');
      return;
    }
    if (!window.confirm(`Are you sure you want to REJECT ${selectedUserIds.length} selected users? This action is usually permanent.`)) return;

    setIsProcessingAction(true);
    try {
      for (const userId of selectedUserIds) {
        await adminService.rejectUser(userId, "Bulk rejection by admin.");
      }
      showToast(`${selectedUserIds.length} users rejected.`, 'success');
      fetchData();
      setSelectedUserIds([]);
    } catch (err) {
      showToast(err.message || err.error || 'Bulk rejection failed for some users.', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const ThWithSort = ({ field, label }) => (
    <th
      scope="col"
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
      onClick={() => handleSort(field)}
    >
      {label}
      {sortConfig.field === field && (
        <span className="ml-1">{sortConfig.order === 'asc' ? '▲' : '▼'}</span>
      )}
    </th>
  );

  const tableClasses = "min-w-full divide-y divide-gray-200 dark:divide-gray-700";
  const cardClasses = "bg-white dark:bg-gray-800 rounded-lg shadow p-6";
  const inputClasses = "block w-full rounded-md border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-indigo-500 dark:focus:ring-indigo-500 sm:text-sm";
  const buttonClasses = "px-4 py-2 text-sm rounded border transition-colors duration-150 ease-in-out";
  const primaryButtonClasses = `${buttonClasses} bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`;
  const secondaryButtonClasses = `${buttonClasses} bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600`;
  const dangerButtonClasses = `${buttonClasses} bg-red-600 text-white hover:bg-red-500 border-red-700 dark:border-red-500`;

  if (loading && pendingUsers.length === 0) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading pending users...</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6">
        Admin User Management
      </h1>

      <div className={`${cardClasses} mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Search by Name or Email
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="e.g., John Doe or john@example.com"
              className={`${inputClasses} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="usersPerPage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Users per page
            </label>
            <select
                id="usersPerPage"
                value={usersPerPage}
                onChange={(e) => { setUsersPerPage(Number(e.target.value)); setCurrentPage(1);}}
                className={`${inputClasses} mt-1`}
            >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {selectedUserIds.length > 0 && (
        <div className={`${cardClasses} mb-6 flex items-center space-x-3`}>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedUserIds.length} user(s) selected.
          </span>
          <button
            onClick={handleBulkApprove}
            className={`${primaryButtonClasses} disabled:opacity-50`}
            disabled={isProcessingAction}
          >
            Approve Selected
          </button>
          <button
            onClick={handleBulkReject}
            className={`${dangerButtonClasses} disabled:opacity-50`}
            disabled={isProcessingAction}
          >
            Reject Selected
          </button>
        </div>
      )}

      <div className={`${cardClasses} overflow-x-auto`}>
        {loading && <div className="py-4 text-center text-gray-500 dark:text-gray-400">Refreshing user list...</div>}
        {error && !loading && <div className="p-4 text-center text-red-600 dark:text-red-400">Error: {error}</div>}
        {!loading && !error && memoizedUsers.length === 0 && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">No users found matching your criteria.</div>
        )}
        {!error && memoizedUsers.length > 0 && (
          <table className={tableClasses}>
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="p-4">
                  <input
                    ref={selectAllCheckboxRef} // Use the ref here
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-gray-900 dark:border-gray-600"
                    onChange={handleSelectAll}
                    checked={memoizedUsers.length > 0 && selectedUserIds.length === memoizedUsers.length}
                    // The 'indeterminate' prop is removed from here, as it's managed via ref in useEffect
                  />
                </th>
                <ThWithSort field="id" label="User ID" />
                <ThWithSort field="name" label="Name" />
                <ThWithSort field="email" label="Email" />
                <ThWithSort field="createdAt" label="Registration Date" />
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {memoizedUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:bg-gray-900 dark:border-gray-600"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <button onClick={() => openUserDetailsModal(user)} className="hover:underline" title="View user details">
                        {user.id}
                    </button>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                        user.status === 'PENDING_VERIFICATION' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'
                    }`}>
                        {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {user.status === 'PENDING_APPROVAL' && (
                        <>
                            <button onClick={() => openApproveModal(user)} className={`${buttonClasses} bg-green-500 hover:bg-green-600 text-white text-xs`} disabled={isProcessingAction}>Approve</button>
                            <button onClick={() => openRejectModal(user)} className={`${buttonClasses} bg-red-500 hover:bg-red-600 text-white text-xs`} disabled={isProcessingAction}>Reject</button>
                        </>
                    )}
                    {user.status === 'PENDING_VERIFICATION' && (
                        <button onClick={() => handleResendVerification(user.id, user.name || user.email)} className={`${buttonClasses} bg-sky-500 hover:bg-sky-600 text-white text-xs`} disabled={isProcessingAction}>
                            Resend Email
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`${secondaryButtonClasses} disabled:opacity-50`}>Previous</button>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`${secondaryButtonClasses} disabled:opacity-50`}>Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span>
                  {' '}to <span className="font-medium">{Math.min(currentPage * usersPerPage, totalUsers)}</span>
                  {' '}of <span className="font-medium">{totalUsers}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                    Prev
                  </button>
                  {[...Array(totalPages).keys()].map(num => {
                      const pageNum = num + 1;
                      if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage -1 && pageNum <= currentPage + 1)) {
                          return (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium
                                    ${currentPage === pageNum ? 'z-10 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                {pageNum}
                            </button>
                          );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">...</span>;
                      }
                      return null;
                  })}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showApproveModal && userToAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out" onClick={closeModals}>
          <div className={`${cardClasses} w-full max-w-md`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Approve User</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to approve user <strong className="text-gray-700 dark:text-gray-200">{userToAction.name || userToAction.email}</strong> ({userToAction.email})?
              </p>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button type="button" className={`${primaryButtonClasses} w-full col-span-1 disabled:opacity-50`} onClick={confirmApprove} disabled={isProcessingAction}>
                {isProcessingAction ? 'Processing...' : 'Approve'}
              </button>
              <button type="button" className={`${secondaryButtonClasses} w-full col-span-1 mt-3 sm:mt-0`} onClick={closeModals} disabled={isProcessingAction}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && userToAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 transition-opacity duration-300 ease-in-out" onClick={closeModals}>
          <div className={`${cardClasses} w-full max-w-md`} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Reject User</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to reject user <strong className="text-gray-700 dark:text-gray-200">{userToAction.name || userToAction.email}</strong> ({userToAction.email})? This action may not be reversible.
              </p>
              <div className="mt-4">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason for Rejection (Optional, for internal log)
                </label>
                <textarea
                  id="rejectionReason"
                  name="rejectionReason"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className={`${inputClasses} mt-1`}
                  placeholder="e.g., suspicious activity, test account..."
                />
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
              <button type="button" className={`${dangerButtonClasses} w-full col-span-1 disabled:opacity-50`} onClick={confirmReject} disabled={isProcessingAction}>
                {isProcessingAction ? 'Processing...' : 'Confirm Reject'}
              </button>
              <button type="button" className={`${secondaryButtonClasses} w-full col-span-1 mt-3 sm:mt-0`} onClick={closeModals} disabled={isProcessingAction}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showUserDetailsModal && userToAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 transition-opacity duration-300 ease-in-out" onClick={closeModals}>
            <div className={`${cardClasses} w-full max-w-lg overflow-y-auto max-h-[80vh]`} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">User Details</h3>
                    <button onClick={closeModals} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="space-y-3 text-sm">
                    {Object.entries(userToAction).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-3 gap-2">
                            <span className="font-medium text-gray-600 dark:text-gray-400 capitalize col-span-1">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="text-gray-800 dark:text-gray-200 col-span-2 break-words">
                                {key === 'createdAt' || key === 'registrationDate' || key === 'lastActivity' || key.endsWith('At') ? formatDate(value) : String(value)}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end">
                    <button type="button" className={`${secondaryButtonClasses}`} onClick={closeModals}>
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserApproval;