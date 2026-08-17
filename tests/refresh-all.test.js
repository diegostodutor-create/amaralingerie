const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
const start = source.indexOf('async function refreshAll()');
const end = source.indexOf('function totalOp', start);
assert.notEqual(start, -1, 'refreshAll must exist');
assert.notEqual(end, -1, 'refreshAll end marker must exist');

const cache = { orders: [{ id: 'cached-order' }] };
const warning = {
  textContent: '',
  classList: {
    hidden: true,
    add(name) { if (name === 'hidden') this.hidden = true; },
    remove(name) { if (name === 'hidden') this.hidden = false; },
  },
};
const rendered = [];
const renderNames = [
  'renderDashboard', 'renderOrders', 'renderProduction', 'renderQuality',
  'renderStock', 'renderShipments', 'renderCadastros', 'renderFicha',
];
const renderers = Object.fromEntries(renderNames.map((name) => [name, () => rendered.push(name)]));
const getEntity = async (entity) => {
  if (entity === 'orders') throw new Error('temporary failure');
  return [{ entity }];
};

const createRefresh = new Function(
  'cache', 'getEntity', '$', 'me', ...renderNames, 'renderCosts', 'renderFinance', 'renderUsers',
  `${source.slice(start, end)}; return refreshAll;`,
);
const refreshAll = createRefresh(
  cache, getEntity, () => warning, { role: 'Produção' },
  ...renderNames.map((name) => renderers[name]), async () => {}, async () => {}, async () => {},
);

(async () => {
  await refreshAll();
  assert.deepEqual(cache.orders, [{ id: 'cached-order' }], 'a failed request must preserve cached data');
  assert.deepEqual(cache.products, [{ entity: 'products' }], 'successful requests must refresh their cache');
  assert.equal(warning.classList.hidden, false, 'partial failure warning must be visible');
  assert.match(warning.textContent, /orders/);
  assert.deepEqual(rendered, renderNames, 'independent panels must continue rendering');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
