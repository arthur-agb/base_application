// src/components/skeletons/features/boards/BoardViewSkeleton.jsx
import React from 'react';
import '../../../../../output.css';

const BoardViewSkeleton = () => {
    // Define a number of placeholder columns and items for visual representation
    const placeholderColumns = Array.from({ length: 4 }); // Simulate 4 columns
    const placeholderIssuesPerColumn = Array.from({ length: 3 }); // Simulate 3 issues per column

    return (
        // Main container with pulse animation
        <div className="flex flex-col min-w-0 animate-pulse">

            {/* Mimic Board Header Section */}
            <div className="p-4 border-b border-gray-300 dark:border-gray-600 flex-shrink-0 bg-gray-200 dark:bg-gray-700 shadow-sm space-y-2">
                 {/* Top Row: Project/Board Titles Placeholders */}
                 <div>
                    {/* Project Name Placeholder */}
                    <div className="h-7 bg-gray-400 dark:bg-gray-600 rounded w-1/3 mb-1"></div>
                    {/* Board Name Placeholder */}
                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-1/4"></div>
                 </div>

                 {/* Bottom Row: Filters Placeholders */}
                 <div className="flex items-center space-x-4">
                    {/* Assignee Filter Placeholder */}
                     <div>
                        <div className="h-9 w-40 bg-gray-400 dark:bg-gray-600 rounded-md"></div> {/* Mimics select element size */}
                    </div>
                    {/* Placeholder for potential future filters */}
                    {/* <div className="h-9 w-32 bg-gray-400 dark:bg-gray-600 rounded-md"></div> */}
                 </div>
            </div>

            {/* Mimic Board Content Area (Horizontal Scroll) */}
            <div className="flex flex-grow space-x-4 overflow-x-hidden p-4 bg-gray-100 dark:bg-gray-900">
                {placeholderColumns.map((_, colIndex) => (
                    // Mimic Column Wrapper
                    <div key={`col-skel-${colIndex}`} className="flex-shrink-0 w-72 min-h-[60dvh] sm:h-[600px] sm:w-76 bg-gray-200 dark:bg-gray-800 rounded-lg shadow flex flex-col h-full overflow-hidden">

                        {/* Mimic Column Header */}
                        <div className="px-4 py-3 border-b border-gray-300 dark:border-gray-600 flex-shrink-0 flex justify-between items-center">
                            {/* Column Title Placeholder */}
                            <div className="h-5 bg-gray-400 dark:bg-gray-600 rounded w-1/2"></div>
                             {/* Issue Count Placeholder */}
                            <div className="h-5 w-8 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                        </div>

                        {/* Mimic Droppable Area */}
                        <div className="flex-grow min-h-[60px] p-3 overflow-y-auto space-y-3">
                            {/* Mimic Draggable Issue Cards */}
                            {placeholderIssuesPerColumn.map((_, issueIndex) => (
                                <div
                                    key={`issue-skel-${colIndex}-${issueIndex}`}
                                    className="bg-gray-300 dark:bg-gray-700 rounded-md shadow-sm p-3 border border-gray-400 dark:border-gray-600"
                                >
                                    {/* Issue Title Placeholder */}
                                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-gray-400 dark:bg-gray-600 rounded w-5/6"></div>
                                    {/* Assignee Placeholder */}
                                    <div className="mt-2 h-3 bg-gray-400 dark:bg-gray-600 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>

                        {/* Mimic Add Issue Button Area */}
                        <div className="mt-auto p-3 border-t border-gray-300 dark:border-gray-600 flex-shrink-0 bg-gray-300 dark:bg-gray-700/50">
                            <div className="h-9 w-full bg-gray-400 dark:bg-gray-600 rounded-md"></div> {/* Mimics "+ Add Issue" button */}
                        </div>
                    </div> // End Column Wrapper Mimic
                ))}
            </div> {/* End Horizontal Scroll Mimic */}
        </div> // End Main Container Mimic
    );
};

export default BoardViewSkeleton;