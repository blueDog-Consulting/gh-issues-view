#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .dev.vars if it exists
const devVarsPath = join(rootDir, '.dev.vars');
const envVars = { ...process.env };

if (existsSync(devVarsPath)) {
  const devVars = readFileSync(devVarsPath, 'utf-8');

  devVars.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim() && !line.trim().startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();

      if (key && value) {
        envVars[key.trim()] = value;
      }
    }
  });

  console.log('✓ Loaded environment variables from .dev.vars');
} else {
  console.warn('⚠ Warning: .dev.vars file not found. Using system environment variables only.');
}

// Get wrangler command arguments (everything after 'node scripts/wrangler.js')
const wranglerArgs = process.argv.slice(2);

// Spawn wrangler with environment variables
const wrangler = spawn('npx', ['wrangler', ...wranglerArgs], {
  env: envVars,
  stdio: 'inherit',
  shell: true
});

wrangler.on('exit', (code) => {
  process.exit(code);
});
