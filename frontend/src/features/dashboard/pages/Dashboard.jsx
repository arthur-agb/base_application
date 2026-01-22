import React from 'react';
import { useSelector } from 'react-redux';

const Dashboard = () => {
  const { user } = useSelector(state => state.auth);
  const { currentUser } = useSelector(state => state.users);

  // Combine auth user data with detailed profile data if available
  const activeUser = { ...user, ...currentUser };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Welcome back, {activeUser?.displayName || activeUser?.name || 'User'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Welcome to your new landing page.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;