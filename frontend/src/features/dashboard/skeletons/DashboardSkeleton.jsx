// src/components/skeletons/features/dashboard/DashboardSkeleton.jsx
import React from 'react';
import '../../../../output.css'

const DashboardSkeleton = () => {
    // Number of placeholder activities to show in the list
    const placeholderActivitiesCount = 4;
    const placeholderActivities = Array.from({ length: placeholderActivitiesCount });

    return (
        // Mimic the outer flex container from Dashboard.jsx for alignment
        // Added animate-pulse here
        <div className="flex flex-col items-center md:items-start justify-start w-full animate-pulse">
            {/* Removed the separate dashboard title mimic */}

            {/* Mimic Main Grid Container */}
            {/* Ensured grid columns and gap match Dashboard.jsx */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Mimic Projects Overview Card */}
                {/* Use bg-gray-200 for skeleton base */}
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6">
                    {/* Mimic Title */}
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                    {/* Mimic Large Number (adjust height for emphasis) */}
                    <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                </div>

                {/* Mimic Tasks Overview Card */}
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6">
                     {/* Mimic Title */}
                     <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/5 mb-2"></div>
                     {/* Mimic Large Number */}
                     <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                </div>

                {/* Mimic Recent Activity Card */}
                {/* Ensure column span matches Dashboard.jsx (md:col-span-2 lg:col-span-1) */}
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6 md:col-span-2 lg:col-span-1">
                    {/* Mimic Title */}
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                    {/* Mimic Activity List Area */}
                    {/* Added max-h-60 and overflow-hidden to hint at scrollable area */}
                    <div className="space-y-3 max-h-60 overflow-hidden">
                        {placeholderActivities.map((_, index) => (
                            // Mimic individual activity item structure
                            <div key={index} className="bg-gray-300 dark:bg-gray-600/80 p-3 rounded-md shadow-sm">
                                {/* Mimic activity text line 1 */}
                                <div className="h-4 bg-gray-400 dark:bg-gray-500 rounded w-full"></div>
                                {/* Mimic activity text line 2 (optional timestamp placeholder) */}
                                <div className="h-3 bg-gray-400 dark:bg-gray-500 rounded w-1/3 mt-2 ml-auto"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;