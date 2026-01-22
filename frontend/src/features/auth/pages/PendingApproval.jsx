import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
// Assuming you have a logout action in your authSlice
// import { logout } from '../../store/authSlice'; // Path might vary

// --- Configuration (Ideally, this would come from a config file or environment variables) ---
const ADMIN_CONTACT_EMAIL = 'arthur@agbintegration.com';

export default function PendingApproval() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Dispatch a logout action if you have one
    // For example: dispatch(logout());
    // Then navigate to the login page or home page
    console.log('[PendingApproval] User logging out.');
    // Assuming you have a logout action that clears user state
    // dispatch(logoutAction()).then(() => navigate('/login'));
    navigate('/login'); // Or wherever your public landing page is
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-100 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <div>
          <img
            alt="AGB Integration"
            src="/mm_icon.svg" // Consistent icon path
            className="mx-auto h-12 w-auto" // Consistent icon styling
          />
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Momentum Manager
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            by AGB Integration
          </p>
          <h3 className="mt-4 text-center text-xl font-semibold text-gray-800 dark:text-gray-200">
            Account Pending Approval
          </h3>
        </div>

        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Your account has been successfully verified and is now awaiting admin approval.
              </p>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                You will be notified once your account is active. If you have any questions or believe this is an error, please contact our support team at{' '}
                <a href={`mailto:${ADMIN_CONTACT_EMAIL}`} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  {ADMIN_CONTACT_EMAIL}
                </a>.
              </p>
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleLogout}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Logout
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          You can close this page. We'll email you once your account is approved.
        </p>
      </div>
    </div>
  );
}