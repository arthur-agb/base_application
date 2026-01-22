import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const BreadcrumbNav = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // Don't show breadcrumbs on dashboard since it's the home
    if (location.pathname === '/' || location.pathname === '/dashboard') {
        return null;
    }

    return (
        <nav className="-mt-4 px-0 pb-4 flex items-center flex-wrap gap-y-2 gap-x-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 select-none">
            <Link to="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">
                <Home size={14} />
            </Link>
            {pathnames.length > 0 && <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />}
            {pathnames.map((name, index) => {
                const isLast = index === pathnames.length - 1;

                return (
                    <div key={name} className="flex items-center gap-1.5">
                        <span className="capitalize font-semibold text-gray-700 dark:text-gray-300">
                            {name}
                        </span>
                        {!isLast && <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />}
                    </div>
                );
            })}
        </nav>
    );
};

export default BreadcrumbNav;
