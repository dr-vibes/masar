import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const required = [
  'AGENTS.md', 'PROJECT_CONTEXT_AR.md', 'CHANGELOG.md',
  'docs/ROADMAP_AR.md', 'docs/AWS_RUNBOOK_AR.md', 'docs/HISTORY_AR.md',
  'docs/SECURITY_AR.md', 'docs/ARCHITECTURE_AR.md', 'docs/AI_WORKFLOW_AR.md',
  'docs/HANDOFF_AR.md', 'docs/DECISIONS_AR.md', 'docs/CHANGE_TEMPLATE_AR.md',
  'docs/INSTALL_DOCS_AR.md',
];
const missing = required.filter(f => !fs.existsSync(f) || fs.readFileSync(f, 'utf8').trim().length < 100);
if (missing.length) {
  console.error('Missing or empty project documentation:', missing.join(', '));
  process.exit(1);
}
const changeLog = fs.readFileSync('CHANGELOG.md', 'utf8');
if (!/CHG-\d{8}-(?:\d{2}|BASELINE)/.test(changeLog)) {
  console.error('CHANGELOG.md does not have a dated change entry.');
  process.exit(1);
}
// On PRs only: require a CHANGELOG and HANDOFF update whenever any tracked source file changes.
// The base SHA is provided explicitly by the CI workflow; local runs only validate structure.
const base = process.env.DOCS_BASE_SHA;
if (base) {
  if (!/^[0-9a-f]{40}$/.test(base)) throw new Error('DOCS_BASE_SHA must be a full Git commit SHA');
  let changed;
  try {
    changed = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Cannot evaluate changed files; check Git history availability:', error.message);
    process.exit(1);
  }
  const substantive = changed.filter(f => f !== 'CHANGELOG.md' && f !== 'docs/HANDOFF_AR.md');
  if (substantive.length && (!changed.includes('CHANGELOG.md') || !changed.includes('docs/HANDOFF_AR.md'))) {
    console.error('Every PR must update CHANGELOG.md and docs/HANDOFF_AR.md in the same change.');
    process.exit(1);
  }
}
console.log(`Documentation check passed (${required.length} required files).`);
