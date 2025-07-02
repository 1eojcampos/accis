import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const PublicModels = () => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [links, setLinks] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState('');

  const marketplaces = [
    { 
      name: 'Yeggi', 
      description: 'Search engine for 3D printable models',
      makeUrl: q => `https://www.yeggi.com/q/${q}/`,
      icon: '🔍'
    },
    { 
      name: 'Thingiverse', 
      description: 'MakerBot\'s community of makers',
      makeUrl: q => `https://www.thingiverse.com/search?q=${q}`,
      icon: '🏗️'
    },
    { 
      name: 'MyMiniFactory', 
      description: 'Curated 3D printing community',
      makeUrl: q => `https://www.myminifactory.com/search/?query=${q}`,
      icon: '🏭'
    },
    { 
      name: 'Cults3D', 
      description: 'Digital marketplace for 3D printing',
      makeUrl: q => `https://cults3d.com/en/search?q=${q}`,
      icon: '🎨'
    },
    { 
      name: 'Printables', 
      description: 'Prusa\'s 3D model repository',
      makeUrl: q => `https://www.printables.com/search?query=${q}`,
      icon: '📐'
    },
    { 
      name: 'Thangs', 
      description: 'Search across multiple 3D model sites',
      makeUrl: q => `https://thangs.com/search/${q}`,
      icon: '🌐'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    const encodedQuery = encodeURIComponent(trimmedQuery);
    const generatedLinks = marketplaces.map(marketplace => ({
      name: marketplace.name,
      description: marketplace.description,
      url: marketplace.makeUrl(encodedQuery),
      icon: marketplace.icon
    }));
    
    setLinks(generatedLinks);
  };

  const handleCopyLink = async (url, siteName) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyFeedback(`Copied ${siteName} link!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyFeedback(`Copied ${siteName} link!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setLinks([]);
    setCopyFeedback('');
  };

  return (
    <div className="public-models-container">
      <div className="dashboard-card">
        <h2>🌐 Browse Public 3D Models</h2>
        <p>Generate search links for popular 3D model marketplaces. No scraping, no limits!</p>
        
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Search for 3D models (e.g., phone case, miniature, vase)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              required
            />
            <button type="submit" className="search-button">
              🔗 Generate Links
            </button>
          </div>
          
          {query && (
            <button 
              type="button" 
              onClick={handleClearSearch}
              className="clear-button"
            >
              Clear
            </button>
          )}
        </form>

        {/* Copy Feedback */}
        {copyFeedback && (
          <div className="copy-feedback">
            ✅ {copyFeedback}
          </div>
        )}

        {/* Generated Links */}
        {links.length > 0 && (
          <div className="marketplace-links">
            <h3>Search Results for "{query}"</h3>
            <p className="links-description">
              Click any link to browse models on that platform, or copy the link to share with your printer:
            </p>
            
            <div className="marketplace-grid">
              {links.map((link) => (
                <div key={link.name} className="marketplace-card">
                  <div className="marketplace-header">
                    <span className="marketplace-icon">{link.icon}</span>
                    <div className="marketplace-info">
                      <h4 className="marketplace-name">{link.name}</h4>
                      <p className="marketplace-description">{link.description}</p>
                    </div>
                  </div>
                  
                  <div className="marketplace-actions">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-button primary"
                    >
                      🔗 Browse Models
                    </a>
                    <button
                      onClick={() => handleCopyLink(link.url, link.name)}
                      className="action-button secondary"
                      title="Copy link to clipboard"
                    >
                      📋 Copy Link
                    </button>
                  </div>
                  
                  <div className="marketplace-url">
                    <code>{link.url}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions-section">
          <h3>💡 How to Use</h3>
          <div className="instructions-grid">
            <div className="instruction-step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Search</h4>
                <p>Enter keywords for the type of 3D model you want to find</p>
              </div>
            </div>
            <div className="instruction-step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Browse</h4>
                <p>Click "Browse Models" to visit each marketplace and find your perfect model</p>
              </div>
            </div>
            <div className="instruction-step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Share</h4>
                <p>Copy the link and share it with your preferred 3D printer for a quote</p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Searches */}
        <div className="popular-searches">
          <h3>� Popular Searches</h3>
          <div className="search-tags">
            {['phone case', 'miniature', 'vase', 'keychain', 'toy', 'gadget', 'organizer', 'decoration'].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="search-tag"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicModels;
