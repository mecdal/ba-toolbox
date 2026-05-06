// AC Generator (Gherkin BDD).
//
// Each scenario is a card with name + Given/When/Then textareas. addScenario
// injects markup that calls removeScenario by id from an inline onclick — that
// function therefore needs to remain on `window`. renderAC walks the scenarios
// in DOM order and emits canonical Feature/Scenario/Given/When/Then blocks.

import { t } from '../../i18n/index.js';
import { escapeHtml } from '../../core/util.js';

let acScenarioCounter = 0;

export function addScenario() {
  acScenarioCounter += 1;
  const n = acScenarioCounter;
  const wrap = document.getElementById('ac-scenarios');
  if (!wrap) return;
  const div = document.createElement('div');
  div.className = 'ac-scenario';
  div.dataset.scenarioId = String(n);
  div.innerHTML = `
    <div class="ac-scenario-header">
      <span class="ac-scenario-title">${escapeHtml(t('ac.scenario'))} #${n}</span>
      <button class="ac-remove-btn" type="button" onclick="removeScenario(${n})">${escapeHtml(t('ac.remove'))}</button>
    </div>
    <input type="text" class="ac-name" placeholder="${escapeHtml(t('ac.scenario.name.ph'))}">
    <label>${escapeHtml(t('ac.given'))}</label>
    <textarea class="ac-given" rows="2" placeholder="${escapeHtml(t('ac.given.ph'))}"></textarea>
    <label>${escapeHtml(t('ac.when'))}</label>
    <textarea class="ac-when" rows="2" placeholder="${escapeHtml(t('ac.when.ph'))}"></textarea>
    <label>${escapeHtml(t('ac.then'))}</label>
    <textarea class="ac-then" rows="2" placeholder="${escapeHtml(t('ac.then.ph'))}"></textarea>
  `;
  wrap.appendChild(div);
}

export function removeScenario(id) {
  const node = document.querySelector(`.ac-scenario[data-scenario-id="${id}"]`);
  if (node) node.remove();
}

export function renderAC() {
  const feature = document.getElementById('ac-feature').value.trim() || '(feature)';
  const desc = document.getElementById('ac-desc').value.trim();
  let out = `Feature: ${feature}\n`;
  if (desc) out += `  ${desc.split('\n').join('\n  ')}\n`;
  out += '\n';

  const scenarios = document.querySelectorAll('.ac-scenario');
  if (scenarios.length === 0) addScenario();

  document.querySelectorAll('.ac-scenario').forEach((sc) => {
    const name = sc.querySelector('.ac-name').value.trim() || '(scenario)';
    const givenLines = sc.querySelector('.ac-given').value.split('\n').map((s) => s.trim()).filter(Boolean);
    const whenLines  = sc.querySelector('.ac-when').value.split('\n').map((s) => s.trim()).filter(Boolean);
    const thenLines  = sc.querySelector('.ac-then').value.split('\n').map((s) => s.trim()).filter(Boolean);
    out += `  Scenario: ${name}\n`;
    givenLines.forEach((line, i) => out += `    ${i === 0 ? 'Given' : 'And'} ${line}\n`);
    whenLines.forEach((line, i)  => out += `    ${i === 0 ? 'When'  : 'And'} ${line}\n`);
    thenLines.forEach((line, i)  => out += `    ${i === 0 ? 'Then'  : 'And'} ${line}\n`);
    out += '\n';
  });

  document.getElementById('ac-output').value = out.trimEnd();
}
