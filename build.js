import esbuild from 'esbuild';
import { readFileSync } from 'fs';

// Build the React frontend
await esbuild.build({
  entryPoints: ['src/client/index.jsx'],
  bundle: true,
  format: 'iife',
  outfile: 'dist/app.js',
  jsx: 'automatic',
  minify: true,
  loader: {
    '.jsx': 'jsx'
  }
});

// Read and minify CSS
const appCss = readFileSync('src/client/styles.css', 'utf-8')
  .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
  .replace(/\s+/g, ' ')              // Collapse whitespace
  .trim();

// Build the Cloudflare Worker
await esbuild.build({
  entryPoints: ['src/worker/index.js'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/worker.js',
  platform: 'neutral',
  external: ['__STATIC_CONTENT_MANIFEST'],
  define: {
    'process.env.CLIENT_JS': JSON.stringify(readFileSync('dist/app.js', 'utf-8')),
    'process.env.CLIENT_CSS': JSON.stringify(appCss)
  },
  minify: true
});

console.log('✅ Build complete!');
