# Quick Start Guide

Get up and running with GitHub Issues Viewer in 5 minutes!

## Step 1: Create GitHub OAuth App (2 minutes)

1. Visit https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `GitHub Issues Viewer - Dev`
   - **Homepage URL**: `http://localhost:8787`
   - **Callback URL**: `http://localhost:8787/auth/github/callback`
4. Click **"Register application"**
5. Copy your **Client ID**
6. Click **"Generate a new client secret"** and copy it

## Step 2: Get Cloudflare Credentials (1 minute)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Copy your **Account ID** from the right sidebar
3. Create an API Token:
   - Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Click "Create Token" → Use "Edit Cloudflare Workers" template
   - Create and copy the token

## Step 3: Install and Configure (2 minutes)

```bash
# Install dependencies
npm install
```

Create `.dev.vars` file (copy from `.dev.vars.example`):

```bash
GITHUB_CLIENT_ID=paste_your_github_client_id
GITHUB_CLIENT_SECRET=paste_your_github_client_secret
SESSION_SECRET=paste_a_random_32_char_string

CLOUDFLARE_ACCOUNT_ID=paste_your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=paste_your_cloudflare_api_token
```

To generate a random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create KV namespaces:

```bash
npm run kv:create
npm run kv:create:preview
```

Update `wrangler.jsonc` with the KV namespace IDs returned from these commands.

## Step 4: Run the App (1 minute)

```bash
npm run dev
```

This automatically:
- Builds the app
- Starts the dev server
- Watches for changes and auto-rebuilds

Visit http://localhost:8787 and sign in with GitHub!

Edit any `.js`, `.jsx`, or `.css` file, save, and refresh the browser to see changes!

## What to Test

1. ✅ Click "Sign in with GitHub"
2. ✅ Select an organization or enter a custom one
3. ✅ Select a repository
4. ✅ View issues in the table
5. ✅ Try filtering by open/closed/all
6. ✅ Click a column header to sort
7. ✅ Use the search box
8. ✅ Click a row to open the issue on GitHub
9. ✅ Export to CSV
10. ✅ Switch to Pull Requests tab and repeat

## Production Deployment

### 1. Create Production OAuth App
Create a **separate** GitHub OAuth App for production:
- Callback URL: `https://your-worker-domain/auth/github/callback`
- Copy the Client ID and Secret

### 2. Set Production Secrets

```bash
# Set GitHub credentials
npm run secret:put GITHUB_CLIENT_ID
npm run secret:put GITHUB_CLIENT_SECRET

# Generate and set SESSION_SECRET (REQUIRED!)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run secret:put SESSION_SECRET
```

### 3. Deploy

```bash
npm run deploy
```

### 4. Monitor Logs

View real-time production logs:
```bash
npm run api:tail
```

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the troubleshooting section for common issues
- Verify all environment variables are set correctly
