import React, { useState, useEffect } from 'react';

function OrgSelector({ onSelect }) {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customOrg, setCustomOrg] = useState('');

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    try {
      const response = await fetch('/api/orgs');
      const data = await response.json();

      // Separate personal account from organizations
      const personalAccount = data[0]; // First item is always personal account
      const organizations = data.slice(1);

      // Sort organizations alphabetically by login
      organizations.sort((a, b) => a.login.localeCompare(b.login));

      // Personal account first, then sorted orgs
      setOrgs([personalAccount, ...organizations]);
    } catch (error) {
      console.error('Failed to fetch orgs:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCustomOrgSubmit(e) {
    e.preventDefault();
    if (customOrg.trim()) {
      onSelect({ login: customOrg.trim() });
    }
  }

  if (loading) {
    return (
      <article aria-busy="true">
        <p>Loading organizations...</p>
      </article>
    );
  }

  return (
    <article>
      <header>
        <h2>Select an Organization</h2>
      </header>

      <section>
        <h3>Your Organizations</h3>
        <div className="repo-grid">
          {orgs.map(org => (
            <button
              key={org.id}
              onClick={() => onSelect(org)}
              className="secondary outline org-button"
            >
              <div className="org-button-content">
                {org.avatar_url && (
                  <img
                    src={org.avatar_url}
                    alt={org.login}
                    width="40"
                    height="40"
                    className="org-avatar"
                  />
                )}
                <div>
                  <strong>{org.login}</strong>
                  {org.description && <div><small>{org.description}</small></div>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3>Or Enter a Custom Organization</h3>
        <form onSubmit={handleCustomOrgSubmit}>
          <fieldset role="group">
            <input
              type="text"
              placeholder="Enter organization name"
              value={customOrg}
              onChange={(e) => setCustomOrg(e.target.value)}
            />
            <button type="submit">Go</button>
          </fieldset>
        </form>
      </section>
    </article>
  );
}

export default OrgSelector;
