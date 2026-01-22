// src/components/layout/components/TenantSelector.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { MdBusiness, MdCheck, MdExpandMore } from 'react-icons/md';
import { selectTenant } from '../../../features/auth/slices/authSlice';
import { Logger } from '../../../utils';

const TenantSelector = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Effect to handle closing the dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  // Early return if there's no user or no companies to select from.
  if (!user?.companies || user.companies.length === 0) {
    return null;
  }

  const activeCompany = user.companies.find(c => c.id === user.activeCompanyId);
  const otherCompanies = user.companies.filter(c => c.id !== user.activeCompanyId);

  const handleSelectTenant = async (companyId) => {
    if (companyId === user.activeCompanyId) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(false);
    try {
      await dispatch(selectTenant({ companyId })).unwrap();
      Logger.info(`Switched to tenant ID: ${companyId}`);
      // Redirect to projects list to clear any stale project/board context
      navigate('/projects');
    } catch (err) {
      Logger.error('Failed to switch tenant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative hidden sm:inline-block text-left ml-4 flex-shrink-0">
      <div>
        <button
          type="button"
          // --- MODIFICATION: Updated classes for hover effect ---
          className="inline-flex items-center justify-center w-full rounded-md border border-transparent px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 transition-shadow duration-150 ease-in-out hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
          id="options-menu"
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
        >
          <MdBusiness className="mr-2 text-gray-500 dark:text-gray-400" size={18} />
          <span className="truncate max-w-[150px]">
            {isLoading ? 'Switching...' : (activeCompany?.name || 'Personal Workspace')}
          </span>
          <MdExpandMore className="ml-2 -mr-1 h-5 w-5" />
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Switch Workspace
            </div>

            {/* Personal Workspace Option */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleSelectTenant(null);
              }}
              className={`flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${!user.activeCompanyId ? 'bg-gray-50 dark:bg-gray-800/50 cursor-default' : 'text-gray-700 dark:text-gray-200'}`}
              role="menuitem"
            >
              <span className={!user.activeCompanyId ? 'font-semibold' : ''}>Personal Workspace</span>
              {!user.activeCompanyId && <MdCheck className="text-indigo-600 dark:text-indigo-400" />}
            </a>

            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>

            {user.companies.map((company) => (
              <a
                key={company.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSelectTenant(company.id);
                }}
                className={`flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 ${user.activeCompanyId === company.id ? 'bg-gray-50 dark:bg-gray-800/50 cursor-default' : 'text-gray-700 dark:text-gray-200'}`}
                role="menuitem"
              >
                <span className={`truncate ${user.activeCompanyId === company.id ? 'font-semibold' : ''}`}>{company.name}</span>
                {user.activeCompanyId === company.id && <MdCheck className="text-indigo-600 dark:text-indigo-400" />}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSelector;
