import useStore from '../store';

export default function Sidebar() {
  const {
    sidebarOpen, toggleSidebar, conversations, activeConvo,
    setActiveConvo, createConversation, deleteConversation, openSettings,
  } = useStore();

  const handleNewChat = () => {
    createConversation();
    if (window.innerWidth <= 768) toggleSidebar(false);
  };

  const handleSelect = (id) => {
    setActiveConvo(id);
    if (window.innerWidth <= 768) toggleSidebar(false);
  };

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
          </div>
          <button className="sidebar-close" onClick={() => toggleSidebar(false)} aria-label="Close sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>+ New conversation</button>

        <div className="sidebar-section-label">Conversations</div>
        <div className="convo-list">
          {conversations.length === 0 && (
            <div className="empty-convo">
              <p>No conversations yet</p>
            </div>
          )}
          {conversations.map((c) => (
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
