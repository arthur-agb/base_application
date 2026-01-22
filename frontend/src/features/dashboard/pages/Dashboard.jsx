import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchDashboard,
  DashboardSkeleton,
} from '../'; // Assuming index file exports these

const Dashboard = () => {
  const dispatch = useDispatch();
  
  // MODIFIED: Selector now gets the entire dashboard state object
  const { data, loading, error } = useSelector(state => state.dashboard);
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    if (loading) {
      return <DashboardSkeleton />;
    }

    if (error) {
      return (
        <div className="w-full max-w-lg rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex">
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error Loading Dashboard</h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-200">
                        <p>{typeof error === 'string' ? error : 'An unexpected error occurred. Please try again later.'}</p>
                    </div>
                </div>
            </div>
        </div>
      );
    }

    // Main dashboard content grid
    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Projects Overview Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Your Projects
            </h2>
            {/* MODIFIED: Using the pre-calculated count from the backend */}
            <p className="text-3xl sm:text-4xl font-bold text-gray-700 dark:text-gray-300">
              {data.counts?.projects ?? 0}
            </p>
          </div>

          {/* Tasks Overview Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Issues Assigned to You
            </h2>
            {/* MODIFIED: Using the pre-calculated count from the backend */}
            <p className="text-3xl sm:text-4xl font-bold text-gray-700 dark:text-gray-300">
              {data.counts?.assignedIssues ?? 0}
            </p>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:col-span-2 lg:col-span-1">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Recent Activity
            </h2>
            {/* MODIFIED: Now correctly checks data.recentActivity */}
            {data.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {/* MODIFIED: The mapping now handles the full issue object */}
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md shadow-sm">
                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                      <span className="font-semibold">{activity.reporter?.name || 'Someone'}</span> updated issue{' '}
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activity.key}</span>: "{activity.title}"
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      {new Date(activity.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' '}
                      {new Date(activity.updatedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
               <p className="text-sm text-gray-500 dark:text-gray-400 italic">No recent activity to display.</p>
            )}
          </div>
        </div>
    );
  };

  return (
    <div
        className={`transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="flex flex-col items-center md:items-start justify-start w-full">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;