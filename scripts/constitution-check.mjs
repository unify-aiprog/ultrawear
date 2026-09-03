import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'docs/WEB_CONSTITUTION.md',
  'README.md',
  'app/layout.tsx',
  'app/error.tsx',
  'app/sitemap.ts',
  'app/robots.ts',
  'next.config.ts',
  'content-core/contracts.js',
  'content-core/fact-firewall.js',
  'content-core/pipeline.js',
  'lib/sports/contracts.ts',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing constitutional foundation file: ${file}`);
}

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const constitution = fs.existsSync(path.join(root, 'docs/WEB_CONSTITUTION.md')) ? read('docs/WEB_CONSTITUTION.md') : '';
const constitutionRequirements = [
  ['FC means For Community', /FC means For Community/i],
  ['no fabricated sports data', /must never fabricate.*score.*statistic.*result/i],
  ['provider-neutral data', /provider-neutral/i],
  ['accessibility', /Accessibility is a core product requirement/i],
  ['privacy', /Privacy & Respect/i],
  ['ship gate', /The Ship Gate/i],
  ['beyond football', /starting point, not the architectural ceiling/i],
];
for (const [label, pattern] of constitutionRequirements) {
  if (!pattern.test(constitution)) failures.push(`Constitution missing required principle: ${label}`);
}

const layout = fs.existsSync(path.join(root, 'app/layout.tsx')) ? read('app/layout.tsx') : '';
for (const [label, pattern] of [
  ['skip link', /Skip to content/],
  ['FC identity', /FC = FOR COMMUNITY/],
  ['privacy link', /href="\/privacy"/],
  ['terms link', /href="\/terms"/],
]) {
  if (!pattern.test(layout)) failures.push(`Experience standard not enforced in app/layout.tsx: ${label}`);
}

const css = fs.existsSync(path.join(root, 'app/globals.css')) ? read('app/globals.css') : '';
for (const [label, pattern] of [
  ['visible focus', /:focus-visible/],
  ['reduced motion', /prefers-reduced-motion/],
]) {
  if (!pattern.test(css)) failures.push(`Accessibility baseline missing: ${label}`);
}

const nextConfig = fs.existsSync(path.join(root, 'next.config.ts')) ? read('next.config.ts') : '';
for (const [label, pattern] of [
  ['nosniff', /X-Content-Type-Options/],
  ['referrer policy', /Referrer-Policy/],
  ['frame protection', /X-Frame-Options/],
  ['permissions policy', /Permissions-Policy/],
]) {
  if (!pattern.test(nextConfig)) failures.push(`Security baseline missing: ${label}`);
}

const sportsContracts = fs.existsSync(path.join(root, 'lib/sports/contracts.ts')) ? read('lib/sports/contracts.ts') : '';
for (const [label, pattern] of [
  ['source observations', /interface SourceObservation/],
  ['verification state', /VerificationStatus/],
  ['provider-neutral event model', /interface SportsEvent/],
  ['conflict-aware reconciliation', /status: 'conflicted'/],
]) {
  if (!pattern.test(sportsContracts)) failures.push(`Sports trust layer missing: ${label}`);
}

const firewall = fs.existsSync(path.join(root, 'content-core/fact-firewall.js')) ? read('content-core/fact-firewall.js') : '';
for (const [label, pattern] of [
  ['research pack', /buildResearchPack/],
  ['claim verification', /verifyResearchPack/],
  ['unsupported claims', /unsupportedClaimIds/],
  ['conflict detection', /detectConflicts/],
]) {
  if (!pattern.test(firewall)) failures.push(`Content trust layer missing: ${label}`);
}

const packageJson = fs.existsSync(path.join(root, 'package.json')) ? JSON.parse(read('package.json')) : {};
if (!packageJson.scripts?.test) failures.push('Automated content tests are not exposed through package.json');
if (!packageJson.scripts?.['test:sports']) failures.push('Automated sports trust tests are not exposed through package.json');

const sitemap = fs.existsSync(path.join(root, 'app/sitemap.ts')) ? read('app/sitemap.ts') : '';
for (const route of ['/sports', '/catalogue', '/teams', '/fixtures', '/live', '/news', '/about', '/contact', '/privacy', '/terms', '/shop']) {
  if (!sitemap.includes(`'${route}'`)) failures.push(`Sitemap missing constitutional primary route: ${route}`);
}

// Catch hard-coded internal links that point at a path with no Next route.
// Dynamic links containing ${...} are intentionally skipped because their params are resolved at runtime.
const sourceRoots = ['app', 'components'];
const sourceExtensions = new Set(['.tsx', '.ts', '.jsx', '.js', '.html']);
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (sourceExtensions.has(path.extname(entry.name))) files.push(full);
  }
}
sourceRoots.forEach((dir) => walk(path.join(root, dir)));

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const linkPattern = /(?:href|src)=["'](\/[A-Za-z0-9._~!$&'()*+,;=:@%\/-]+)(?:[?#][^"']*)?["']/g;
  for (const match of source.matchAll(linkPattern)) {
    const target = match[1];
    if (target.startsWith('/_next/') || target.startsWith('/assets/')) continue;
    const segments = target.split('/').filter(Boolean);
    const candidates = [];
    const appPath = segments.join('/');
    candidates.push(path.join(root, 'app', appPath, 'page.tsx'));
    candidates.push(path.join(root, 'app', appPath, 'route.ts'));
    if (segments.length) {
      const dynamic = [...segments];
      for (let i = 0; i < dynamic.length; i++) {
        dynamic[i] = `[${dynamic[i].includes('.') ? 'slug' : 'id'}]`;
        candidates.push(path.join(root, 'app', dynamic.join('/'), 'page.tsx'));
      }
    }
    const exists = candidates.some((candidate) => fs.existsSync(candidate));
    if (!exists) failures.push(`Broken internal destination: ${path.relative(root, file)} -> ${target}`);
  }
}

if (failures.length) {
  console.error('\nULTRAWEAR CONSTITUTION CHECK: FAILED\n');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`\n${failures.length} constitutional check(s) failed.`);
  process.exit(1);
}

console.log('ULTRAWEAR CONSTITUTION CHECK: PASSED');
console.log('Community • Utility • Trust • Experience • Accessibility • Integrity • Architecture • Brand • Future • Reality');
