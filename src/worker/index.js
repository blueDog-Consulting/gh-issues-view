import { Hono } from 'hono';
import { authRoutes } from './routes/auth.js';
import { apiRoutes } from './routes/api.js';
import { html } from './utils/html.js';

const app = new Hono();

// Serve the frontend
app.get('/', (c) => {
  const appJs = process.env.CLIENT_JS || '';
  const appCss = process.env.CLIENT_CSS || '';

  return c.html(html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GitHub Issues Viewer</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
      <style>${appCss}</style>
    </head>
    <body>
      <div id="root"></div>
      <script>${appJs}</script>
    </body>
    </html>
  `);
});

// Auth routes
app.route('/auth', authRoutes);

// API routes
app.route('/api', apiRoutes);

export default app;
