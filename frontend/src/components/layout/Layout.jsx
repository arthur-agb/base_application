// src/components/Layout/Layout.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../features/auth';
import { updateSelfProfile } from '../../features/users';
import { MdDashboard, MdAssignment, MdSettings, MdAccountCircle, MdAdminPanelSettings } from 'react-icons/md';

// Import Constants
import {
    DRAWER_WIDTH,
    COLLAPSED_WIDTH,
    HEADER_HEIGHT_STRING,
    MOBILE_BREAKPOINT,
    STANDARD_PADDING_MOBILE,
    STANDARD_PADDING_DESKTOP,
    SIDEBAR_ICON_SIZE,
} from './config/layoutConstants';

// Import Custom Hook
import useMediaQuery from './hooks/useMediaQuery';

// Import Child Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BurgerMenuButton from './components/BurgerMenuButton';
import MobileOverlay from './components/MobileOverlay';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const { user } = useSelector((state) => state.auth);
    const { currentUser } = useSelector((state) => state.users);

    // Initialize from localStorage to prevent flickering on remounts
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (isMobile) return false;
        const stored = localStorage.getItem('sidebar_pref');
        return stored !== null ? stored === 'true' : true; // Default to true if nothing stored
    });

    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        } else {
            // Desktop: restore preference if available
            if (currentUser?.settings?.isSidebarOpen !== undefined) {
                setIsSidebarOpen(currentUser.settings.isSidebarOpen);
                // Sync DB value to local storage to keep them aligned
                localStorage.setItem('sidebar_pref', String(currentUser.settings.isSidebarOpen));
            }
        }
    }, [isMobile, currentUser]);

    // Derived values
    const currentStandardTopPadding = useMemo(() => {
        return isMobile ? STANDARD_PADDING_MOBILE : STANDARD_PADDING_DESKTOP;
    }, [isMobile]);

    const primaryMenuItems = useMemo(() => [
        { text: 'Dashboard', icon: <MdDashboard size={SIDEBAR_ICON_SIZE} />, path: '/dashboard' },
        { text: 'Projects', icon: <MdAssignment size={SIDEBAR_ICON_SIZE} />, path: '/projects', subPaths: ['/boards', '/board'] },
    ], []);

    const managementMenuItems = useMemo(() => [
        {
            text: 'Workspace',
            icon: <MdSettings size={SIDEBAR_ICON_SIZE} />,
            path: '/workspace/settings',
            companyAdminOrManagerOnly: true,
            indicator: { text: 'M', className: 'bg-blue-500 text-white' } // Management indicator
        },
        {
            text: 'User Approval',
            icon: <MdAdminPanelSettings size={SIDEBAR_ICON_SIZE} />,
            path: '/admin/user-approval',
            adminOnly: true,
            indicator: { text: 'A', className: 'bg-red-600 text-white' } // Admin indicator
        },
        { text: 'Profile', icon: <MdAccountCircle size={SIDEBAR_ICON_SIZE} />, path: '/profile' },
    ], []);

    // Unified user object that prioritizes the full profile data from users slice
    const activeUser = useMemo(() => {
        if (!user && !currentUser) return null;
        return { ...user, ...currentUser };
    }, [user, currentUser]);

    const accessibleMenuItemsFilter = useCallback((item) => {
        if (item.adminOnly && activeUser?.role !== 'ADMIN') {
            return false;
        }
        if (item.companyAdminOrManagerOnly && !['ADMIN', 'MANAGER', 'OWNER'].includes(activeUser?.companyRole)) {
            return false;
        }
        if (item.companyOwnerOnly && activeUser?.companyRole !== 'OWNER') {
            return false;
        }
        return true;
    }, [activeUser?.role, activeUser?.companyRole]);

    const accessiblePrimaryMenuItems = useMemo(() => primaryMenuItems.filter(accessibleMenuItemsFilter), [primaryMenuItems, accessibleMenuItemsFilter]);
    const accessibleManagementMenuItems = useMemo(() => managementMenuItems.filter(accessibleMenuItemsFilter), [managementMenuItems, accessibleMenuItemsFilter]);

    const pageTitle = useMemo(() => {
        const allAccessibleItems = [...accessiblePrimaryMenuItems, ...accessibleManagementMenuItems];
        const sortedItems = [...allAccessibleItems].sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0));

        const currentItem = sortedItems.find(item => {
            if (item.path && location.pathname.startsWith(item.path)) {
                if (location.pathname === item.path || location.pathname === `${item.path}/`) {
                    return true;
                }
                if (!item.subPaths && location.pathname !== item.path && location.pathname !== `${item.path}/`) {
                    if (item.path === '/dashboard' && location.pathname.startsWith('/dashboard/') && location.pathname !== '/dashboard/') return false;
                } else {
                    return true;
                }
            }
            if (item.subPaths) return item.subPaths.some(subPath => location.pathname.startsWith(subPath));
            return false;
        });

        return currentItem?.text || 'Momentum'; // Use better fall back
    }, [location.pathname, accessiblePrimaryMenuItems, accessibleManagementMenuItems]);

    const nonScrollingPaths = useMemo(() => ['/board'], []);
    const isNonScrollingPage = useMemo(() => nonScrollingPaths.some(path => location.pathname.startsWith(path)), [location.pathname, nonScrollingPaths]);

    const handleLogout = useCallback(() => {
        dispatch(logout());
        navigate('/login');
    }, [dispatch, navigate]);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => {
            const newState = !prev;
            // Only persist preference if we are on desktop
            if (!isMobile) {
                localStorage.setItem('sidebar_pref', String(newState));
                dispatch(updateSelfProfile({ settings: { isSidebarOpen: newState } }));
            }
            return newState;
        });
    };

    const currentActualSidebarWidth = isMobile
        ? (isSidebarOpen ? DRAWER_WIDTH : 0)
        : (isSidebarOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH);
    const sidebarIsPhysicallyOpen = currentActualSidebarWidth > 0;

    const sidebarStyle = {
        width: `${currentActualSidebarWidth}px`,
        transition: 'width 0.3s ease-in-out',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: isMobile ? 60 : 40,
        height: '100dvh',
        overflow: 'hidden',
    };

    const mainContentMarginLeft = isMobile ? '0' : `${isSidebarOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH}px`;
    const mainContentBaseStyle = {
        marginLeft: mainContentMarginLeft,
        paddingTop: `calc(${HEADER_HEIGHT_STRING} + ${currentStandardTopPadding})`,
        transition: 'margin-left 0.3s ease-in-out',
        minWidth: 0,
    };
    const mainContentDynamicStyle = isNonScrollingPage
        // FIX: For BoardView, we want NO scrolling on the layout wrapper.
        // The BoardView itself will handle the scrollable areas (horizontal board, vertical columns).
        ? { height: `calc(100vh - ${HEADER_HEIGHT_STRING})`, overflow: 'hidden' }
        : { minHeight: `calc(100vh - ${HEADER_HEIGHT_STRING})`, overflowY: 'auto', overflowX: 'auto' };
    const mainContentStyle = { ...mainContentBaseStyle, ...mainContentDynamicStyle };

    const headerLeftOffset = isMobile ? 0 : (isSidebarOpen ? DRAWER_WIDTH : COLLAPSED_WIDTH);
    const headerStyle = {
        left: `${headerLeftOffset}px`,
        width: `calc(100% - ${headerLeftOffset}px)`,
        height: HEADER_HEIGHT_STRING,
        transition: 'left 0.3s ease-in-out, width 0.3s ease-in-out',
        zIndex: 50,
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <MobileOverlay isOpen={isMobile && isSidebarOpen} onClick={toggleSidebar} />

            <Sidebar
                isSidebarOpen={isSidebarOpen}
                isMobile={isMobile}
                primaryMenuItems={accessiblePrimaryMenuItems}
                managementMenuItems={accessibleManagementMenuItems}
                handleLogout={handleLogout}
                toggleSidebar={toggleSidebar}
                sidebarStyle={sidebarStyle}
                sidebarIsPhysicallyOpen={sidebarIsPhysicallyOpen}
            />

            <BurgerMenuButton
                onClick={toggleSidebar}
                isSidebarOpen={isSidebarOpen}
                isMobile={isMobile}
            />

            <div className="flex flex-1 flex-col min-w-0">
                <Header
                    pageTitle={pageTitle}
                    headerStyle={headerStyle}
                    isMobile={isMobile}
                    isSidebarOpen={isSidebarOpen}
                />
                <main className={`flex-1 pr-4 pb-4 pl-4 sm:pr-6 sm:pb-6 sm:pl-6 lg:pr-8 lg:pb-8 lg:pl-8 bg-gray-100 dark:bg-gray-900 ${isNonScrollingPage ? 'overflow-y-hidden' : 'overflow-y-auto'}`} style={mainContentStyle}>                    <div className={`max-w-full mx-auto ${isNonScrollingPage ? 'h-full' : ''}`}>
                    <Outlet />
                </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;