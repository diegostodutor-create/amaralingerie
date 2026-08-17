const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
const start = source.indexOf('function renderCadastros()');
const end = source.indexOf('async function newColor()', start);
assert.notEqual(start, -1, 'catalog functions must exist');
assert.notEqual(end, -1, 'catalog end marker must exist');

const cache = {
  clients: [{ id: 'client-1', name: 'Cliente atual', phone: '1', city: 'Cidade' }],
  products: [{ id: 'product-1', name: 'Modelo atual', active: true }],
  workers: [{ id: 'worker-1', name: 'Pessoa atual', sector: 'Produção', active: true }],
};
const fields = {
  cName: { value: 'Cliente editado' }, cPhone: { value: '2' }, cCity: { value: 'Nova cidade' },
  prName: { value: 'Modelo editado' }, prTarget: { value: '80' }, prActive: { value: 'false' },
  wName: { value: 'Pessoa editada' }, wSector: { value: 'Corte' }, wActive: { value: 'false' },
};
const calls = [];
const modals = [];
let refreshes = 0;
let confirmation = true;
const api = async (url, options) => calls.push({ url, options });

const factory = new Function(
  'cache', '$', 'api', 'modal', 'closeModal', 'refreshAll', 'confirm', 'alert', 'esc', 'num',
  `${source.slice(start, end)}; return {editClient,editProduct,editWorker,saveClient,saveProduct,saveWorker,deleteEntity};`,
);
const actions = factory(
  cache, (id) => fields[id], api, (title, body) => modals.push({ title, body }), () => {},
  async () => { refreshes += 1; }, () => confirmation, () => {},
  (value) => String(value ?? ''), (value) => Number(value) || 0,
);

(async () => {
  actions.editClient('client-1');
  actions.editProduct('product-1');
  actions.editWorker('worker-1');
  assert.deepEqual(modals.map((item) => item.title), ['Editar cliente', 'Editar modelo', 'Editar funcionário']);

  await actions.saveClient('client-1');
  await actions.saveProduct('product-1');
  await actions.saveWorker('worker-1');
  assert.deepEqual(calls.slice(0, 3).map((call) => [call.url, call.options.method]), [
    ['/entities/clients/client-1', 'PATCH'],
    ['/entities/products/product-1', 'PATCH'],
    ['/entities/workers/worker-1', 'PATCH'],
  ]);

  await actions.deleteEntity('clients', 'client-1', 'cliente Cliente atual');
  assert.deepEqual([calls[3].url, calls[3].options.method], ['/entities/clients/client-1', 'DELETE']);
  confirmation = false;
  await actions.deleteEntity('products', 'product-1', 'modelo Modelo atual');
  assert.equal(calls.length, 4, 'canceling confirmation must not delete');
  assert.equal(refreshes, 4, 'successful mutations must refresh the interface');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
