import React, { useState, useEffect, useCallback } from 'react';
import DataTable from './DataTable.jsx';
import { exportToCSV } from '../utils/csv.js';

function PullRequestsView({ owner, repo }) {
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [state, setState] = useState('open');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);
  const [pagination, setPagination] = useState({});

  const fetchPulls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/repos/${owner}/${repo}/pulls?state=${state}&page=${page}&per_page=${perPage}`
      );
      const data = await response.json();
      setPulls(data.data || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Failed to fetch pull requests:', error);
    } finally {
      setLoading(false);
    }
  }, [owner, repo, state, page, perPage]);

  useEffect(() => {
    fetchPulls();
  }, [fetchPulls]);

  async function handleExport() {
    setExporting(true);
    try {
      // Fetch all pages
      const allPulls = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `/api/repos/${owner}/${repo}/pulls?state=${state}&page=${currentPage}&per_page=100`
        );
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          allPulls.push(...data.data);
          hasMore = data.pagination && data.pagination.next;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      const csvData = allPulls.map(pr => ({
        Number: pr.number,
        Type: 'Pull Request',
        Title: pr.title,
        Description: pr.body || '',
        Author: pr.user?.login || '',
        Labels: pr.labels?.map(l => l.name).join(', ') || '',
        'Created Date': new Date(pr.created_at).toLocaleDateString(),
        Status: pr.state,
        Assignees: pr.assignees?.map(a => a.login).join(', ') || '',
        URL: pr.html_url
      }));

      exportToCSV(csvData, `${owner}-${repo}-pulls-${state}-${allPulls.length}-items.csv`);
    } catch (error) {
      console.error('Failed to export pull requests:', error);
      alert('Failed to export pull requests. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const columns = [
    { key: 'number', label: 'Number', sortable: true },
    { key: 'type', label: 'Type', sortable: true, render: () => 'Pull Request' },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'body', label: 'Description', sortable: false, render: (body) => {
      if (!body) return <em className="empty-description">No description</em>;
      const truncated = body.substring(0, 25);
      return <span className="description-truncate" title={body}>{truncated}{body.length > 25 ? '...' : ''}</span>;
    }},
    { key: 'user.login', label: 'Author', sortable: true },
    { key: 'labels', label: 'Labels', render: (labels) => (
      <div>
        {labels.map(label => (
          <span
            key={label.id}
            className="label-badge"
            style={{ backgroundColor: `#${label.color}`, color: getContrastColor(label.color) }}
          >
            {label.name}
          </span>
        ))}
      </div>
    )},
    { key: 'created_at', label: 'Created', sortable: true, render: (date) =>
      new Date(date).toLocaleDateString()
    },
    { key: 'state', label: 'Status', sortable: true },
    { key: 'assignees', label: 'Assignees', render: (assignees) =>
      assignees.map(a => a.login).join(', ') || 'None'
    }
  ];

  return (
    <div>
      <div className="filter-controls">
        <div className="filters">
          <select value={state} onChange={(e) => { setState(e.target.value); setPage(1); }}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>

          <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>

        <button type="button" onClick={handleExport} disabled={exporting} aria-busy={exporting}>
          {exporting ? 'Exporting all pages...' : 'Export All to CSV'}
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <p aria-busy="true">Loading pull requests...</p>
        </div>
      ) : (
        <>
          <DataTable
            data={pulls}
            columns={columns}
            onRowClick={(pr) => window.open(pr.html_url, '_blank')}
          />

          <div className="pagination">
            <button
              type="button"
              disabled={!pagination.prev}
              onClick={() => setPage(pagination.prev)}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type="button"
              disabled={!pagination.next}
              onClick={() => setPage(pagination.next)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Helper to determine text color based on background
function getContrastColor(hexColor) {
  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#000' : '#fff';
}

export default PullRequestsView;
