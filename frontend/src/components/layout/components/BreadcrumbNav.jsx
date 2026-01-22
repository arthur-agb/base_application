// src/components/layout/components/BreadcrumbNav.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight,
    ChevronDown,
    Search,
    Layout,
    Calendar,
    GitMerge,
    Settings,
    Briefcase,
    Package
} from 'lucide-react';

import { fetchProjects } from '../../../features/projects';
import { useEpics } from '../../../features/epics/hooks/useEpics';
import { useSprints } from '../../../features/sprints/hooks/useSprints';
import { useEpicDetails } from '../../../features/epics/hooks/useEpicDetails';
import { useSprintDetails } from '../../../features/sprints/hooks/useSprintDetails';
import { useBoardData } from '../../../features/board/hooks/useBoardData';

const BreadcrumbNav = () => {
    const { projectId: urlProjectId, key: urlKey, epicId, sprintId, boardId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Dropdown states
    const [openDropdown, setOpenDropdown] = useState(null);
    const [projectSearch, setProjectSearch] = useState('');
    const [itemSearch, setItemSearch] = useState('');

    const dropdownRef = useRef(null);

    // Fetch details if we only have an ID but no projectId (e.g. on Epic details page)
    const { data: epicDetails } = useEpicDetails(epicId);
    const { data: sprintDetails } = useSprintDetails(sprintId);
    const { data: boardDetails } = useBoardData(boardId);

    // Resolve effective projectId - Board data is nested under .board
    const projectId = urlProjectId || urlKey || epicDetails?.project?.key || sprintDetails?.projectId || boardDetails?.board?.projectKey || boardDetails?.board?.project?.key;

    // Redux State
    const { projects, currentProject, loading: projectsLoading } = useSelector(state => state.projects);

    // Resolve active project name for display
    const activeProject = currentProject?.project || epicDetails?.project || sprintDetails?.project || boardDetails?.board?.project;

    // React Query Hooks for siblings
    const { data: epicsData } = useEpics(projectId);
    const { data: sprintsData } = useSprints(projectId);

    const epics = epicsData?.epics || [];
    const sprints = sprintsData || [];

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load projects for switcher
    useEffect(() => {
        if (projects.length === 0 && !projectsLoading) {
            dispatch(fetchProjects());
        }
    }, [dispatch, projects.length, projectsLoading]);

    // View detection
    const isBoardView = location.pathname.includes('/board') || location.pathname.includes('/boards/');
    const isSprintView = location.pathname.includes('/sprints');
    const isEpicView = location.pathname.includes('/epics');
    const isDetailView = epicId || sprintId || boardId;

    let currentFeatureLabel = 'Project';
    if (isBoardView) currentFeatureLabel = 'Board';
    else if (isSprintView) currentFeatureLabel = 'Sprints';
    else if (isEpicView) currentFeatureLabel = 'Epics';
    else if (location.pathname.endsWith(projectId)) currentFeatureLabel = 'Settings';

    const featureOptions = [
        { label: 'Board', icon: <Layout size={14} />, path: `/board/${projectId}` },
        { label: 'Sprints', icon: <Calendar size={14} />, path: `/projects/${projectId}/sprints` },
        { label: 'Epics', icon: <GitMerge size={14} />, path: `/projects/${projectId}/epics` },
        { label: 'Settings', icon: <Settings size={14} />, path: `/projects/${projectId}` },
    ];

    const toggleDropdown = (type) => {
        setOpenDropdown(openDropdown === type ? null : type);
        setProjectSearch('');
        setItemSearch('');
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.key.toLowerCase().includes(projectSearch.toLowerCase())
    );

    const filteredEpics = epics.filter(e => e.title.toLowerCase().includes(itemSearch.toLowerCase()));
    const filteredSprints = sprints.filter(s => s.title.toLowerCase().includes(itemSearch.toLowerCase()));

    const currentItemTitle = isEpicView
        ? (epicDetails?.title || 'Loading...')
        : (isSprintView ? (sprintDetails?.title || 'Loading...') : null);

    const DropdownWrapper = ({ children, className = "" }) => (
        <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={`absolute left-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden ${className}`}
        >
            {children}
        </motion.div>
    );

    return (
        <nav className="-mt-4 px-0 pb-4 flex items-center flex-wrap gap-y-2 gap-x-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 select-none">
            {/* 1. Projects Root */}
            <div className="flex items-center gap-1.5">
                <span className="text-gray-300 dark:text-gray-700">/</span>
                <Link to="/projects" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest font-bold text-[10px]">
                    Projects
                </Link>
                <span className="text-gray-300 dark:text-gray-700">/</span>
            </div>

            {/* 2. Project Switcher */}
            {projectId && (
                <div className="flex items-center gap-1.5">
                    <div className="relative" ref={openDropdown === 'projects' ? dropdownRef : null}>
                        <button
                            onClick={() => toggleDropdown('projects')}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 ${openDropdown === 'projects' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <span className="max-w-[160px] truncate font-semibold">
                                {activeProject?.name || projectId}
                            </span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === 'projects' ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {openDropdown === 'projects' && (
                                <DropdownWrapper>
                                    <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                value={projectSearch}
                                                onChange={(e) => setProjectSearch(e.target.value)}
                                                placeholder="Search projects by name or key..."
                                                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-gray-900 dark:text-gray-100 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-1.5">
                                        {filteredProjects.length > 0 ? filteredProjects.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    if (isBoardView) {
                                                        navigate(`/board/${p.key}`);
                                                    } else {
                                                        navigate(location.pathname.replace(projectId, p.key));
                                                    }
                                                    setOpenDropdown(null);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg group transition-all duration-200 ${p.key === projectId ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-md ${p.key === projectId ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-gray-100 dark:group-hover:bg-gray-700'}`}>
                                                        <Briefcase size={14} className={p.key === projectId ? 'text-indigo-600' : 'text-gray-400'} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm leading-none mb-1">{p.name}</div>
                                                        <div className="text-[10px] uppercase tracking-tighter opacity-60 font-medium">{p.key}</div>
                                                    </div>
                                                </div>
                                                {p.key === projectId && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                                            </button>
                                        )) : (
                                            <div className="py-8 text-center">
                                                <Briefcase size={24} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                                                <p className="text-gray-400 text-xs italic">No matching projects</p>
                                            </div>
                                        )}
                                    </div>
                                </DropdownWrapper>
                            )}
                        </AnimatePresence>
                    </div>
                    <span className="text-gray-300 dark:text-gray-700">/</span>
                </div>
            )}

            {/* 3. Feature Switcher */}
            {projectId && (
                <div className="flex items-center gap-1.5">
                    <div className="relative" ref={openDropdown === 'features' ? dropdownRef : null}>
                        <button
                            onClick={() => toggleDropdown('features')}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 ${openDropdown === 'features' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            <span className="font-semibold">{currentFeatureLabel}</span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === 'features' ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {openDropdown === 'features' && (
                                <DropdownWrapper className="w-56">
                                    <div className="p-1.5">
                                        <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold">Switch View</div>
                                        {featureOptions.map(opt => (
                                            <Link
                                                key={opt.label}
                                                to={opt.path}
                                                onClick={() => setOpenDropdown(null)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-all duration-200 ${opt.label === currentFeatureLabel ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400'}`}
                                            >
                                                <span className={opt.label === currentFeatureLabel ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}>
                                                    {opt.icon}
                                                </span>
                                                <span className="font-bold text-sm">{opt.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </DropdownWrapper>
                            )}
                        </AnimatePresence>
                    </div>
                    <span className="text-gray-300 dark:text-gray-700">/</span>
                </div>
            )}

            {/* 4. Item Switcher (Epic/Sprint) */}
            {isDetailView && (isEpicView || isSprintView) && (
                <div className="flex items-center gap-1.5">
                    <div className="relative" ref={openDropdown === 'items' ? dropdownRef : null}>
                        <button
                            onClick={() => toggleDropdown('items')}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 ${openDropdown === 'items' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100'}`}
                        >
                            <span className="max-w-[200px] truncate font-bold">
                                {currentItemTitle}
                            </span>
                            <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === 'items' ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {openDropdown === 'items' && (
                                <DropdownWrapper>
                                    <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                value={itemSearch}
                                                onChange={(e) => setItemSearch(e.target.value)}
                                                placeholder={`Search other ${isEpicView ? 'epics' : 'sprints'}...`}
                                                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-gray-900 dark:text-gray-100 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-1.5">
                                        {(isEpicView ? filteredEpics : filteredSprints).length > 0 ? (isEpicView ? filteredEpics : filteredSprints).map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    const path = isEpicView ? `/epics/${item.id}` : `/projects/${projectId}/sprints/${item.id}`;
                                                    navigate(path);
                                                    setOpenDropdown(null);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg group transition-all duration-200 ${(item.id === epicId || item.id === sprintId) ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-md ${(item.id === epicId || item.id === sprintId) ? 'bg-indigo-100 dark:bg-indigo-800' : 'bg-gray-100 dark:group-hover:bg-gray-700'}`}>
                                                        <Package size={14} className={(item.id === epicId || item.id === sprintId) ? 'text-indigo-600' : 'text-gray-400'} />
                                                    </div>
                                                    <span className="font-bold text-sm truncate max-w-[190px]">{item.title}</span>
                                                </div>
                                                {(item.id === epicId || item.id === sprintId) && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
                                            </button>
                                        )) : (
                                            <div className="py-8 text-center">
                                                <Package size={24} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                                                <p className="text-gray-400 text-xs italic">No other items found</p>
                                            </div>
                                        )}
                                    </div>
                                </DropdownWrapper>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default BreadcrumbNav;
