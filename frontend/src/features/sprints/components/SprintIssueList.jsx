// src/features/sprints/components/SprintIssueList.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const SprintIssueList = ({ issues, isLoading }) => {
    if (isLoading) return <p className="text-gray-500">Loading issues...</p>;
    if (!issues || issues.length === 0) {
        return <p className="text-gray-500 italic">No issues have been added to this sprint.</p>;
    }

    return (
        <div className="space-y-3">
            {issues.map(issue => (
                <Link to={`/issues/${issue.id}`} key={issue.id} className="block p-3 border rounded-md dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{issue.title}</p>
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500">{issue.column.name}</span>
                            {issue.assignee && (
                                <img
                                    src={issue.assignee.avatarUrl || `https://ui-avatars.com/api/?name=${issue.assignee.name.split(' ').join('+')}`}
                                    alt={issue.assignee.name}
                                    title={`Assigned to ${issue.assignee.name}`}
                                    className="w-6 h-6 rounded-full"
                                />
                            )}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default SprintIssueList;