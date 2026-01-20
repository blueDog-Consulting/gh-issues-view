import React, { useState, useEffect, useCallback } from 'react';
import DataTable from './DataTable.jsx';
import { exportToCSV } from '../utils/csv.js';

function IssuesView({ owner, repo }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [state, setState] = useState('open');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(30);
  const [pagination, setPagination] = useState({});

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/repos/${owner}/${repo}/issues?state=${state}&page=${page}&per_page=${perPage}`
      );
      const data = await response.json();
      setIssues(data.data || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  }, [owner, repo, state, page, perPage]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  async function handleExport() {
    setExporting(true);
    try {
      // Fetch all pages
      const allIssues = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await fetch(
          `/api/repos/${owner}/${repo}/issues?state=${state}&page=${currentPage}&per_page=100`
        );
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          allIssues.push(...data.data);
          hasMore = data.pagination && data.pagination.next;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      const csvData = allIssues.map(issue => ({
        Number: issue.number,
        Type: 'Issue',
        Title: issue.title,
        Description: issue.body || '',
        Author: issue.user?.login || '',
        Labels: issue.labels?.map(l => l.name).join(', ') || '',
        'Created Date': new Date(issue.created_at).toLocaleDateString(),
        Status: issue.state,
        Assignees: issue.assignees?.map(a => a.login).join(', ') || '',
        URL: issue.html_url
      }));

      exportToCSV(csvData, `${owner}-${repo}-issues-${state}-${allIssues.length}-items.csv`);
    } catch (error) {
      console.error('Failed to export issues:', error);
      alert('Failed to export issues. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  const columns = [
    { key: 'number', label: 'Number', sortable: true },
    { key: 'type', label: 'Type', sortable: true, render: () => 'Issue' },
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
          <p aria-busy="true">Loading issues...</p>
        </div>
      ) : (
        <>
          <DataTable
            data={issues}
            columns={columns}
            onRowClick={(issue) => window.open(issue.html_url, '_blank')}
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

export default IssuesView;
