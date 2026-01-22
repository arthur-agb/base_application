// src/components/Layout/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { MdLogout } from 'react-icons/md';
import SimpleTooltip from '../../common/SimpleTooltip';

import {
    COLLAPSED_WIDTH,
    DRAWER_WIDTH,
    SIDEBAR_ICON_SIZE,
    SIDEBAR_TEXT_CLASS,
    HEADER_HEIGHT_STRING,
    HEADER_HEIGHT_NUMBER,
} from '../config/layoutConstants';

const Sidebar = ({
    isSidebarOpen,
    isMobile,
    primaryMenuItems,
    managementMenuItems,
    handleLogout,
    toggleSidebar,
    sidebarStyle,
    sidebarIsPhysicallyOpen,
}) => {

    const sidebarItemNavLinkClass = ({ isActive }) =>
        `flex h-[32px] rounded-md font-medium group relative overflow-hidden transition-colors duration-200 justify-center ease-in-out w-full ${SIDEBAR_TEXT_CLASS} ${isActive
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' // Active styles
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' // Inactive styles
        }`;

    const logoutButtonBaseClass = `flex w-full h-[32px] rounded-md font-medium group relative overflow-hidden transition-colors duration-200 ease-in-out text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 ${SIDEBAR_TEXT_CLASS}`;

    const navTextZoneStyle = (isOpen) => ({
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        paddingLeft: isOpen ? '2px' : '0px',
        opacity: isOpen ? 1 : 0,
        width: isOpen ? `calc(${DRAWER_WIDTH}px - ${COLLAPSED_WIDTH}px)` : '0px',
        transition: `opacity 0.2s ease-in-out ${isOpen ? '0.1s' : '0s'}, width 0.3s ease-in-out, padding-left 0.3s ease-in-out`,
        pointerEvents: isOpen ? 'auto' : 'none',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    });

    const isTextVisible = isSidebarOpen;

    const renderMenuItems = (items) => {
        return items.map((item) => (
            <li key={item.text}>
                <SimpleTooltip content={item.text} enabled={!isTextVisible && !isMobile}>
                    <NavLink
                        to={item.path}
                        end
                        className={sidebarItemNavLinkClass}
                        onClick={isMobile && isSidebarOpen ? toggleSidebar : undefined}
                    >
                        <div
                            className="relative flex-shrink-0 flex items-center justify-center"
                            style={{ width: `calc(${COLLAPSED_WIDTH}px - 0.5rem)`, height: '100%' }}
                        >
                            {item.icon}

                            {item.indicator && (
                                <span
                                    className={`absolute font-bold pointer-events-none ${item.indicator.text === 'A'
                                            ? 'text-red-600'
                                            : 'text-blue-500'
                                        }`}
                                    style={{ top: 2, left: 7, fontSize: '0.7rem' }}
                                >
                                    {item.indicator.text}
                                </span>
                            )}
                        </div>
                        <div style={navTextZoneStyle(isTextVisible)}>
                            {item.text}
                        </div>
                    </NavLink>
                </SimpleTooltip>
            </li>
        ));
    };

    return (
        <aside
            className={`flex flex-col flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${!sidebarIsPhysicallyOpen ? 'border-none' : ''}`}
            style={sidebarStyle}
            aria-hidden={isMobile && !isSidebarOpen}
        >
            {/* Sidebar Header/Logo Area */}
            <div
                className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 flex items-center justify-start"
                style={{
                    height: HEADER_HEIGHT_STRING,
                    paddingLeft: isTextVisible ? `${HEADER_HEIGHT_NUMBER + 4}px` : undefined,
                    overflow: 'hidden',
                }}
            ></div>

            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
                {/* Primary Navigation Area (Top Section) */}
                <nav>
                    <ul className="space-y-1 p-1">
                        {renderMenuItems(primaryMenuItems)}
                    </ul>
                </nav>

                {/* Spacer div pushes everything below it to the bottom */}
                <div className="flex-grow" />

                {managementMenuItems.length > 0 && (
                    <nav>
                        <ul className="space-y-1 p-1">
                            {renderMenuItems(managementMenuItems)}
                        </ul>
                    </nav>
                )}
            </div>

            {/* Logout Area (remains at the absolute bottom) */}
            <div className={`flex-shrink-0 ${sidebarIsPhysicallyOpen ? 'border-t border-gray-200 dark:border-gray-700' : 'border-none'} p-1 h-[40px]`}>
                {sidebarIsPhysicallyOpen && (
                    <SimpleTooltip content="Logout" enabled={!isTextVisible && !isMobile}>
                        <button
                            onClick={handleLogout}
                            className={logoutButtonBaseClass}
                            style={{ height: '32px' }}
                        >
                            <div
                                className="flex-shrink-0 flex items-center justify-center"
                                style={{ width: `calc(${COLLAPSED_WIDTH}px -  0.5rem)`, height: '100%' }}
                            >
                                <MdLogout size={SIDEBAR_ICON_SIZE} />
                            </div>
                            <div style={navTextZoneStyle(isTextVisible)}>
                                Logout
                            </div>
                        </button>
                    </SimpleTooltip>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;