const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
assert.doesNotMatch(source, /data-p="qualidade"/, 'quality must not appear in navigation');
assert.doesNotMatch(source, /id="qualidade"/, 'quality must not have a separate panel');
assert.doesNotMatch(source, /function renderQuality/, 'removed panel must not be rendered');
assert.match(source, /onclick="qualityOp\('\$\{o\.id\}'\)"/, 'inspection must remain available in production');
assert.match(source, /function qualityOp/, 'removing the tab must not block the production workflow');
