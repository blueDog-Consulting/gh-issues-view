#!/usr/bin/env node
import { spawn } from 'child_process';
import { watch } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

let building = false;
let needsRebuild = false;
let wranglerProcess = null;

async function build() {
  if (building) {
    needsRebuild = true;
    return;
  }

  building = true;
  console.log('🔨 Building...');

  try {
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true
    });

    await new Promise((resolve, reject) => {
      buildProcess.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Build failed with code ${code}`));
      });
    });

    console.log('✅ Build complete');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
  } finally {
    building = false;

    if (needsRebuild) {
      needsRebuild = false;
      setTimeout(() => build(), 100);
    }
  }
}

// Initial build
await build();

// Start wrangler dev
console.log('🚀 Starting Wrangler dev server...');
wranglerProcess = spawn('node', ['scripts/wrangler.js', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

// Watch for changes
const watchPaths = [
  join(rootDir, 'src/client'),
  join(rootDir, 'src/worker')
];

console.log('👀 Watching for changes...\n');

for (const path of watchPaths) {
  watch(path, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.css'))) {
      console.log(`📝 Changed: ${filename}`);
      build();
    }
  });
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  if (wranglerProcess) {
    wranglerProcess.kill('SIGINT');
  }
  process.exit(0);
});

wranglerProcess.on('exit', () => {
  console.log('Wrangler dev server stopped');
  process.exit(0);
});
