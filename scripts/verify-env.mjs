#!/usr/bin/env node
import semver from 'semver';
import { execSync } from 'node:child_process';

/**
 * Environment verification script to validate dependency versions.
 * Ensures Next.js 16, React 19, TypeScript 5.x, and Node 22/24 LTS.
 */

function check(name, range) {
  let result;
  try {
    result = execSync(`npm ls ${name} --json 2>/dev/null || true`, {
      encoding: 'utf8',
    });
  } catch (execError) {
    // This should not happen, but if it does, report and exit.
    console.error(`❌ Failed to run npm ls for ${name}: ${execError.message}`);
    process.exit(1);
  }
  let parsed;
  try {
    parsed = JSON.parse(result || '{}');
  } catch {
    console.error(`❌ Failed to parse package info for ${name}`);
    process.exit(1);
  }
  const version =
    parsed.dependencies?.[name]?.version ||
    parsed.devDependencies?.[name]?.version;
  
  if (!version) {
    console.error(`❌ Missing ${name}`);
    process.exit(1);
  }
  
  if (!semver.satisfies(version, range)) {
    console.error(`❌ Version mismatch: ${name}@${version} not in ${range}`);
    process.exit(1);
  }
  
  console.log(`✅ ${name}@${version} (expected ${range})`);
}

console.log('🔍 Verifying environment...\n');

// Check critical dependencies
check('next', '16.x');
check('react', '19.x');
check('typescript', '>=5.0.0 <6.0.0');
check('@playwright/test', '>=1.48.0');

// Check Node version
console.log(`\n🔍 Node ${process.version}`);
const nodeVersion = process.version.replace(/^v/, '');

if (!semver.satisfies(nodeVersion, '22.x || 24.x')) {
  console.error('❌ Unsupported Node version (expected 22.x or 24.x)');
  process.exit(1);
}

console.log('✅ Node version OK');

console.log('\n✅ All environment checks passed!\n');
