// src/features/tenants/skeletons/GroupListSkeleton.jsx
import React from 'react';

const SkeletonListItem = () => (
  <div className="block p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
    <div className="flex items-center justify-between animate-pulse">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        <div className="ml-4 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
      <div className="ml-5 flex-shrink-0 h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
  </div>
);

const GroupListSkeleton = () => {
  return (
    <ul className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </ul>
  );
};

export default GroupListSkeleton;