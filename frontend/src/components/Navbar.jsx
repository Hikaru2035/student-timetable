import './Navbar.css';

export function Navbar({ currentView, onViewChange }) {
  const tabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'done', label: 'Done Tasks' },
    { id: 'todo', label: 'Todo Tasks' },
  ];

  return (
    <div className="navbar">
      {/* Logo */}
      <div className="navbar-logo-container">
        <div className="navbar-logo">
          <span className="navbar-logo-text"></span>
        </div>
      </div>

      {/* Tabs */}
      <nav className="navbar-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`navbar-tab ${currentView === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
