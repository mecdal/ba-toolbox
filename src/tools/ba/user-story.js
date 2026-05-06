// User Story Writer — BABOK-style story builder with two AC modes.
//
// State (acCount, checklistCount, acMode) tracks dynamically-added AC blocks.
// addAcBlock / addChecklistItem inject markup that calls removeAcBlock /
// removeChecklistItem from inline onclick handlers — both must be on `window`.
// buildUserStory composes the final text. copyUserStoryMd / copyUserStoryJira
// post-process that text with regex substitutions for each format's headings.

import { t } from '../../i18n/index.js';

let acCount = 0;
let checklistCount = 0;
let acMode = 'gherkin';

export function setAcMode(mode) {
  acMode = mode;
  document.getElementById('ac-gherkin-mode').style.display = mode === 'gherkin' ? '' : 'none';
  document.getElementById('ac-checklist-mode').style.display = mode === 'checklist' ? '' : 'none';
  document.getElementById('ac-mode-gherkin').classList.toggle('active', mode === 'gherkin');
  document.getElementById('ac-mode-checklist').classList.toggle('active', mode === 'checklist');
}

export function addAcBlock() {
  acCount++;
  const n = acCount;
  const list = document.getElementById('ac-list');
  const block = document.createElement('div');
  block.className = 'ac-block';
  block.dataset.ac = n;
  block.innerHTML = `
    <div class="ac-block-title">${t('us.ac-label')} #${n}</div>
    <button class="ac-remove" onclick="removeAcBlock(${n})" title="Kaldır">✕</button>
    <div class="ac-row">
      <label>${t('us.given')}</label>
      <input type="text" id="us-given-${n}" placeholder="${t('us.given.ph')}">
    </div>
    <div class="ac-row">
      <label>${t('us.when')}</label>
      <input type="text" id="us-when-${n}" placeholder="${t('us.when.ph')}">
    </div>
    <div class="ac-row">
      <label>${t('us.then')}</label>
      <input type="text" id="us-then-${n}" placeholder="${t('us.then.ph')}">
    </div>`;
  list.appendChild(block);
}

export function removeAcBlock(n) {
  const block = document.querySelector(`.ac-block[data-ac="${n}"]`);
  if (block) block.remove();
}

export function addChecklistItem() {
  checklistCount++;
  const n = checklistCount;
  const list = document.getElementById('ac-checklist-list');
  const item = document.createElement('div');
  item.className = 'checklist-item';
  item.dataset.cl = n;
  item.innerHTML = `
    <input type="text" id="us-cl-${n}" data-i18n-placeholder="us.checklist-item.ph" placeholder="${t('us.checklist-item.ph') || 'Kabul kriteri...'}">
    <button class="ac-remove" onclick="removeChecklistItem(${n})" title="Kaldır">✕</button>`;
  list.appendChild(item);
}

export function removeChecklistItem(n) {
  const item = document.querySelector(`.checklist-item[data-cl="${n}"]`);
  if (item) item.remove();
}

export function toggleInvest(btn) {
  btn.classList.toggle('active');
  const score = document.querySelectorAll('.invest-chip.active').length;
  const scoreEl = document.getElementById('invest-score');
  scoreEl.textContent = `${score}/6`;
  scoreEl.className = 'invest-score ' + (score < 4 ? 'low' : score < 6 ? 'mid' : 'high');
}

function getInvestScore() {
  const chips = document.querySelectorAll('.invest-chip.active');
  return Array.from(chips).map((c) => c.dataset.invest).join('');
}

export function buildUserStory() {
  const storyId = document.getElementById('us-story-id').value.trim();
  const storyTitle = document.getElementById('us-story-title').value.trim();
  const epic = document.getElementById('us-epic').value.trim();
  const priority = document.getElementById('us-priority').value;
  const points = document.getElementById('us-points').value;
  const role = document.getElementById('us-role').value.trim();
  const action = document.getElementById('us-action').value.trim();
  const benefit = document.getElementById('us-benefit').value.trim();

  if (!role && !action && !benefit) return;

  let text = '';

  if (storyId || storyTitle) {
    text += `${storyId ? '[' + storyId + '] ' : ''}${storyTitle || ''}\n`;
  }
  if (epic) text += `Epic: ${epic}\n`;
  if (priority) {
    const pMap = { must: 'Must Have', should: 'Should Have', could: 'Could Have', wont: "Won't Have" };
    text += `Priority: ${pMap[priority] || priority}\n`;
  }
  if (points) text += `Story Points: ${points}\n`;
  if (storyId || storyTitle || epic || priority || points) text += '\n';

  text += `As a ${role || '...'},\nI want to ${action || '...'},\nSo that ${benefit || '...'}.`;

  if (acMode === 'gherkin') {
    const blocks = document.querySelectorAll('#ac-list .ac-block');
    if (blocks.length > 0) {
      text += '\n\nAcceptance Criteria:';
      blocks.forEach((block) => {
        const n = block.dataset.ac;
        const given = document.getElementById(`us-given-${n}`)?.value.trim() || '...';
        const when  = document.getElementById(`us-when-${n}`)?.value.trim()  || '...';
        const then  = document.getElementById(`us-then-${n}`)?.value.trim()  || '...';
        text += `\n  Given ${given},\n  When ${when},\n  Then ${then}.`;
      });
    }
  } else {
    const items = document.querySelectorAll('#ac-checklist-list .checklist-item');
    if (items.length > 0) {
      text += '\n\nAcceptance Criteria:';
      items.forEach((item) => {
        const n = item.dataset.cl;
        const val = document.getElementById(`us-cl-${n}`)?.value.trim() || '...';
        text += `\n  [ ] ${val}`;
      });
    }
  }

  const rules = document.getElementById('us-business-rules').value.trim();
  const nfr = document.getElementById('us-nfr').value.trim();
  const deps = document.getElementById('us-dependencies').value.trim();
  if (rules) text += `\n\nBusiness Rules:\n${rules}`;
  if (nfr) text += `\n\nNon-Functional Requirements:\n${nfr}`;
  if (deps) text += `\n\nDependencies & Assumptions:\n${deps}`;

  const invest = getInvestScore();
  if (invest) text += `\n\nINVEST: ${invest} (${invest.length}/6)`;

  const dodItems = document.querySelectorAll('.dod-item');
  const dodChecked = Array.from(dodItems).filter((i) => i.checked);
  if (dodChecked.length > 0) {
    text += '\n\nDefinition of Done:';
    dodChecked.forEach((item) => {
      text += `\n  [x] ${item.parentElement.textContent.trim()}`;
    });
  }

  const out = document.getElementById('us-output');
  out.value = text;
  document.getElementById('us-output-card').style.display = '';
}

export function clearUserStory() {
  ['us-role','us-action','us-benefit','us-story-id','us-story-title','us-epic','us-business-rules','us-nfr','us-dependencies'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('us-priority').value = '';
  document.getElementById('us-points').value = '';
  document.getElementById('ac-list').innerHTML = '';
  document.getElementById('ac-checklist-list').innerHTML = '';
  acCount = 0;
  checklistCount = 0;
  document.querySelectorAll('.invest-chip').forEach((c) => c.classList.remove('active'));
  const scoreEl = document.getElementById('invest-score');
  scoreEl.textContent = '0/6';
  scoreEl.className = 'invest-score';
  document.querySelectorAll('.dod-item').forEach((i) => { i.checked = false; });
  document.getElementById('us-output').value = '';
  document.getElementById('us-output-card').style.display = 'none';
}

export function copyUserStory() {
  const out = document.getElementById('us-output');
  if (!out.value) return;
  navigator.clipboard.writeText(out.value);
}

export function copyUserStoryMd() {
  const out = document.getElementById('us-output');
  if (!out.value) return;
  let md = out.value;
  md = md.replace(/^(\[.+?\].*)$/m, '## $1');
  md = md.replace(/^(As a .+)$/m, '**$1**');
  md = md.replace(/^(I want to .+)$/m, '**$1**');
  md = md.replace(/^(So that .+)$/m, '**$1**');
  md = md.replace(/^(Acceptance Criteria:)$/m, '\n### $1');
  md = md.replace(/^(Business Rules:)$/m, '\n### $1');
  md = md.replace(/^(Non-Functional Requirements:)$/m, '\n### $1');
  md = md.replace(/^(Dependencies & Assumptions:)$/m, '\n### $1');
  md = md.replace(/^(Definition of Done:)$/m, '\n### $1');
  md = md.replace(/^  (Given|When|Then) /gm, '- **$1** ');
  md = md.replace(/^  \[( |x)\] /gm, '- [$1] ');
  navigator.clipboard.writeText(md);
}

export function copyUserStoryJira() {
  const out = document.getElementById('us-output');
  if (!out.value) return;
  let jira = out.value;
  jira = jira.replace(/^(\[.+?\].*)$/m, 'h2. $1');
  jira = jira.replace(/^(Acceptance Criteria:)$/m, 'h3. $1');
  jira = jira.replace(/^(Business Rules:)$/m, 'h3. $1');
  jira = jira.replace(/^(Non-Functional Requirements:)$/m, 'h3. $1');
  jira = jira.replace(/^(Dependencies & Assumptions:)$/m, 'h3. $1');
  jira = jira.replace(/^(Definition of Done:)$/m, 'h3. $1');
  jira = jira.replace(/^  (Given|When|Then) /gm, '* *$1* ');
  jira = jira.replace(/^  \[( |x)\] /gm, '* ');
  navigator.clipboard.writeText(jira);
}
