import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// --- ADDED: Icon for the new Sprints button ---
import { MdLayers, MdAutorenew, MdPersonAdd, MdDeleteOutline, MdShield, MdStar } from 'react-icons/md';

import {
  getProjectByKey,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
  clearProjectUpdateError,
  ProjectDetailSkeleton,
} from '../';

import { selectCurrentUser, selectIsAuthenticated } from '../../auth';

import BreadcrumbNav from '../../../components/layout/components/BreadcrumbNav';
import '../../../../output.css';


const ProjectDetail = () => {
  const { key } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- State for Editing ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newLeadId, setNewLeadId] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(new Set()); // New state for selected members

  // --- State for controlling initial fade-in ---
  const [isVisible, setIsVisible] = useState(false);

  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // --- Redux State ---
  const {
    currentProject,
    loading: detailsLoading,
    error: detailsError,
    updateLoading,
    updateError
  } = useSelector(state => state.projects);

  const { user } = useSelector(state => state.auth);
  const activeCompanyId = user?.activeCompanyId || null;

  useEffect(() => {
    // Auto-Navigation for context mismatch (Error based)
    if (detailsError && (detailsError.status === 403 || detailsError.status === 404)) {
      console.warn("ProjectDetail: Fetch error detected (likely context mismatch). Redirecting...");
      navigate('/projects');
    }

    // Auto-Navigation for context mismatch (Data based - Immediate)
    if (currentProject?.project) {
      // activeCompanyId can be null (Personal) or string.
      // check if project.companyId matches.
      // Note: currentProject.project might not explicitly have companyId if the backend doesn't return it
      // but let's check. If it does, we can use it.
      // Assuming the backend returns companyId on the project object.
      const projectCompanyId = currentProject.project.companyId || null;
      if (projectCompanyId !== activeCompanyId) {
        console.warn(`ProjectDetail: Context mismatch detected (Project: ${projectCompanyId}, Active: ${activeCompanyId}). Redirecting...`);
        navigate('/projects');
      }
    }
  }, [detailsError, navigate, currentProject, activeCompanyId]);

  // --- Fetch Project Data ---
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (key) {
      // Re-fetch when key OR activeCompanyId changes
      dispatch(getProjectByKey(key));
    }
    // Cleanup function on unmount or key change
    return () => {
      setIsEditing(false);
      setNewMemberEmail('');
      setNewLeadId('');
      setSelectedMembers(new Set());
      if (typeof clearProjectUpdateError === 'function') {
        dispatch(clearProjectUpdateError());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, key, navigate, isAuthenticated, activeCompanyId]);

  // --- Effect for triggering the fade-in ---
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // --- Initialize Form Data when currentProject data arrives ---
  useEffect(() => {
    if (currentProject?.project) {
      const { name = '', description = '', projectLead = null } = currentProject.project;
      setFormData({ name, description });
      setNewLeadId(projectLead?.id || '');
    } else if (!currentProject && !detailsLoading) {
      setFormData({ name: '', description: '' });
      setNewLeadId('');
    }
  }, [currentProject, detailsLoading]);


  // --- Derived Data ---
  const project = currentProject?.project;
  const lead = project?.projectLead;
  const members = project?.members || [];
  const leadId = project?.projectLead?.id;
  const projectKey = project?.key;

  // Sort members: Leads first, then alphabetical by displayName
  const sortedMembers = [...members].sort((a, b) => {
    const aIsLead = a.id === leadId;
    const bIsLead = b.id === leadId;
    if (aIsLead && !bIsLead) return -1;
    if (!aIsLead && bIsLead) return 1;
    return (a.displayName || '').localeCompare(b.displayName || '');
  });

  const otherMembers = members.filter(member => member.id !== leadId);

  const isCompanyAdminOrManager = user?.companyRole && ['OWNER', 'ADMIN', 'MANAGER'].includes(user.companyRole);
  const canEdit = !detailsLoading && !updateLoading && project && (leadId === currentUser?.id);
  const canManageProject = !detailsLoading && !updateLoading && project && ((leadId === currentUser?.id) || isCompanyAdminOrManager);
  const isVerified = user?.isEmailVerified;

  // Now, 'canRemoveMembers' will be true if the user can edit (i.e., is the lead or a company manager)
  // The UI will handle the selection logic for removal.
  const canPerformMemberActions = isEditing && !updateLoading && canEdit;


  // --- Event Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (canManageProject) {
      setIsEditing(!isEditing);
      if (!isEditing && typeof clearProjectUpdateError === 'function') {
        dispatch(clearProjectUpdateError());
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (project) {
      setFormData({ name: project.name || '', description: project.description || '' });
      setNewLeadId(leadId || '');
    }
    setNewMemberEmail('');
    setSelectedMembers(new Set()); // Clear selected members on cancel
    if (typeof clearProjectUpdateError === 'function') {
      dispatch(clearProjectUpdateError());
    }
  };

  const handleSaveChanges = async () => {
    if (!projectKey) return;

    const changes = {};
    if (formData.name.trim() !== project?.name && formData.name.trim() !== '') changes.name = formData.name.trim();
    if (formData.description !== project?.description) changes.description = formData.description;

    if (Object.keys(changes).length > 0) {
      dispatch(updateProject({ key: projectKey, projectData: changes }))
        .unwrap()
        .then(() => {
          console.log("Project details updated successfully.");
        })
        .catch((err) => {
          console.error("Failed to update project details:", err);
        });
    } else {
      console.log("No changes to save in name or description.");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!projectKey || !newMemberEmail.trim()) return;

    if (!/\S+@\S+\.\S+/.test(newMemberEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    const existingMember = members.find(m => m.email === newMemberEmail.trim().toLowerCase());
    if (existingMember) {
      alert(`${newMemberEmail} is already a member of this project.`);
      return;
    }

    dispatch(addProjectMember({ key: projectKey, memberData: { email: newMemberEmail.trim() } }))
      .unwrap()
      .then(() => {
        console.log("Member add request sent successfully.");
        setNewMemberEmail('');
      })
      .catch((err) => {
        console.error("Failed to add member:", err);
        const errorMsg = typeof err === 'string' ? err : err?.message || 'User not found or server error.';
        alert(`Failed to add member. ${errorMsg}`);
      });
  };

  // --- New: Handle member selection ---
  const handleMemberSelect = (memberId) => {
    setSelectedMembers(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(memberId)) {
        newSelected.delete(memberId);
      } else {
        newSelected.add(memberId);
      }
      return newSelected;
    });
  };

  // --- Modified: Handle removal of a single member ---
  const handleRemoveMember = async (memberId, memberName) => {
    if (!projectKey) return;

    const confirmRemoval = window.confirm(
      `Are you sure you want to remove ${memberName || 'this member'} from the project?`
    );

    if (confirmRemoval) {
      dispatch(removeProjectMember({ key: projectKey, memberId }))
        .unwrap()
        .then(() => {
          console.log("Member removed successfully.");
        })
        .catch((err) => {
          console.error(`Failed to remove member ${memberId}:`, err);
          const errorMsg = typeof err === 'string' ? err : err?.message || 'Please try again.';
          alert(`Failed to remove member. ${errorMsg}`);
        });
    }
  };

  // Keep handleRemoveSelectedMembers for batch removal if needed, but we'll prioritize single removal for now.
  const handleRemoveSelectedMembers = async () => {
    if (!projectKey || selectedMembers.size === 0) return;

    const confirmRemoval = window.confirm(
      `Are you sure you want to remove ${selectedMembers.size} selected member(s) from the project?`
    );

    if (confirmRemoval) {
      const removalPromises = Array.from(selectedMembers).map(memberId =>
        dispatch(removeProjectMember({ key: projectKey, memberId }))
          .unwrap()
          .catch((err) => {
            console.error(`Failed to remove member ${memberId}:`, err);
            return { memberId, success: false, error: err };
          })
      );

      Promise.allSettled(removalPromises)
        .then(results => {
          const failedRemovals = results.filter(r => r.status === 'rejected');
          if (failedRemovals.length > 0) {
            alert(`Some members could not be removed. Please check console for details.`);
          } else {
            console.log("All selected members removed successfully.");
          }
          setSelectedMembers(new Set());
        });
    }
  };

  const handleMakeLead = async (memberId, memberName) => {
    if (!projectKey || !memberId || memberId === leadId) return;

    const confirmChange = window.confirm(
      `Are you sure you want to make ${memberName} the new project lead? You will lose editing rights for this project.`
    );

    if (confirmChange) {
      dispatch(updateProject({ key: projectKey, projectData: { leadId: memberId } }))
        .unwrap()
        .then(() => {
          console.log("Project lead changed successfully.");
          setIsEditing(false);
        })
        .catch((err) => {
          console.error("Failed to change project lead:", err);
          const errorMsg = typeof err === 'string' ? err : err?.message || 'Please try again.';
          alert(`Failed to change lead. ${errorMsg}`);
        });
    }
  };

  const handleArchive = async () => {
    if (!projectKey) return;
    const newStatus = !project.isArchived;
    const action = newStatus ? 'archive' : 'unarchive';
    if (window.confirm(`Are you sure you want to ${action} this project?`)) {
      try {
        await dispatch(updateProject({ key: projectKey, projectData: { isArchived: newStatus } })).unwrap();
      } catch (err) {
        console.error("Failed to archive:", err);
        alert("Failed to archive project.");
      }
    }
  };

  const handleDelete = async () => {
    if (!projectKey) return;
    if (window.confirm("Are you sure you want to DELETE this project? This cannot be undone.")) {
      try {
        await dispatch(deleteProject(projectKey)).unwrap();
        navigate('/projects');
      } catch (err) {
        console.error("Failed to delete:", err);
        alert("Failed to delete project.");
      }
    }
  };


  // --- Determine Content Function ---
  const renderContent = () => {
    if (detailsLoading && !currentProject) {
      return <ProjectDetailSkeleton />;
    }

    if (detailsError && !currentProject) {
      return (
        <div className="p-4 text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 rounded-md">
          Error loading project: {typeof detailsError === 'string' ? detailsError : detailsError?.message || 'An unknown error occurred'}
        </div>
      );
    }

    if (!detailsLoading && !project) {
      return (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          Project not found or you may not have access.
        </div>
      );
    }

    if (project) {
      return (
        <>
          <BreadcrumbNav />

          {/* Project Title */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            {isEditing && canManageProject ? (
              <input
                type="text" name="name" value={formData.name} onChange={handleInputChange}
                className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 flex-grow mr-4 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-70 min-w-[200px]"
                disabled={updateLoading} required
              />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 break-words mr-4">
                {project.name || 'Project Name Unavailable'}
              </h1>
            )}
          </div>

          {/* Display Update Operation Errors */}
          {updateError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded dark:bg-red-900 dark:text-red-300 dark:border-red-700">
              Update failed: {typeof updateError === 'string' ? updateError : updateError?.message || 'An unknown error occurred'}
            </div>
          )}

          {/* Display background loading indicator during updates */}
          {updateLoading && (
            <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl text-gray-700 dark:text-gray-300">
                Processing update...
              </div>
            </div>
          )}

          {/* Main Grid Layout for Project Details, Actions, and Change Lead */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Project Details Section (Left) - now spans multiple rows for alignment */}
            <div className="md:col-span-8 col-span-12 flex flex-col">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-grow">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Project Description
                </h2>

                {isEditing && canManageProject ? (
                  <>
                    <textarea
                      id="description-input" name="description" value={formData.description} onChange={handleInputChange}
                      rows={5}
                      className="w-full text-base text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500 whitespace-pre-wrap disabled:opacity-70"
                      disabled={updateLoading} placeholder="Enter project description..."
                    />
                    <div className="mt-4 text-right">
                      <button
                        type="button" onClick={handleSaveChanges}
                        disabled={updateLoading || (formData.name.trim() === project?.name && formData.description === project?.description)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {updateLoading ? 'Saving...' : 'Save Description'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="min-h-[8rem]">
                    {project.description ? (
                      <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {project.description}
                      </p>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          No description provided
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
                          Add a description to help your team understand the project goals.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Project Actions and Change Lead Section (Right) */}
            <div className="md:col-span-4 col-span-12 flex flex-col space-y-6">
              {/* View Board Action */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Actions
                </h2>
                <div className="space-y-4">
                  <div>
                    <button
                      type="button"
                      onClick={() => project?.boards?.[0]?.id && navigate(`/boards/${project.boards[0].id}`)}
                      className="flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                      disabled={!project?.boards?.[0]?.id || updateLoading}
                    >
                      View Board
                    </button>
                  </div>

                  {/* --- "View Epics" Button --- */}
                  <div>
                    <button
                      type="button"
                      onClick={() => projectKey && navigate(`/projects/${projectKey}/epics`)}
                      className="flex w-full justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                      disabled={!projectKey || updateLoading}
                    >
                      <MdLayers className="mr-2 h-5 w-5" aria-hidden="true" />
                      View Epics
                    </button>
                  </div>

                  {/* --- ADDED: "View Sprints" Button --- */}
                  <div>
                    <button
                      type="button"
                      onClick={() => projectKey && navigate(`/projects/${projectKey}/sprints`)}
                      className="flex w-full justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                      disabled={!projectKey || updateLoading}
                    >
                      <MdAutorenew className="mr-2 h-5 w-5" aria-hidden="true" />
                      View Sprints
                    </button>
                  </div>
                  {/* ---------------------------------- */}

                  {/* Edit Project button */}
                  {canManageProject && !isEditing && (
                    <div>
                      <button type="button" onClick={handleEditToggle} disabled={updateLoading}
                        className="flex w-full justify-center rounded-md border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-indigo-400 dark:border-indigo-500 dark:hover:bg-gray-700 disabled:opacity-50">
                        Edit Project
                      </button>
                    </div>
                  )}
                  {/* Cancel button - moved here and styled red */}
                  {isEditing && (
                    <div>
                      <button type="button" onClick={handleCancelEdit} disabled={updateLoading}
                        className="flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-semibold shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50">
                        Close Edit
                      </button>
                    </div>
                  )}

                  {/* Archive/Unarchive Button */}
                  {isEditing && canManageProject && isVerified && (
                    <div>
                      <button
                        type="button"
                        onClick={handleArchive}
                        disabled={updateLoading}
                        className={`flex w-full justify-center rounded-md border px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${project.isArchived
                          ? 'border-green-600 text-green-600 bg-white hover:bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-500 dark:hover:bg-gray-700 focus:ring-green-500'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 focus:ring-indigo-500'
                          }`}
                      >
                        {project.isArchived ? 'Unarchive Project' : 'Archive Project'}
                      </button>
                    </div>
                  )}

                  {/* Delete Button */}
                  {isEditing && canManageProject && isVerified && (
                    <div>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={updateLoading}
                        className="flex w-full justify-center rounded-md border border-red-600 px-4 py-2 text-sm font-semibold text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-gray-800 dark:text-red-400 dark:border-red-500 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        Delete Project
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Project Members Section (Full Width) */}
            <div className="col-span-12">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      Team Members
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {members.length}
                      </span>
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Manage who has access to this project.
                    </p>
                  </div>

                  {/* --- Add Member Form (Only visible for Managers and above) --- */}
                  {isCompanyAdminOrManager && (
                    <form onSubmit={handleAddMember} className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="Invite by email..."
                          required
                          disabled={updateLoading}
                          className="block w-full sm:w-64 rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-100 transition-all"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <MdPersonAdd className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={updateLoading || !newMemberEmail.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-95"
                      >
                        {updateLoading ? '...' : 'Add'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Member List */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Member
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                      {sortedMembers.length > 0 ? (
                        sortedMembers.map(member => (
                          <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
                                    src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName || 'U')}&background=random&color=fff`}
                                    alt={member.displayName}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {member.displayName || 'Unnamed Member'}
                                    {member.id === currentUser?.id && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {member.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(member.isLead || member.id === leadId) ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <MdShield className="mr-1 h-3 w-3" />
                                  Project Lead
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  {member.projectRole
                                    ? member.projectRole.charAt(0).toUpperCase() + member.projectRole.slice(1).toLowerCase()
                                    : (member.companyRole ? member.companyRole.charAt(0).toUpperCase() + member.companyRole.slice(1).toLowerCase() : 'Member')
                                  }
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                {currentUser?.id === leadId && member.id !== leadId && (
                                  <button
                                    onClick={() => handleMakeLead(member.id, member.displayName)}
                                    className="text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-all opacity-0 group-hover:opacity-100"
                                    title="Make Project Lead"
                                  >
                                    <MdStar className="h-5 w-5" />
                                  </button>
                                )}
                                {(isCompanyAdminOrManager || currentUser?.role === 'ADMIN') && member.id !== leadId && member.id !== currentUser?.id && (
                                  <button
                                    onClick={() => handleRemoveMember(member.id, member.displayName)}
                                    className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove from project"
                                  >
                                    <MdDeleteOutline className="h-5 w-5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                            No team members assigned yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div> {/* End Main Grid */}
        </>
      );
    }

    return null;
  };

  return (
    <div
      className={`transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProjectDetail;