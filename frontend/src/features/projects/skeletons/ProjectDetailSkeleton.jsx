// ProjectDetailSkeleton.jsx
import React from 'react';
import '../../../../output.css';

const ProjectDetailSkeleton = () => {
    // Increase placeholder members for better visual alignment
    const placeholderMembers = Array.from({ length: 4 });

    return (
        // Main container with padding and pulse animation
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">

            {/* Mimic Header Section - matching flex-wrap and gap */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                {/* Title Placeholder - slightly larger */}
                <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-2/5"></div>
                {/* Button Placeholder - matching size of 'Edit Project' button */}
                <div className="h-9 bg-gray-300 dark:bg-gray-700 rounded w-28"></div>
            </div>

            {/* Mimic Main Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                {/* Mimic Project Description Section (Left) */}
                <div className="md:col-span-8 col-span-12">
                    {/* Card Styling */}
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6">
                        {/* Section Title - matching h2 style/margin */}
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-3"></div>
                        {/* Description Placeholder - more lines to mimic min-height */}
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                        </div>
                        {/* No save button placeholder - only shown in edit mode */}
                    </div>
                </div>

                {/* Mimic Project Actions Section (Right) */}
                <div className="md:col-span-4 col-span-12 space-y-6">
                    {/* Actions Card */}
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6">
                        {/* Section Title - matching h2 style/margin */}
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
                        {/* View Board Button Placeholder - matching size/style */}
                        <div className="h-10 bg-gray-400 dark:bg-gray-500 rounded w-full"></div>
                    </div>
                    {/* No Change Lead placeholder - only shown in edit mode */}
                </div>

                {/* Mimic Project Lead Section (Full Width) */}
                <div className="col-span-12">
                    {/* Card Styling */}
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6">
                        {/* Section Title - matching h2 style/margin */}
                        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-3"></div>
                        {/* Lead Name/Email Line Placeholder - matching text-sm style */}
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                </div>

                {/* Mimic Project Members Section (Full Width) */}
                <div className="col-span-12">
                    {/* Card Styling */}
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6">
                         {/* Members Header - mimicking flex layout */}
                         <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                             {/* Section Title Placeholder */}
                             <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                             {/* Member Count Placeholder */}
                             <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                         </div>
                         {/* No Add Member form placeholder - only shown in edit mode */}

                         {/* Member List Placeholders - mimicking li structure */}
                         <div className="space-y-3"> {/* Increased spacing slightly */}
                             {placeholderMembers.map((_, index) => (
                                 <div key={index} className="flex justify-between items-center">
                                     {/* Name/Email Placeholder */}
                                     <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/5"></div>
                                     {/* Optional: Placeholder for (Lead) tag or Remove button, small */}
                                     <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>

            </div> {/* End Main Grid */}
        </div> // End Main Container
    );
};

export default ProjectDetailSkeleton;