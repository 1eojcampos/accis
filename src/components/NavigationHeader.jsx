import React from 'react';
import './Dashboard.css';

const NavigationHeader = ({ 
  title, 
  subtitle, 
  onBack, 
  showBackButton = false,
  actions = []
}) => {
  return (
    <div className="navigation-header">
      <div className="nav-header-content">
        {showBackButton && (
          <button 
            className="back-button"
            onClick={onBack}
            title="Go back"
          >
            ← Back
          </button>
        )}
        <div className="nav-header-text">
          <h1 className="nav-title">{title}</h1>
          {subtitle && <p className="nav-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions.length > 0 && (
        <div className="nav-header-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`action-button ${action.type || 'secondary'}`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <span className="action-icon">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NavigationHeader;
