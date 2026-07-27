import { useState, useRef, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useStore from '../store';

export default function Sidebar() {
  const {
    sidebarOpen, toggleSidebar, conversations, activeConvo,
    setActiveConvo, createConversation, deleteConversation, openSettings,
    projects, activeProject, setActiveProject, createProject,
    renameProject, deleteProject,
  } = useStore(useShallow((s) => ({
    sidebarOpen: s.sidebarOpen,
    toggleSidebar: s.toggleSidebar,
    conversations: s.conversations,
    activeConvo: s.activeConvo,
    setActiveConvo: s.setActiveConvo,
    createConversation: s.createConversation,
    deleteConversation: s.deleteConversation,
    openSettings: s.openSettings,
    projects: s.projects,
    activeProject: s.activeProject,
    setActiveProject: s.setActiveProject,
    createProject: s.createProject,
    renameProject: s.renameProject,
    deleteProject: s.deleteProject,
  })));

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const newProjectRef = useRef(null);
  const editInputRef = useRef(null);

  const filteredConversations = activeProject
    ? conversations.filter((c) => c.projectId === activeProject)
    : conversations;

  const getProjectConvoCount = (projectId) =>
    conversations.filter((c) => c.projectId === projectId).length;

  const handleNewChat = () => {
    createConversation();
    if (window.innerWidth <= 768) toggleSidebar(false);
  };

  const handleSelect = (id) => {
    setActiveConvo(id);
    if (window.innerWidth <= 768) toggleSidebar(false);
  };

  const handleCreateProject = () => {
    const name = newProjectName.trim();
    if (name) {
      createProject(name);
      setNewProjectName('');
      setShowNewProject(false);
    }
  };

  const handleStartEdit = (project) => {
    setEditingProject(project.id);
    setEditName(project.name);
  };

  const handleFinishEdit = () => {
    const name = editName.trim();
    if (name && editingProject) {
      renameProject(editingProject, name);
    }
    setEditingProject(null);
    setEditName('');
  };

  const handleDeleteProject = (e, project) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${project.name}" and all its conversations?`)) {
      deleteProject(project.id);
    }
  };

  useEffect(() => {
    if (showNewProject && newProjectRef.current) {
      newProjectRef.current.focus();
    }
  }, [showNewProject]);

  useEffect(() => {
    if (editingProject && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingProject]);

  return (
    <>
      {sidebarOpen && window.innerWidth <= 768 && (
        <div className="sidebar-backdrop visible" onClick={() => toggleSidebar(false)} />
      )}
      <aside className={`sidebar${sidebarOpen ? '' : ' collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="dot" />
            NCHAT
            <span className="version-badge">v3</span>
          </div>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>+ New conversation</button>

        <div className="sidebar-section-label">
          Projects
          <button
            className="project-add-btn"
            onClick={() => setShowNewProject(!showNewProject)}
            title="New project"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>

        {showNewProject && (
          <div className="new-project-row">
            <input
              ref={newProjectRef}
              className="project-name-input"
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') { setShowNewProject(false); setNewProjectName(''); }
              }}
              onBlur={handleCreateProject}
            />
          </div>
        )}

        <div className="project-list">
          <div
            className={`project-item${activeProject === null ? ' active' : ''}`}
            onClick={() => setActiveProject(null)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span className="project-item-name">All Conversations</span>
            <span className="project-item-count">{conversations.length}</span>
          </div>

          {projects.map((p) => (
            <div
              key={p.id}
              className={`project-item${activeProject === p.id ? ' active' : ''}`}
              onClick={() => setActiveProject(p.id)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              {editingProject === p.id ? (
                <input
                  ref={editInputRef}
                  className="project-name-input inline"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishEdit();
                    if (e.key === 'Escape') { setEditingProject(null); setEditName(''); }
                  }}
                  onBlur={handleFinishEdit}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="project-item-name">{p.name}</span>
              )}
              <span className="project-item-count">{getProjectConvoCount(p.id)}</span>
              {editingProject !== p.id && (
                <div className="project-item-actions">
                  <button
                    className="project-action-btn"
                    title="Rename"
                    onClick={(e) => { e.stopPropagation(); handleStartEdit(p); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button
                    className="project-action-btn danger"
                    title="Delete"
                    onClick={(e) => handleDeleteProject(e, p)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="sidebar-section-label">Conversations</div>
        <div className="convo-list">
          {filteredConversations.length === 0 && (
            <div className="empty-convo">
              <p>No conversations yet</p>
            </div>
          )}
          {filteredConversations.map((c) => (
            <div
              key={c.id}
              className={`convo-item${c.id === activeConvo ? ' active' : ''}`}
              onClick={() => handleSelect(c.id)}
            >
              <div className="convo-item-title">{c.title}</div>
              <div className="convo-item-meta">{c.messages.length} messages</div>
              <button
                className="convo-item-delete"
                aria-label="Delete conversation"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(c.id);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="settings-btn" onClick={openSettings}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            API Keys
          </button>
        </div>
      </aside>
    </>
  );
}
