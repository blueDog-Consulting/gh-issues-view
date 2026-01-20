# GitHub Issues Viewer

A web application to view and export GitHub issues and pull requests, deployed on Cloudflare Workers.

## Features

### Authentication & Security
- 🔐 Secure GitHub OAuth authentication
- 🔒 HTTP-only encrypted cookies with HMAC signatures
- 💾 Server-side token storage in Cloudflare KV
- 🌐 Web Crypto API for session management
- 🔑 Support for both public and private repositories

### Data Display
- 📊 View issues and pull requests in separate, sortable tables
- 🔍 Search within tables and filter by state (open, closed, all)
- 📄 Pagination with configurable rows per page (25, 50, 100)
- 🏷️ Type column showing "Issue" or "Pull Request"
- 📝 Description column (truncated to 25 chars, full text on hover and in CSV)
- 🎯 Click any row to open issue/PR on GitHub in new tab

### Export & Data Management
- 📥 Export **all pages** to CSV (not just current page)
- 💾 Automatic background fetching of all data
- 📊 All columns included in export
- 💿 State persistence (selected org/repo saved to localStorage)

### Organization & Usability
- 👤 Personal GitHub account shown first
- 📋 Organizations sorted alphabetically
- 🕒 Repositories sorted by last modified (most recent first)
- 🔄 Auto-rebuild on file changes during development
- 🎨 Clean, minimal UI with Pico CSS

## Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- A Cloudflare account
- A GitHub account

## Setup

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: GitHub Issues Viewer (or your preferred name)
   - **Homepage URL**: `http://localhost:8787` (for development)
   - **Authorization callback URL**: `http://localhost:8787/auth/github/callback`
4. Click "Register application"
5. Note your **Client ID**
6. Generate a new **Client Secret** and note it

For production, you'll need to update these URLs to your Cloudflare Worker domain.

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Cloudflare Credentials

Get your Cloudflare Account ID and API Token:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Copy your **Account ID** from the right sidebar (Workers & Pages overview)
3. Create an API Token:
   - Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token"
   - Use "Edit Cloudflare Workers" template
   - Select your account and click "Continue to summary"
   - Click "Create Token" and copy it

Add these to your `.dev.vars` file along with the other credentials.

### 4. Configure Cloudflare KV

Create a KV namespace for session storage:

```bash
# Create production namespace
npm run kv:create

# Create preview namespace for development
npm run kv:create:preview
```

Update `wrangler.jsonc` with the IDs returned from these commands:

```jsonc
"kv_namespaces": [
  {
    "binding": "SESSIONS",
    "id": "your-production-id-here",
    "preview_id": "your-preview-id-here"
  }
]
```

### 5. Set Environment Variables

Create a `.dev.vars` file in the root directory (copy from `.dev.vars.example`):

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_random_secret_key_at_least_32_chars

CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

For production deployment, set these as Wrangler secrets (GITHUB vars only, not Cloudflare vars):

```bash
npm run secret:put GITHUB_CLIENT_ID
npm run secret:put GITHUB_CLIENT_SECRET
npm run secret:put SESSION_SECRET
```

**Note**: Generate a strong random string for `SESSION_SECRET`. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or use the link in `.dev.vars.example` to generate one online.

## Development

Start the development server:

```bash
npm run dev
```

This single command will:
- Build the application
- Start the Wrangler development server
- Watch for file changes and auto-rebuild
- Load your `.dev.vars` environment variables

The application will be available at `http://localhost:8787`

When you edit files (`.js`, `.jsx`, `.css`), the app auto-rebuilds. Just refresh your browser to see changes!

## Deployment

### 1. Set Production Secrets

Set your GitHub credentials and session secret as Cloudflare secrets (these are separate from .dev.vars):

```bash
# Set GitHub OAuth credentials (from production OAuth app)
npm run secret:put GITHUB_CLIENT_ID
# Enter your GitHub Client ID when prompted

npm run secret:put GITHUB_CLIENT_SECRET
# Enter your GitHub Client Secret when prompted

# Generate and set SESSION_SECRET (REQUIRED!)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output, then:
npm run secret:put SESSION_SECRET
# Paste the generated secret when prompted
```

**⚠️ IMPORTANT**: The `SESSION_SECRET` **must** be set in production or authentication will fail with an HMAC error. Generate a strong random secret using the command above.

### 2. Update GitHub OAuth App

Create a new GitHub OAuth App for production (or update your existing one):
- **Homepage URL**: `https://github-issues-viewer.your-subdomain.workers.dev`
- **Authorization callback URL**: `https://github-issues-viewer.your-subdomain.workers.dev/auth/github/callback`

Use the Client ID and Secret from this production OAuth app when setting the secrets above.

### 3. Deploy to Cloudflare Workers

```bash
npm run deploy
```

The deploy script will automatically build and deploy your application using the Cloudflare credentials from your `.dev.vars` file.

### 4. Monitor Production Logs

To view real-time logs from your deployed worker:

```bash
npm run api:tail
```

This connects to your production worker and streams logs, useful for debugging authentication issues or API errors.

## Project Structure

```
github-issues-viewer/
├── src/
│   ├── client/              # React frontend
│   │   ├── components/      # React components
│   │   │   ├── LoginPage.jsx        # GitHub login page
│   │   │   ├── OrgSelector.jsx      # Organization selector (sorted)
│   │   │   ├── RepoSelector.jsx     # Repository selector (by last modified)
│   │   │   ├── IssuesView.jsx       # Issues table with export
│   │   │   ├── PullRequestsView.jsx # PRs table with export
│   │   │   └── DataTable.jsx        # Reusable sortable table
│   │   ├── utils/
│   │   │   └── csv.js       # CSV export utility
│   │   ├── styles.css       # All CSS (auto-injected at build time)
│   │   ├── App.jsx          # Main app with localStorage persistence
│   │   └── index.jsx        # React entry point
│   └── worker/              # Cloudflare Worker
│       ├── routes/
│       │   ├── auth.js      # GitHub OAuth with Web Crypto API
│       │   └── api.js       # GitHub API proxy with User-Agent
│       ├── utils/
│       │   ├── html.js      # HTML template helper
│       │   └── session.js   # Session management (Web Crypto)
│       └── index.js         # Worker entry point
├── scripts/
│   ├── wrangler.js          # Wrangler wrapper with env loading
│   └── watch.js             # File watcher for auto-rebuild
├── build.js                 # Build script (bundles JS + CSS)
├── package.json
├── wrangler.jsonc           # Cloudflare Worker config
├── README.md                # This file
├── QUICKSTART.md            # 5-minute setup guide
└── DEV-GUIDE.md             # Development workflow guide
```

## How It Works

### Authentication Flow

1. User clicks "Sign in with GitHub"
2. App redirects to GitHub OAuth
3. User authorizes the application
4. GitHub redirects back with an authorization code
5. Worker exchanges code for access token
6. Worker creates encrypted session using **Web Crypto API**
7. Session stored in **Cloudflare KV** with HMAC-signed cookie
8. HTTP-only secure cookie set
9. User is redirected to the application

### Data Flow

1. Frontend makes authenticated requests to `/api/*` endpoints
2. Worker verifies HMAC-signed session cookie
3. Worker retrieves access token from Cloudflare KV
4. Worker proxies requests to GitHub API with User-Agent header
5. GitHub returns paginated data
6. Worker returns data to frontend
7. Frontend renders in sortable, filterable tables
8. User can:
   - **Search** within tables
   - **Sort** by clicking column headers
   - **Filter** by state (open/closed/all)
   - **Paginate** with configurable page size
   - **Export all pages** to CSV
   - **Click rows** to open on GitHub

### Build Process

1. **React app** bundled to `dist/app.js`
2. **CSS** read from `src/client/styles.css`, minified
3. **Worker** bundled to `dist/worker.js` with embedded JS & CSS
4. **Watch mode** monitors files and auto-rebuilds on changes
5. **Worker serves** HTML with inline CSS and JS

### Security Features

- **Web Crypto API**: Modern cryptographic operations
- **HTTP-only cookies**: Prevents XSS attacks from stealing tokens
- **Secure flag**: Cookies only sent over HTTPS in production
- **HMAC signatures**: Session cookies cryptographically signed with SESSION_SECRET
- **Server-side token storage**: Access tokens never exposed to client
- **Cloudflare KV**: Distributed, secure session storage
- **30-day session expiration**: Automatic cleanup of old sessions
- **User-Agent required**: All GitHub API requests include proper headers

## Testing the Application

### Test Authentication
1. Navigate to `http://localhost:8787`
2. Click "Sign in with GitHub"
3. Authorize the application
4. Verify you're redirected back and see your username
5. Refresh the page - verify you stay logged in

### Test Organization Selection
1. After authentication, verify your **personal account appears first**
2. Verify other organizations are **sorted alphabetically**
3. Try selecting your personal account
4. Try selecting an organization you're a member of
5. Try entering a custom organization name
6. Refresh the page - verify your selection persists

### Test Repository Selection
1. Select an organization
2. Verify repositories are **sorted by last modified** (newest first)
3. Use the search to filter repositories
4. Select a repository with issues and pull requests
5. Refresh the page - verify your selection persists

### Test Issues View
1. Verify issues are displayed in a table
2. Verify **Type column shows "Issue"**
3. Verify **Description column** shows truncated text (25 chars)
4. Hover over description - verify full text appears
5. Test the **state filter** (open/closed/all)
6. Test **rows per page selector** (25, 50, 100)
7. Test **sorting** by clicking column headers
8. Test **searching** within the table
9. Click on an issue row - verify it opens GitHub in new tab
10. Test **pagination** if the repo has many issues

### Test Pull Requests View
1. Switch to the "Pull Requests" tab
2. Verify **Type column shows "Pull Request"**
3. Repeat all tests from Issues View
4. Verify pull requests (not issues) are displayed

### Test CSV Export (All Pages)
1. Select a repo with many issues/PRs (more than one page)
2. Click **"Export All to CSV"**
3. Verify button shows **"Exporting all pages..."** during export
4. Open the downloaded CSV file
5. Verify **all columns** are present: Number, Type, Title, Description, Author, Labels, Created Date, Status, Assignees, URL
6. Verify **Description shows full text** (not truncated)
7. Verify **all pages of data** are included (not just current page)
8. Verify filename includes count (e.g., `owner-repo-issues-open-142-items.csv`)
9. Verify data is properly escaped (commas, quotes, newlines)

### Test State Persistence
1. Select an organization and repository
2. Navigate through issues/PRs
3. Refresh the browser
4. Verify you're still on the same org/repo (not back to org selection)
5. Click "Change Repository" - verify it clears the selection
6. Logout - verify selection is cleared

### Test Development Workflow
1. Run `npm run dev`
2. Edit `src/client/styles.css` (change a color)
3. Verify terminal shows "🔨 Building..." then "✅ Build complete"
4. Refresh browser - verify changes appear
5. Edit a `.jsx` file
6. Verify auto-rebuild happens
7. Refresh browser - verify changes appear

## Troubleshooting

### "Unauthorized" or "Auth failed" errors

**Development:**
- Check that your GitHub OAuth credentials are correct in `.dev.vars`
- Verify the callback URL **exactly matches** in GitHub settings: `http://localhost:8787/auth/github/callback`
- Check that `SESSION_SECRET` is set in `.dev.vars`
- Clear your browser cookies and try again
- Check terminal for detailed error messages

**Production:**
- Verify `SESSION_SECRET` is set as a Wrangler secret: `npm run secret:put SESSION_SECRET`
- Check that production GitHub OAuth credentials are set correctly
- Verify callback URL in GitHub OAuth app matches your production domain
- Use `npm run api:tail` to view real-time production logs

### HMAC key length errors (Production)
```
DataError: Imported HMAC key length (0) must be a non-zero value...
```
This means `SESSION_SECRET` is not set in production. Fix:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run secret:put SESSION_SECRET
# Paste the generated secret
```

### "Request forbidden by administrative rules" errors
- This was a missing `User-Agent` header issue - should be fixed in current version
- If you see this, verify you're running the latest build

### No repositories showing
- Verify you have access to repositories in the selected organization
- Check browser console (F12) for API errors
- Check terminal for server-side errors
- Try selecting your personal account instead

### Build errors
- Ensure you're using Node.js 18+
- Delete `node_modules`, `dist`, and `.wrangler` folders
- Run `npm install` again
- Check that all dependencies installed successfully

### Sharp installation errors (during npm install)
- Already handled via npm overrides in `package.json`
- Sharp is replaced with `noop-package` since we don't need image processing
- If you still see errors, check `package.json` has: `"overrides": { "sharp": "npm:noop-package@^1.0.0" }`

### KV namespace errors
- Verify KV namespace IDs in `wrangler.jsonc` are correct (not "placeholder")
- Make sure you've created both production and preview namespaces
- Check that SESSIONS binding is correctly configured
- Run `npm run kv:create` and `npm run kv:create:preview` if needed

### Watch mode not working
- Check that `scripts/watch.js` exists and is executable
- Verify you're editing files in `src/client/` or `src/worker/`
- Check terminal for build errors
- Try stopping (`Ctrl+C`) and restarting `npm run dev`

### State not persisting after reload
- Check browser console → Application tab → LocalStorage
- Look for `selectedOrg` and `selectedRepo` entries
- If missing, check for browser privacy settings blocking localStorage
- Try in a different browser

### CSS not applying
- Check that `src/client/styles.css` exists
- Run `npm run build` manually and check `dist/worker.js` contains CSS
- View page source in browser - look for `<style>` tag after Pico CSS link
- Clear browser cache and hard reload (Ctrl+Shift+R / Cmd+Shift+R)

## API Endpoints

### Authentication
- `GET /auth/github` - Start GitHub OAuth flow
- `GET /auth/github/callback` - OAuth callback (exchanges code for token)
- `GET /auth/user` - Get current user (returns user info or 401)
- `POST /auth/logout` - Logout (clears session cookie and KV)

### API (All require authentication via session cookie)
- `GET /api/orgs` - Get user's organizations (personal account + orgs)
- `GET /api/orgs/:org/repos` - Get repositories for an organization (max 100)
- `GET /api/repos/:owner/:repo/issues?state=open&page=1&per_page=30` - Get issues
  - Query params: `state` (open/closed/all), `page`, `per_page`
  - Returns: `{ data: [...], pagination: { prev, next, first, last } }`
  - Filters out pull requests from response
- `GET /api/repos/:owner/:repo/pulls?state=open&page=1&per_page=30` - Get pull requests
  - Query params: `state` (open/closed/all), `page`, `per_page`
  - Returns: `{ data: [...], pagination: { prev, next, first, last } }`

**Note**: All API endpoints include `User-Agent: GitHub-Issues-Viewer` header as required by GitHub API.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
