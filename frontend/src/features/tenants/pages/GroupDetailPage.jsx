// src/features/tenants/pages/GroupDetailPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGroupDetails } from '../hooks/useGroupDetails';
import { MdArrowBack, MdPerson, MdMail, MdAdminPanelSettings, MdOutlineBadge } from 'react-icons/md';
import GroupDetailSkeleton from '../skeletons/GroupDetailSkeleton.jsx';

const GroupDetailPage = () => {
    const { groupId } = useParams();
    const { data: group, isLoading, isError, error } = useGroupDetails(groupId);

    const renderError = (errorObj) => (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20 mx-auto my-4 max-w-2xl">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-200">{errorObj?.message || 'An unexpected error occurred.'}</p>
        </div>
    );
    
    if (isLoading) return <GroupDetailSkeleton />;
    if (isError) return renderError(error);
    if (!group) return <div>Group not found.</div>;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <Link to="/workspace/groups" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
                    <MdArrowBack className="mr-2 h-5 w-5" />
                    Back to Groups
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
                    <p className="mt-2 text-md text-gray-600 dark:text-gray-400">{group.description || 'No description provided.'}</p>
                </div>

                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Members ({group._count.members})</h2>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {group.members.map(member => (
                            <li key={member.user.id} className="py-4 flex items-center justify-between">
                                <div className="flex items-center">
                                    <img className="h-10 w-10 rounded-full" src={member.user.avatarUrl || `https://ui-avatars.com/api/?name=${member.user.name.split(' ').join('+')}&background=random`} alt="" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.user.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                   {member.role === 'MANAGER' ? <MdAdminPanelSettings className="mr-1.5 h-5 w-5 text-indigo-500" /> : <MdPerson className="mr-1.5 h-5 w-5 text-gray-400" />}
                                    <span className={member.role === 'MANAGER' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''}>
                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1).toLowerCase()}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default GroupDetailPage;