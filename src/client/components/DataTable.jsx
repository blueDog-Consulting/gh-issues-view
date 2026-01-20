import React, { useState } from 'react';

function DataTable({ data, columns, onRowClick }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Get nested property value
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  // Sort data
  let sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a, b) => {
      const aVal = getNestedValue(a, sortKey);
      const bVal = getNestedValue(b, sortKey);

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Filter data
  const filteredData = sortedData.filter(row => {
    if (!searchTerm) return true;

    return columns.some(col => {
      const value = getNestedValue(row, col.key);
      if (Array.isArray(value)) {
        return value.some(item =>
          String(item.name || item.login || item).toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  function handleSort(key) {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  }

  return (
    <div>
      <input
        type="search"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="table-search"
      />

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="sort-button"
                    >
                      {col.label}
                      {sortKey === col.key && (
                        <span className="sort-indicator">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-state">
                  No data available
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="clickable-row"
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(getNestedValue(row, col.key), row)
                        : getNestedValue(row, col.key)
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
