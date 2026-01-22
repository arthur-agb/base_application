// src/components/skeletons/features/users/UserProfileSkeleton.jsx
import React from 'react';
import '../../../../output.css'; // Ensure Tailwind is imported

const UserProfileSkeleton = () => {
  return (
    // Use flex layout similar to UserProfile to ensure consistent alignment
    <div className="flex flex-col items-center md:items-start justify-start w-full animate-pulse"> {/* Main Container */}
      {/* Mimic Page Title */}
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 md:w-1/4 mb-6 self-start"></div>

      {/* Mimic Main content grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6"> {/* Grid */}

        {/* Mimic Profile Picture Section (md:col-span-4) */}
        <div className="md:col-span-4 col-span-12"> {/* Picture Col */}
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6 text-center"> {/* Picture Card */}
            {/* Mimic Avatar */}
            <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-300 dark:bg-gray-600 border-2 border-gray-300 dark:border-gray-600"></div>
             {/* Mimic Name */}
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
             {/* Mimic Email */}
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
          </div> {/* End Picture Card */}
        </div> {/* End Picture Col */}

        {/* Mimic Profile Edit Form Section (md:col-span-8) */}
        <div className="md:col-span-8 col-span-12"> {/* Form Col */}
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6 space-y-6"> {/* Form Card */}
            {/* Mimic Username Field */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div> {/* Label */}
              <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-full"></div> {/* Input */}
            </div>
             {/* Mimic Email Field (Readonly) */}
             <div className="space-y-2">
               <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div> {/* Label */}
               <div className="h-10 bg-gray-400 dark:bg-gray-600 rounded w-full opacity-70"></div> {/* Disabled Input */}
             </div>
            {/* Mimic Bio Field */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div> {/* Label */}
              <div className="h-20 bg-gray-300 dark:bg-gray-600 rounded w-full"></div> {/* Textarea */}
            </div>
            {/* Mimic Submit Button */}
            <div className="h-10 bg-indigo-300 dark:bg-indigo-800 rounded w-full"></div>
          </div> {/* End Form Card */}
        </div> {/* End Form Col */}

        {/* Mimic Appearance Preferences Section (md:col-span-8 md:col-start-5) */}
        {/* This section was added based on UserProfile.jsx */}
        <div className="md:col-span-8 md:col-start-5 col-span-12"> {/* Appearance Col */}
           <div className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6"> {/* Appearance Card */}
              {/* Mimic Section Title */}
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
              <div className="space-y-6"> {/* Appearance Space */}

                {/* Mimic Theme Setting */}
                <div className="space-y-2">
                   <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/5 mb-2"></div> {/* Label */}
                   <div className="flex items-center space-x-3"> {/* Button Group */}
                      <div className="h-9 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div> {/* Button 1 */}
                      <div className="h-9 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div> {/* Button 2 */}
                      <div className="h-9 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div> {/* Button 3 */}
                   </div>
                </div>

                {/* Mimic Font Size Setting */}
                <div className="space-y-2">
                   <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/5 mb-2"></div> {/* Label */}
                   <div className="flex items-center space-x-3"> {/* Button Group */}
                      <div className="h-9 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div> {/* Button 1 */}
                      <div className="h-9 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div> {/* Button 2 */}
                      <div className="h-9 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div> {/* Button 3 */}
                   </div>
                </div>

                 {/* Mimic High Contrast Mode */}
                <div className="space-y-2">
                   <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2"></div> {/* Label */}
                   <div className="flex items-start"> {/* Checkbox Wrapper */}
                      <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded mr-3"></div> {/* Checkbox */}
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/5"></div> {/* Checkbox Label */}
                   </div>
                </div>

              </div> {/* End Appearance Space */}
           </div> {/* End Appearance Card */}
        </div> {/* End Appearance Col */}

        {/* Remove or Keep Mimic Recent Activity Section - Adjust as needed */}
        {/* If UserProfile.jsx doesn't have this, you might remove it from the skeleton too. */}
        {/*
        <div className="col-span-12">
           <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6">
             <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
             <div className="space-y-3">
               <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
               <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
             </div>
           </div>
        </div>
        */}

      </div> {/* End Main Grid */}
    </div> // End Main Container
  );
};

export default UserProfileSkeleton;