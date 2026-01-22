// ProjectListSkeleton.jsx
import React from 'react';
import '../../../../output.css';

const ProjectListSkeleton = () => {
  // Number of placeholder project cards to show (excluding the 'Create' card)
  const placeholderProjectsCount = 5;
  const placeholderProjects = Array.from({ length: placeholderProjectsCount });

  return (
    // Removed max-width, padding etc. from outer container to better match ProjectList.jsx structure
    // Added animate-pulse here
    <div className="animate-pulse">
      {/* Removed the separate header mimic, as ProjectList.jsx doesn't have one internally */}

      {/* Mimic Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Mimic Create New Project Card */}
        <div className="col-span-1">
          {/* Mimic Card Structure */}
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow overflow-hidden flex flex-col h-full">
             {/* Mimic Card Body */}
            <div className="p-6 flex-grow space-y-4">
               {/* Mimic Title */}
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              {/* Mimic Input 1 */}
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              {/* Mimic Input 2 */}
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              {/* Mimic Submit Button (using indigo-like color hint) */}
              <div className="h-9 bg-indigo-300 dark:bg-indigo-800 rounded w-full mt-1"></div>
            </div>
            {/* Note: ProjectList's create card doesn't have a footer */}
          </div>
        </div>

        {/* Mimic Existing Project Cards */}
        {placeholderProjects.map((_, index) => (
          <div className="col-span-1" key={index}>
            {/* Mimic Card Structure */}
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow overflow-hidden flex flex-col h-full">
               {/* Mimic Project Details Section */}
              <div className="p-6 flex-grow">
                {/* Mimic Project Name */}
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                {/* Mimic Project Key */}
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
                {/* Mimic Project Description (3 lines) */}
                <div className="space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                </div>
              </div>
              {/* Mimic Footer Section with Action Buttons */}
              <div className="px-6 py-4 bg-gray-300 dark:bg-gray-700 border-t border-gray-400 dark:border-gray-600">
                 {/* Mimic Flex container for buttons */}
                <div className="flex items-center justify-start space-x-4">
                   {/* Mimic Button 1 ('Details') */}
                   <div className="h-5 bg-gray-400 dark:bg-gray-600 rounded w-1/4"></div>
                   {/* Mimic Button 2 ('Board') */}
                   <div className="h-5 bg-gray-400 dark:bg-gray-600 rounded w-1/4"></div>
                 </div>
              </div>
            </div>
          </div>
        ))}

      </div> {/* End Main Grid */}
    </div> // End Main Container
  );
};

export default ProjectListSkeleton;