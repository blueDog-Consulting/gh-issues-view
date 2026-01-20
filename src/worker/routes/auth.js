import { Hono } from 'hono';
import { generateSessionId, createSessionCookie, verifySessionCookie, storeSession, getSession, deleteSession } from '../utils/session.js';

export const authRoutes = new Hono();

// Start GitHub OAuth flow
authRoutes.get('/github', (c) => {
  const clientId = c.env.GITHUB_CLIENT_ID;
  const redirectUri = `${new URL(c.req.url).origin}/auth/github/callback`;

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'read:user read:org repo');

  return c.redirect(githubAuthUrl.toString());
});

// GitHub OAuth callback
authRoutes.get('/github/callback', async (c) => {
  const code = c.req.query('code');

  if (!code) {
    return c.text('Authorization code not found', 400);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${new URL(c.req.url).origin}/auth/github/callback`
      })
    });

    // Get response text first, then try to parse it
    const responseText = await tokenResponse.text();
    console.log('GitHub OAuth Response Status:', tokenResponse.status);
    console.log('GitHub OAuth Response Body:', responseText);

    // Try to parse as JSON
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse GitHub response as JSON:', parseError);
      return c.html(`
        <h1>GitHub OAuth Error</h1>
        <p>GitHub returned invalid JSON (Status: ${tokenResponse.status})</p>
        <p><strong>This usually means:</strong></p>
        <ul>
          <li>Your callback URL doesn't match: Should be <code>${new URL(c.req.url).origin}/auth/github/callback</code></li>
          <li>Your Client ID or Client Secret is incorrect</li>
          <li>The authorization code has already been used</li>
        </ul>
        <details>
          <summary>GitHub's response (click to expand)</summary>
          <pre>${responseText.substring(0, 1000)}</pre>
        </details>
        <p><a href="/">Try again</a></p>
      `);
    }

    if (tokenData.error) {
      return c.html(`
        <h1>GitHub OAuth Error</h1>
        <p><strong>Error:</strong> ${tokenData.error}</p>
        <p><strong>Description:</strong> ${tokenData.error_description || 'No description provided'}</p>
        <p><a href="/">Try again</a></p>
      `);
    }

    // Get user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Issues-Viewer'
      }
    });

    const userResponseText = await userResponse.text();
    console.log('GitHub User API Response Status:', userResponse.status);
    console.log('GitHub User API Response Body:', userResponseText.substring(0, 500));

    let userData;
    try {
      userData = JSON.parse(userResponseText);
    } catch (parseError) {
      console.error('Failed to parse user info as JSON:', parseError);
      return c.html(`
        <h1>GitHub User Info Error</h1>
        <p>Failed to get user information from GitHub (Status: ${userResponse.status})</p>
        <details>
          <summary>Response (click to expand)</summary>
          <pre>${userResponseText.substring(0, 1000)}</pre>
        </details>
        <p><a href="/">Try again</a></p>
      `);
    }

    // Create session
    const sessionId = generateSessionId();
    await storeSession(c.env.SESSIONS, sessionId, {
      accessToken: tokenData.access_token,
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url
      }
    });

    // Set cookie and redirect
    const cookie = await createSessionCookie(sessionId, c.env.SESSION_SECRET);

    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': cookie
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return c.text('Authentication failed', 500);
  }
});

// Get current user
authRoutes.get('/user', async (c) => {
  const cookie = c.req.header('Cookie');
  const sessionId = await verifySessionCookie(cookie, c.env.SESSION_SECRET);

  if (!sessionId) {
    return c.json({ authenticated: false }, 401);
  }

  const session = await getSession(c.env.SESSIONS, sessionId);

  if (!session) {
    return c.json({ authenticated: false }, 401);
  }

  return c.json({
    authenticated: true,
    user: session.user
  });
});

// Logout
authRoutes.post('/logout', async (c) => {
  const cookie = c.req.header('Cookie');
  const sessionId = await verifySessionCookie(cookie, c.env.SESSION_SECRET);

  if (sessionId) {
    await deleteSession(c.env.SESSIONS, sessionId);
  }

  return new Response(null, {
    status: 200,
    headers: {
      'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
    }
  });
});
