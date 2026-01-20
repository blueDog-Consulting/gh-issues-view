# Development Guide

## Quick Start

### First Time Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create GitHub OAuth App**
   - Visit https://github.com/settings/developers
   - Create new OAuth App
   - Set callback URL: `http://localhost:8787/auth/github/callback`

3. **Set up Cloudflare**
   ```bash
   npm run kv:create
   npm run kv:create:preview
   ```
   Update `wrangler.jsonc` with the returned IDs

4. **Configure environment**
   - Copy `.dev.vars.example` to `.dev.vars`
   - Fill in your GitHub and Cloudflare credentials

### Development Workflow

Just run:
```bash
npm run dev
```

This single command will:
1. ✅ Build the project initially
2. ✅ Start the Wrangler dev server
3. ✅ Watch for changes to `.js`, `.jsx`, and `.css` files
4. ✅ Auto-rebuild when you save changes
5. ✅ Keep everything running until you stop it (Ctrl+C)

**That's it!** When you edit CSS or React components:
- Save your file
- Terminal shows "Building..."
- Refresh your browser
- See your changes!

#### Manual Build (if needed)

If you just want to build without running:
```bash
npm run build
```

## Project Structure

```
src/
├── client/              # React frontend
│   ├── components/      # React components
│   ├── utils/          # Utilities (CSV export, etc.)
│   ├── styles.css      # All CSS (auto-injected at build)
│   ├── App.jsx         # Main app component
│   └── index.jsx       # React entry point
└── worker/             # Cloudflare Worker
    ├── routes/         # API and auth routes
    ├── utils/          # Worker utilities
    └── index.js        # Worker entry point
```

## How the Build Works

1. **React Build** (`build.js`)
   - Bundles React app → `dist/app.js`
   - Reads and minifies `src/client/styles.css`

2. **Worker Build**
   - Bundles worker → `dist/worker.js`
   - Embeds both JS and CSS into the worker bundle
   - CSS is injected inline in the HTML `<style>` tag

3. **Result**
   - Single `dist/worker.js` file contains everything
   - Deployed to Cloudflare Workers

## State Persistence

The app now remembers:
- ✅ Selected organization
- ✅ Selected repository
- ✅ Active tab (Issues/PRs)

State is stored in `localStorage` and restored on page reload.

To clear stored state: Click "Change Repository" or logout.

## Common Tasks

### Adding New CSS

1. Edit `src/client/styles.css`
2. If using watch mode, it auto-rebuilds
3. Refresh browser to see changes

### Adding New Component

1. Create component in `src/client/components/`
2. Import and use in your app
3. Rebuild (automatic with watch mode)

### Updating API Routes

1. Edit files in `src/worker/routes/`
2. Rebuild and restart dev server

### Deployment

```bash
# Set production secrets (first time only)
npm run secret:put GITHUB_CLIENT_ID
npm run secret:put GITHUB_CLIENT_SECRET

# Generate SESSION_SECRET (REQUIRED!)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run secret:put SESSION_SECRET

# Deploy
npm run deploy

# Monitor production logs
npm run api:tail
```

**⚠️ Important**: `SESSION_SECRET` must be set or authentication will fail in production with HMAC errors.

### Monitoring Production

View real-time logs from production:
```bash
npm run api:tail
```

This helps debug:
- Authentication issues
- GitHub API errors
- Session problems
- Any runtime errors

## Tips

- Use **two terminals**: one for watch mode, one for dev server
- Browser DevTools → Network tab to debug API calls
- Browser DevTools → Application tab → LocalStorage to see stored state
- Check wrangler logs for server-side errors
