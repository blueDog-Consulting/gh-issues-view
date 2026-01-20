import { Hono } from 'hono';
import { verifySessionCookie, getSession } from '../utils/session.js';

export const apiRoutes = new Hono();

// Middleware to check authentication
async function requireAuth(c, next) {
  const cookie = c.req.header('Cookie');
  const sessionId = await verifySessionCookie(cookie, c.env.SESSION_SECRET);

  if (!sessionId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const session = await getSession(c.env.SESSIONS, sessionId);

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('session', session);
  await next();
}

apiRoutes.use('*', requireAuth);

// Get user's organizations
apiRoutes.get('/orgs', async (c) => {
  const session = c.get('session');

  try {
    const response = await fetch('https://api.github.com/user/orgs', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Issues-Viewer'
      }
    });

    const orgs = await response.json();

    // Add user's personal account
    const userOrg = {
      login: session.user.login,
      id: session.user.id,
      avatar_url: session.user.avatar_url,
      description: 'Personal Account'
    };

    return c.json([userOrg, ...orgs]);
  } catch (error) {
    console.error('Error fetching orgs:', error);
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

// Get repositories for an org
apiRoutes.get('/orgs/:org/repos', async (c) => {
  const session = c.get('session');
  const org = c.req.param('org');

  try {
    // Check if it's the user's personal account or an org
    const endpoint = org === session.user.login
      ? 'https://api.github.com/user/repos?affiliation=owner,collaborator&per_page=100'
      : `https://api.github.com/orgs/${org}/repos?per_page=100`;

    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Issues-Viewer'
      }
    });

    const repos = await response.json();

    return c.json(repos);
  } catch (error) {
    console.error('Error fetching repos:', error);
    return c.json({ error: 'Failed to fetch repositories' }, 500);
  }
});

// Get issues for a repository
apiRoutes.get('/repos/:owner/:repo/issues', async (c) => {
  const session = c.get('session');
  const owner = c.req.param('owner');
  const repo = c.req.param('repo');
  const state = c.req.query('state') || 'open'; // open, closed, all
  const page = c.req.query('page') || '1';
  const perPage = c.req.query('per_page') || '30';

  try {
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/issues`);
    url.searchParams.set('state', state);
    url.searchParams.set('page', page);
    url.searchParams.set('per_page', perPage);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Issues-Viewer'
      }
    });

    const issues = await response.json();

    // Filter out pull requests (they come in the issues endpoint)
    const filteredIssues = issues.filter(issue => !issue.pull_request);

    // Get link header for pagination
    const linkHeader = response.headers.get('Link');

    return c.json({
      data: filteredIssues,
      pagination: parseLinkHeader(linkHeader)
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return c.json({ error: 'Failed to fetch issues' }, 500);
  }
});

// Get pull requests for a repository
apiRoutes.get('/repos/:owner/:repo/pulls', async (c) => {
  const session = c.get('session');
  const owner = c.req.param('owner');
  const repo = c.req.param('repo');
  const state = c.req.query('state') || 'open'; // open, closed, all
  const page = c.req.query('page') || '1';
  const perPage = c.req.query('per_page') || '30';

  try {
    const url = new URL(`https://api.github.com/repos/${owner}/${repo}/pulls`);
    url.searchParams.set('state', state);
    url.searchParams.set('page', page);
    url.searchParams.set('per_page', perPage);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Issues-Viewer'
      }
    });

    const pulls = await response.json();

    // Get link header for pagination
    const linkHeader = response.headers.get('Link');

    return c.json({
      data: pulls,
      pagination: parseLinkHeader(linkHeader)
    });
  } catch (error) {
    console.error('Error fetching pull requests:', error);
    return c.json({ error: 'Failed to fetch pull requests' }, 500);
  }
});

// Helper function to parse GitHub's Link header for pagination
function parseLinkHeader(linkHeader) {
  if (!linkHeader) return {};

  const links = {};
  const parts = linkHeader.split(',');

  for (const part of parts) {
    const [url, rel] = part.split(';');
    const relMatch = rel.match(/rel="([^"]+)"/);
    const pageMatch = url.match(/[?&]page=(\d+)/);

    if (relMatch && pageMatch) {
      links[relMatch[1]] = parseInt(pageMatch[1]);
    }
  }

  return links;
}
