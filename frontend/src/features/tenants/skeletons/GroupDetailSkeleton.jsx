// src/features/tenants/skeletons/GroupDetailSkeleton.jsx
import React from 'react';

const GroupDetailSkeleton = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="mb-6 h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="p-6">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-6"></div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(3)].map((_, i) => (
              <li key={i} className="py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="ml-3 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                  </div>
                </div>
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailSkeleton;