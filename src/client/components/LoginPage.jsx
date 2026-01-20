import React from 'react';

function LoginPage() {
  return (
    <main className="container">
      <article className="login-container">
        <header>
          <h1>GitHub Issues Viewer</h1>
          <p>View and export GitHub issues and pull requests</p>
        </header>

        <section>
          <p>
            Sign in with your GitHub account to view and export issues and pull requests
            from your repositories.
          </p>

          <h3>Features:</h3>
          <ul>
            <li>View issues and pull requests in a table format</li>
            <li>Filter by state (open, closed, all)</li>
            <li>Sort and search through results</li>
            <li>Export to CSV</li>
            <li>Support for both public and private repositories</li>
          </ul>
        </section>

        <footer className="login-footer">
          <a href="/auth/github" role="button">
            Sign in with GitHub
          </a>
        </footer>
      </article>
    </main>
  );
}

export default LoginPage;
