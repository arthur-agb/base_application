// src/pages/user/profile/UserProfile.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';

// Import the new component
import ConfettiLauncher from '../../../components/animations/ConfettiLauncher';

import {
  fetchCurrentAuthUserProfile,
  updateSelfProfile,
  UserProfileSkeleton,
} from '../';

import {
  disableTwoFactor,
  selectAuthLoading,
  selectAuthError,
  SetupTwoFactorModal,
  selectTenant,
} from '../../auth/';

import tenantService from '../../tenants/services/tenantService';
import CreateCompanyModal from '../../tenants/components/CreateCompanyModal';
import { MdBusiness, MdAdd } from 'react-icons/md';


import '../../../../output.css';

// Define preference constants (matching potential Prisma Enum values)
const THEMES = { LIGHT: 'LIGHT', DARK: 'DARK', SYSTEM: 'SYSTEM' };


const UserProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // State for the 2FA modal
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  // State for confetti animation
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Global theme context
  const { theme: currentThemeSetting, setTheme: setGlobalTheme } = useTheme();

  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);

  // --- Redux State ---
  // authUser contains session-specific data like roles and company info
  const { user: authUser, loading: authLoading, error: authError } = useSelector((state) => state.auth);
  // currentUser contains the detailed user profile data from the 'users' table
  const { currentUser, loading: profileLoading, error: profileError } = useSelector((state) => state.users);

  // --- Local Component State ---
  const [selectedTheme, setSelectedTheme] = useState(currentThemeSetting ? currentThemeSetting.toUpperCase() : THEMES.SYSTEM);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const isDisabling2FA = useSelector(selectAuthLoading);

  // --- Refs ---
  const disableButtonRef = useRef(null);
  const profileFetchedForUserId = useRef(null);

  // Effect to fetch the authenticated user's profile when they log in
  useEffect(() => {
    // Only fetch if we have an authenticated user and haven't fetched for them yet
    if (!authLoading && authUser?.id) {
      if (profileFetchedForUserId.current !== authUser.id || !currentUser || currentUser.id !== authUser.id) {
        dispatch(fetchCurrentAuthUserProfile());
        profileFetchedForUserId.current = authUser.id;
      }
    } else if (!authUser && profileFetchedForUserId.current) {
      // Clear the ref if the user logs out
      profileFetchedForUserId.current = null;
    }
  }, [dispatch, authLoading, authUser, currentUser]);

  // Effect to sync the component's theme state with the user's settings from the database
  useEffect(() => {
    if (currentUser) {
      const userThemePref = currentUser.settings?.theme;
      if (userThemePref) {
        setSelectedTheme(userThemePref);
        // Update the global theme context if it's out of sync
        if (currentThemeSetting !== userThemePref.toLowerCase()) {
          setGlobalTheme(userThemePref.toLowerCase());
        }
      } else {
        // Fallback to the theme from context if no setting is saved for the user
        const contextTheme = currentThemeSetting ? currentThemeSetting.toUpperCase() : THEMES.SYSTEM;
        setSelectedTheme(contextTheme);
      }
    }
  }, [currentUser, currentThemeSetting, setGlobalTheme]);

  // --- 2FA Handlers ---
  const handleEnable2FA = () => {
    setIs2FAModalOpen(true);
  };

  const handle2FASetupSuccess = () => {
    dispatch(fetchCurrentAuthUserProfile()); // Re-fetch user profile to get updated 2FA status
    setTriggerConfetti(true);
    setIs2FAModalOpen(false);
  };

  const handleDisable2FA = () => {
    const password = prompt("To disable 2FA, please enter your password for verification:");
    if (password) {
      dispatch(disableTwoFactor(password))
        .unwrap()
        .then(() => {
          alert('Two-Factor Authentication has been disabled.');
          dispatch(fetchCurrentAuthUserProfile()); // Re-fetch to update status
        })
        .catch((err) => {
          // The error object from rejectWithValue should have a message property
          alert(`Failed to disable 2FA: ${err.message || err}`);
        });
    }
  };

  const handleCreateCompany = async (companyData) => {
    try {
      await tenantService.createCompany(companyData);
      // Re-fetch user session/profile to include the new company
      // Use unwrap to ensure the state update is complete before proceeding
      await dispatch(fetchCurrentAuthUserProfile()).unwrap();
      alert('Company created successfully!');
    } catch (error) {
      throw error; // Rethrow to let the modal handle the error display
    }
  };

  // --- Theme Handler ---
  // This function is still needed to update the user's theme preference
  const handleThemeChange = useCallback(async (newThemeDbValue) => {
    setIsSavingTheme(true);
    try {
      const updatePayload = {
        settings: { theme: newThemeDbValue }
      };

      // The updateSelfProfile thunk now only handles settings updates from this page
      await dispatch(updateSelfProfile(updatePayload)).unwrap();

    } catch (error) {
      alert(`Failed to save theme preference: ${error?.message || 'Please try again.'}`);
    } finally {
      setIsSavingTheme(false);
    }
  }, [dispatch]);

  // --- Render Logic ---
  if (authLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Authenticating...</div>;
  if (!authUser) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Please log in to view your profile.</div>;

  // Show skeleton loader only if we don't have the user data yet.
  // This prevents the page from flashing a skeleton when a background update (like sidebar toggle) occurs.
  const showSkeleton = !currentUser;
  if (showSkeleton && !profileError) {
    return <UserProfileSkeleton />;
  }

  const effectiveError = profileError || authError;
  if (effectiveError) {
    const errorMessage = (typeof effectiveError === 'object' && effectiveError !== null && effectiveError.message)
      ? effectiveError.message
      : (typeof effectiveError === 'string' ? effectiveError : 'Could not load profile.');
    return <div className="p-8 text-center text-red-600 dark:text-red-400">Error: {errorMessage}</div>;
  }

  return (
    <div className="w-full relative">
      {/* 2FA Modal */}
      <SetupTwoFactorModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        onSuccess={handle2FASetupSuccess}
      />

      {/* Confetti animation on successful 2FA setup */}
      {triggerConfetti && authUser.isTwoFactorEnabled && (
        <ConfettiLauncher targetRef={disableButtonRef} />
      )}

      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 self-start">
        My Profile & Settings
      </h1>
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- Left Column: User and Company Info --- */}
        <div className="lg:col-span-1 space-y-6">
          {/* Avatar and Basic Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            {currentUser.avatarUrl ? (
              <img
                alt={currentUser.displayName || 'User Avatar'}
                src={currentUser.avatarUrl}
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/128x128/e2e8f0/64748b?text=N/A"; }}
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-2 border-gray-300 dark:border-gray-600"
              />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-300 dark:bg-gray-600 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                <span className="text-4xl text-gray-500 dark:text-gray-400">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1 break-words">{currentUser.displayName || 'Username Not Set'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 break-all">{currentUser.email || 'Email Not Set'}</p>
          </div>

          {/* Company Information Card - Always renders if the user has any potential context */}
          {(currentUser?.companies?.length > 0 || !currentUser?.activeCompanyId) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">Company Information</h3>

              {/* Workspace Selector Dropdown - Always visible to allow switching to Personal Workspace */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Active Workspace
                </label>
                <select
                  value={currentUser.activeCompanyId || ''}
                  onChange={(e) => {
                    const companyId = e.target.value || null;
                    // Note: selectTenant handles null/empty as switching to Personal Workspace
                    dispatch(selectTenant({ companyId }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Personal Workspace</option>
                  {currentUser?.companies?.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show message when in personal workspace */}
              {!currentUser.activeCompanyId ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <MdBusiness className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        You're in your Personal Workspace
                      </h4>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        <p>
                          Switch to a company workspace using the dropdown above to view your company role and access team features.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Companies</h4>
                    <ul className="mt-2 space-y-2">
                      {currentUser.companies.map((company) => (
                        <li key={company.id} className="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200 p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                          <span>{company.name}</span>
                          {company.id === currentUser.activeCompanyId && (
                            <span className="text-xs bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                              Active
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Global Role:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-semibold capitalize">{currentUser.role?.toLowerCase() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Company Role:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-semibold capitalize">{currentUser.companyRole?.toLowerCase() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600 dark:text-gray-400">Member Since:</span>
                      <span className="text-gray-800 dark:text-gray-200 font-semibold">
                        {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>

                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setIsCreateCompanyModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <MdAdd className="w-5 h-5" />
                        New Workspace
                      </button>
                      {currentUser.companyRole === 'OWNER' && (
                        <button
                          onClick={() => navigate('/workspace/settings')}
                          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                          <MdBusiness className="w-5 h-5" />
                          Manage Settings
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {(!currentUser?.companies || currentUser.companies.length === 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center space-y-4">
              <MdBusiness className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Company Found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You are not currently part of any company. Create one to start collaborating.
              </p>
              <button
                onClick={() => setIsCreateCompanyModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <MdAdd className="w-5 h-5" />
                Create Company
              </button>
            </div>
          )}
        </div>

        {/* --- Right Column: Settings --- */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">

            {/* Appearance Section */}
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <div className="flex items-center space-x-3">
                  {Object.values(THEMES).map((themeDbValue) => (
                    <button
                      key={themeDbValue}
                      onClick={() => handleThemeChange(themeDbValue)}
                      disabled={selectedTheme === themeDbValue || isSavingTheme}
                      className={`px-4 py-2 text-sm rounded border capitalize transition-colors duration-150 ease-in-out ${selectedTheme === themeDbValue ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-200 ring-1 ring-indigo-500' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'} disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200 dark:disabled:bg-gray-500 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:border-gray-300 dark:disabled:border-gray-600 disabled:ring-0`}
                    >
                      {themeDbValue.toLowerCase()}
                    </button>
                  ))}
                  {isSavingTheme && <span className="text-xs text-gray-500 dark:text-gray-400 italic ml-2">Saving...</span>}
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Two-Factor Authentication
              </h2>
              <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">Enable Two-Factor Authentication</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Add an additional layer of security to your account.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <div className="ml-4 flex items-center flex-shrink-0">
                    <span className={`mr-3 text-sm font-medium ${authUser.isTwoFactorEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {isDisabling2FA ? 'Disabling...' : (authUser.isTwoFactorEnabled ? 'Enabled' : 'Disabled')}
                    </span>
                    <button
                      ref={disableButtonRef}
                      type="button"
                      className={`${authUser.isTwoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50`}
                      role="switch"
                      aria-checked={authUser.isTwoFactorEnabled}
                      onClick={!isDisabling2FA ? (authUser.isTwoFactorEnabled ? handleDisable2FA : handleEnable2FA) : undefined}
                      disabled={isDisabling2FA}
                    >
                      <span
                        aria-hidden="true"
                        className={`${authUser.isTwoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </button>
                  </div>
                </div>
                {authError && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400">{authError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateCompanyModal
        isOpen={isCreateCompanyModalOpen}
        onClose={() => setIsCreateCompanyModalOpen(false)}
        onCreate={handleCreateCompany}
      />
    </div>
  );
};

export default UserProfile;