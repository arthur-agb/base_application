// src/components/Layout/BurgerMenuButton.jsx
import React from 'react';
import { Squash as Hamburger } from 'hamburger-react'

import {
    HEADER_HEIGHT_STRING,
    HEADER_HEIGHT_NUMBER,
} from '../config/layoutConstants';

const BurgerMenuButton = ({ onClick, isSidebarOpen, isMobile }) => {
    const buttonStyle = {
        width: HEADER_HEIGHT_STRING,
        height: HEADER_HEIGHT_STRING,
    };

    const borderClass = (isSidebarOpen && !isMobile) ? '' : 'border-r border-gray-200 dark:border-gray-700';

    // Calculate dynamic icon size
    // Aim for about 40-45% of the button's height, with a minimum size.
    const iconSize = Math.max(16, Math.floor(HEADER_HEIGHT_NUMBER * 0.35));

    return (
        <button
            onClick={onClick}
            className={`fixed top-0 left-0 z-[60] flex items-center justify-center
                       bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-100
                       dark:text-gray-300 dark:hover:bg-gray-700
                       border-b border-gray-200 dark:border-gray-700
                       ${borderClass}
                       transition-colors duration-300 ease-in-out`}
            style={buttonStyle}
            aria-label="Toggle sidebar"
        >
            <Hamburger size={iconSize} toggled={isSidebarOpen} />
        </button>
    );
};

export default BurgerMenuButton;