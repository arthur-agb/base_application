// src/features/tenants/pages/GroupListPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useGroups } from '../hooks/useGroups';
import { MdGroup, MdChevronRight } from 'react-icons/md';
import GroupListSkeleton from '../skeletons/GroupListSkeleton.jsx';

const GroupListItem = ({ group }) => (
  <li>
    <Link
      to={`/workspace/groups/${group.id}`}
      className="block p-4 sm:p-6 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg shadow transition-colors duration-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <MdGroup className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div className="ml-4">
            <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-300 truncate">{group.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{group._count.members} {group._count.members === 1 ? 'member' : 'members'}</p>
          </div>
        </div>
        <div className="ml-5 flex-shrink-0">
          <MdChevronRight className="h-6 w-6 text-gray-400" />
        </div>
      </div>
    </Link>
  </li>
);

const GroupListPage = () => {
  const { data: groups, isLoading, isError, error } = useGroups();

  const renderError = (errorObj) => (
    <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20 mx-auto my-4 max-w-2xl">
      <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
      <p className="mt-2 text-sm text-red-700 dark:text-red-200">{errorObj?.message || 'An unexpected error occurred.'}</p>
    </div>
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Workspace Groups</h1>
        <p className="mt-2 text-md text-gray-600 dark:text-gray-400">Manage user groups within your workspace.</p>
      </div>

      {isLoading && <GroupListSkeleton />}
      {isError && renderError(error)}

      {!isLoading && !isError && (
        <ul className="space-y-4">
          {groups && groups.length > 0 ? (
            groups.map(group => <GroupListItem key={group.id} group={group} />)
          ) : (
            <div className="text-center py-12 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                <MdGroup className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No groups found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new group.</p>
                {/* Add a "Create Group" button here once the functionality exists */}
            </div>
          )}
        </ul>
      )}
    </div>
  );
};

export default GroupListPage;