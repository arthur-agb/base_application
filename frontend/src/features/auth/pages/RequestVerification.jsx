import React from 'react';
import { Link } from 'react-router-dom';

const RequestVerificationPage = () => (
    <div className="p-8 text-center bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col justify-center items-center">
        <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-lg shadow-xl w-full max-w-md">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Email Verification Required</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                A verification message has been sent to your email address. Please check your inbox (and spam folder) and follow the instructions to activate your account.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
                If you need to enter a code manually, please go to the <Link to="/verify-email" className="text-indigo-600 hover:underline dark:text-indigo-400">verification page</Link>.
            </p>
            <button className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 mb-4">
                Resend Verification Email
            </button>
            <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
                <Link to="/login?logout=true" className="font-medium text-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400">
                    Back to Login
                </Link>
            </p>
        </div>
    </div>
);

export default RequestVerificationPage;