import React, { useState, useEffect } from 'react';

function RepoSelector({ org, onSelect, onBack }) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRepos();
  }, [org]);

  async function fetchRepos() {
    try {
      const response = await fetch(`/api/orgs/${org.login}/repos`);
      const data = await response.json();

      // Sort by last modified (most recent first)
      data.sort((a, b) => {
        const dateA = new Date(a.pushed_at || a.updated_at);
        const dateB = new Date(b.pushed_at || b.updated_at);
        return dateB - dateA; // Descending order (newest first)
      });

      setRepos(data);
    } catch (error) {
      console.error('Failed to fetch repos:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <article aria-busy="true">
        <p>Loading repositories...</p>
      </article>
    );
  }

  return (
    <article>
      <header>
        <button onClick={onBack} className="secondary outline">← Back to Organizations</button>
        <h2>Select a Repository from {org.login}</h2>
      </header>

      <section>
        <input
          type="search"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="repo-grid">
          {filteredRepos.length === 0 ? (
            <p>No repositories found.</p>
          ) : (
            filteredRepos.map(repo => (
              <button
                key={repo.id}
                onClick={() => onSelect(repo)}
                className="secondary outline repo-button"
              >
                <div>
                  <strong>{repo.name}</strong>
                  {repo.private && (
                    <span className="repo-private-badge">🔒 Private</span>
                  )}
                  {repo.description && (
                    <div><small>{repo.description}</small></div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </article>
  );
}

export default RepoSelector;
