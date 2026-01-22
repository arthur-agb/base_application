import React from 'react';
import { Link } from 'react-router-dom';

const NotAuthorized = () => (
    <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col justify-center items-center">
        <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-lg shadow-xl w-full max-w-md">
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">403 - Not Authorized</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
                You do not have the necessary permissions to access this page.
            </p>
            <Link to="/dashboard" className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800">
                Go to Dashboard
            </Link>
        </div>
    </div>
);

export default NotAuthorized;