// src/components/Layout/components/Header.jsx
import React from 'react';
import { 
    COLLAPSED_WIDTH,
    HEADER_TITLE_TEXT_CLASS,
} from '../config/layoutConstants';

import TenantSelector from './TenantSelector'; // Import the new component

/**
 * The Header component.
 * It no longer accepts `activeCompanyName` as a prop, as the TenantSelector
 * now handles its own state logic by subscribing to the Redux store.
 */
const Header = ({ pageTitle, headerStyle, isMobile, isSidebarOpen }) => {
    const titlePaddingLeftValue = (isMobile && !isSidebarOpen)
        ? COLLAPSED_WIDTH + 10
        : 16;

    const headerInnerDivStyle = {
        paddingLeft: `${titlePaddingLeftValue}px`,
    };

    return (
        <header
            className="fixed top-0 right-0 z-30 bg-white shadow-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            style={headerStyle}
        >
            <div
                className="flex h-full items-center justify-between px-4 sm:px-6"
                style={headerInnerDivStyle}
            >

                <div className={`flex-1 font-semibold text-gray-900 dark:text-white truncate ${HEADER_TITLE_TEXT_CLASS}`}>
                    {pageTitle}
                </div>

                {/* Replace the old static text display with the new interactive TenantSelector component */}
                <TenantSelector />
            </div>
        </header>
    );
};

export default Header;
