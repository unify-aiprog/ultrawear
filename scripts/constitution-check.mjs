import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const requiredFiles = [
  'docs/WEB_CONSTITUTION.md','README.md','app/layout.tsx','app/error.tsx','app/sitemap.ts','app/robots.ts','next.config.ts',
  'content-core/contracts.js','content-core/fact-firewall.js','content-core/pipeline.js','content-core/store.js','content-core/editorial-service.js',
  'lib/sports/contracts.ts','lib/sports/persistence.ts','lib/ingest/revalidation.ts','app/api/cron/sports/revalidate/route.ts',
  'lib/trends/contracts.ts','lib/trends/store.ts','lib/privacy/consent.ts','lib/community/moderation.ts','lib/commerce/editorial-separation.ts',
  'supabase/constitutional-platform.sql', '.github/workflows/sports-revalidation.yml',
];
for (const file of requiredFiles) if (!fs.existsSync(path.join(root, file))) failures.push(`Missing constitutional foundation file: ${file}`);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const constitution = fs.existsSync(path.join(root, 'docs/WEB_CONSTITUTION.md')) ? read('docs/WEB_CONSTITUTION.md') : '';
for (const [label, pattern] of [
  ['FC means For Community',/FC means For Community/i],['no fabricated sports data',/must never fabricate.*score.*statistic.*result/i],['provider-neutral data',/provider-neutral/i],
  ['accessibility',/Accessibility is a core product requirement/i],['privacy',/Privacy & Respect/i],['ship gate',/The Ship Gate/i],['beyond football',/starting point, not the architectural ceiling/i],
]) if (!pattern.test(constitution)) failures.push(`Constitution missing required principle: ${label}`);
const layout = fs.existsSync(path.join(root, 'app/layout.tsx')) ? read('app/layout.tsx') : '';
for (const [label, pattern] of [['skip link',/Skip to content/],['FC identity',/FC = FOR COMMUNITY/],['privacy link',/href="\/privacy"/],['terms link',/href="\/terms"/]]) if (!pattern.test(layout)) failures.push(`Experience standard not enforced in app/layout.tsx: ${label}`);
const css = fs.existsSync(path.join(root, 'app/globals.css')) ? read('app/globals.css') : '';
for (const [label, pattern] of [['visible focus',/:focus-visible/],['reduced motion',/prefers-reduced-motion/]]) if (!pattern.test(css)) failures.push(`Accessibility baseline missing: ${label}`);
const nextConfig = fs.existsSync(path.join(root, 'next.config.ts')) ? read('next.config.ts') : '';
for (const [label, pattern] of [['nosniff',/X-Content-Type-Options/],['referrer policy',/Referrer-Policy/],['frame protection',/X-Frame-Options/],['permissions policy',/Permissions-Policy/]]) if (!pattern.test(nextConfig)) failures.push(`Security baseline missing: ${label}`);
const sports = read('lib/sports/contracts.ts');
for (const [label, pattern] of [['source observations',/interface SourceObservation/],['verification state',/VerificationStatus/],['provider-neutral event model',/interface SportsEvent/],['source priority',/SOURCE_PRIORITY/],['conflict-aware reconciliation',/status: conflicts.length \? 'conflicted'/]]) if (!pattern.test(sports)) failures.push(`Sports trust layer missing: ${label}`);
const revalidation = read('lib/ingest/revalidation.ts');
for (const [label, pattern] of [['provider adapter',/SportsProviderAdapter/],['persistent observations',/sports_source_observations/],['reconciliation run',/sports_reconciliation_runs/],['freshness window',/freshnessAt/]]) if (!pattern.test(revalidation)) failures.push(`Sports revalidation layer missing: ${label}`);
const firewall = read('content-core/fact-firewall.js');
for (const [label, pattern] of [['research pack',/buildResearchPack/],['claim verification',/verifyResearchPack/],['unsupported claims',/unsupportedClaimIds/],['conflict detection',/detectConflicts/]]) if (!pattern.test(firewall)) failures.push(`Content trust layer missing: ${label}`);
const editorial = read('content-core/editorial-service.js');
for (const [label, pattern] of [['review gate',/verified research pack is required/],['persist story',/saveStory/],['audit trail',/appendStoryAudit/]]) if (!pattern.test(editorial)) failures.push(`Editorial workflow missing: ${label}`);
const privacy = read('lib/privacy/consent.ts');
for (const [label, pattern] of [['purpose consent',/ConsentPurpose/],['consent enforcement',/canTrack/],['coarse location',/coarseLocation/]]) if (!pattern.test(privacy)) failures.push(`Privacy layer missing: ${label}`);
const moderation = read('lib/community/moderation.ts');
for (const [label, pattern] of [['moderation states',/ModerationStatus/],['moderation transition',/canModerate/]]) if (!pattern.test(moderation)) failures.push(`Community governance missing: ${label}`);
const commerce = read('lib/commerce/editorial-separation.ts');
if (!/CommercialLabel/.test(commerce) || !/editorialIndependence/.test(commerce)) failures.push('Commercial/editorial separation missing');
const packageJson = fs.existsSync(path.join(root, 'package.json')) ? JSON.parse(read('package.json')) : {};
for (const script of ['test','test:sports','test:platform']) if (!packageJson.scripts?.[script]) failures.push(`Automated test script missing: ${script}`);
const schema = read('supabase/constitutional-platform.sql');
for (const table of ['sports_source_observations','sports_reconciliation_runs','content_stories','content_audit_log','content_claims','trend_signals','editorial_opportunities']) if (!schema.includes(`create table if not exists ${table}`)) failures.push(`Persistence schema missing: ${table}`);
const sitemap = read('app/sitemap.ts');
for (const route of ['/sports','/catalogue','/teams','/fixtures','/live','/news','/about','/contact','/privacy','/terms','/shop']) if (!sitemap.includes(`'${route}'`)) failures.push(`Sitemap missing constitutional primary route: ${route}`);

const sourceRoots = ['app','components']; const sourceExtensions = new Set(['.tsx','.ts','.jsx','.js','.html']); const files = [];
function walk(dir) { if (!fs.existsSync(dir)) return; for (const entry of fs.readdirSync(dir,{withFileTypes:true})) { if (entry.name === 'node_modules' || entry.name === '.next') continue; const full=path.join(dir,entry.name); if (entry.isDirectory()) walk(full); else if (sourceExtensions.has(path.extname(entry.name))) files.push(full); } }
sourceRoots.forEach((dir)=>walk(path.join(root,dir)));
for (const file of files) { const source=fs.readFileSync(file,'utf8'); const linkPattern=/(?:href|src)=["'](\/[A-Za-z0-9._~!$&'()*+,;=:@%\/-]+)(?:[?#][^"']*)?["']/g; for (const match of source.matchAll(linkPattern)) { const target=match[1]; if (target.startsWith('/_next/')||target.startsWith('/assets/')) continue; const segments=target.split('/').filter(Boolean); const candidates=[path.join(root,'app',segments.join('/'),'page.tsx'),path.join(root,'app',segments.join('/'),'route.ts')]; if (segments.length) for (let i=0;i<segments.length;i++){const dynamic=[...segments];dynamic[i]=`[${dynamic[i].includes('.')?'slug':'id'}]`;candidates.push(path.join(root,'app',dynamic.join('/'),'page.tsx'));} if (!candidates.some((candidate)=>fs.existsSync(candidate))) failures.push(`Broken internal destination: ${path.relative(root,file)} -> ${target}`); } }
if (failures.length) { console.error('\nULTRAWEAR CONSTITUTION CHECK: FAILED\n'); for (const failure of failures) console.error(`- ${failure}`); console.error(`\n${failures.length} constitutional check(s) failed.`); process.exit(1); }
console.log('ULTRAWEAR CONSTITUTION CHECK: PASSED');
console.log('Community • Utility • Trust • Experience • Accessibility • Integrity • Architecture • Brand • Future • Reality');
