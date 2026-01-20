import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage.jsx';
import OrgSelector from './components/OrgSelector.jsx';
import RepoSelector from './components/RepoSelector.jsx';
import IssuesView from './components/IssuesView.jsx';
import PullRequestsView from './components/PullRequestsView.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(() => {
    const saved = localStorage.getItem('selectedOrg');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedRepo, setSelectedRepo] = useState(() => {
    const saved = localStorage.getItem('selectedRepo');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('issues');

  useEffect(() => {
    checkAuth();
  }, []);

  // Save selections to localStorage
  useEffect(() => {
    if (selectedOrg) {
      localStorage.setItem('selectedOrg', JSON.stringify(selectedOrg));
    }
  }, [selectedOrg]);

  useEffect(() => {
    if (selectedRepo) {
      localStorage.setItem('selectedRepo', JSON.stringify(selectedRepo));
    }
  }, [selectedRepo]);

  async function checkAuth() {
    try {
      const response = await fetch('/auth/user');
      const data = await response.json();

      if (data.authenticated) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/auth/logout', { method: 'POST' });
      setUser(null);
      setSelectedOrg(null);
      setSelectedRepo(null);
      localStorage.removeItem('selectedOrg');
      localStorage.removeItem('selectedRepo');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  function handleChangeRepo() {
    setSelectedRepo(null);
    setSelectedOrg(null);
    localStorage.removeItem('selectedRepo');
    localStorage.removeItem('selectedOrg');
  }

  if (loading) {
    return (
      <main className="container">
        <div className="loading">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!selectedRepo) {
    return (
      <main className="container">
        <nav>
          <ul>
            <li><strong>GitHub Issues Viewer</strong></li>
          </ul>
          <ul>
            <li>Welcome, {user.name || user.login}!</li>
            <li><button onClick={handleLogout} className="secondary">Logout</button></li>
          </ul>
        </nav>

        {!selectedOrg ? (
          <OrgSelector onSelect={setSelectedOrg} />
        ) : (
          <RepoSelector
            org={selectedOrg}
            onSelect={setSelectedRepo}
            onBack={() => setSelectedOrg(null)}
          />
        )}
      </main>
    );
  }

  return (
    <main className="container">
      <nav>
        <ul>
          <li><strong>GitHub Issues Viewer</strong></li>
        </ul>
        <ul>
          <li>
            <button
              onClick={handleChangeRepo}
              className="secondary outline"
              type="button"
            >
              Change Repository
            </button>
          </li>
          <li><button onClick={handleLogout} className="secondary">Logout</button></li>
        </ul>
      </nav>

      <article>
        <header>
          <h2>{selectedOrg.login} / {selectedRepo.name}</h2>
        </header>

        <nav>
          <ul>
            <li>
              <a
                href="#issues"
                className={activeTab === 'issues' ? '' : 'secondary'}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('issues');
                }}
              >
                Issues
              </a>
            </li>
            <li>
              <a
                href="#pulls"
                className={activeTab === 'pulls' ? '' : 'secondary'}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('pulls');
                }}
              >
                Pull Requests
              </a>
            </li>
          </ul>
        </nav>

        {activeTab === 'issues' ? (
          <IssuesView owner={selectedOrg.login} repo={selectedRepo.name} />
        ) : (
          <PullRequestsView owner={selectedOrg.login} repo={selectedRepo.name} />
        )}
      </article>
    </main>
  );
}

export default App;
