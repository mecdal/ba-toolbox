// Use Case Writer (Cockburn format).
//
// Composes a structured Markdown document from the form fields:
// id/name/actor/goal/scope/level + pre/post/main/extension flows. Multi-line
// inputs (preconditions, main steps, etc.) are split into numbered or bulleted
// lists in the output.

import { t } from '../../i18n/index.js';
import { copyToClipboard } from '../../core/util.js';

function getUseCaseModel() {
  const splitLines = (s) => (s || '').split('\n').map((l) => l.trim()).filter(Boolean);
  return {
    id: document.getElementById('uc-id').value.trim() || 'UC-XXX',
    name: document.getElementById('uc-name').value.trim(),
    actor: document.getElementById('uc-actor').value.trim(),
    goal: document.getElementById('uc-goal').value.trim(),
    scope: document.getElementById('uc-scope').value.trim(),
    level: document.getElementById('uc-level').value,
    pre:  splitLines(document.getElementById('uc-pre').value),
    post: splitLines(document.getElementById('uc-post').value),
    main: splitLines(document.getElementById('uc-main').value),
    ext:  splitLines(document.getElementById('uc-ext').value),
    trigger: document.getElementById('uc-trigger').value.trim(),
  };
}

function useCaseToMarkdown() {
  const m = getUseCaseModel();
  const levelLabel = ({
    'user-goal':   t('uc.level.user'),
    'summary':     t('uc.level.summary'),
    'subfunction': t('uc.level.subfn'),
  })[m.level] || m.level;

  let md = `# ${m.id}: ${m.name || '(name)'}\n\n`;
  if (m.scope) md += `**${t('uc.scope')}:** ${m.scope}\n\n`;
  md += `**${t('uc.level')}:** ${levelLabel}\n\n`;
  md += `**${t('uc.actor')}:** ${m.actor || '(actor)'}\n\n`;
  md += `**${t('uc.goal')}:** ${m.goal || '(goal)'}\n\n`;
  if (m.pre.length)  md += `### ${t('uc.preconditions')}\n${m.pre.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n`;
  if (m.trigger)     md += `**${t('uc.trigger')}:** ${m.trigger}\n\n`;
  md += `### ${t('uc.main')}\n${m.main.map((s, i) => `${i + 1}. ${s}`).join('\n') || '_(empty)_'}\n\n`;
  if (m.ext.length)  md += `### ${t('uc.ext')}\n${m.ext.map((e) => `- ${e}`).join('\n')}\n\n`;
  if (m.post.length) md += `### ${t('uc.postconditions')}\n${m.post.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n`;
  return md;
}

export function renderUseCase() {
  document.getElementById('uc-output').value = useCaseToMarkdown();
}

export function copyUseCaseMd() {
  const md = useCaseToMarkdown();
  document.getElementById('uc-output').value = md;
  copyToClipboard(md, document.querySelector('#panel-use-case .btn-secondary'));
}

export function clearUseCase() {
  ['uc-id','uc-name','uc-actor','uc-goal','uc-scope','uc-trigger','uc-pre','uc-post','uc-main','uc-ext','uc-output']
    .forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
}
