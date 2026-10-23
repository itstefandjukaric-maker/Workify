import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {parseHTML} from 'linkedom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://itstefandjukaric-maker.github.io/Workify/';
const files = readdirSync(root).filter(file => file.endsWith('.html'));
const head = file => parseHTML(readFileSync(path.join(root, file), 'utf8')).document.head;

test('Preview metadata has no duplicate single-card tags or local development URLs', () => {
  for (const file of files) {
    const seen = new Set();
    for (const meta of head(file).querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')) {
      const key = meta.getAttribute('property') || meta.getAttribute('name');
      assert.ok(!seen.has(key), `${file}: duplicate ${key}`);
      seen.add(key);
      if (['og:url', 'og:image', 'twitter:image'].includes(key)) {
        const url = new URL(meta.getAttribute('content'));
        assert.equal(url.protocol, 'https:', `${file}: ${key} must use HTTPS`);
        assert.ok(!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), `${file}: local ${key}`);
      }
    }
  }
});

test('Repaired job and capture sharing cards point to their own preview page and an existing image', () => {
  const repaired = files.filter(file => /^(?:en-)?job-\d+\.html$/.test(file));
  assert.ok(repaired.length > 0, 'Expected preview job pages');
  for (const file of [...repaired, 'capture-apply-1.html']) {
    const metadata = head(file);
    const content = property => metadata.querySelector(`meta[property="${property}"]`)?.getAttribute('content');
    assert.equal(content('og:url'), base + file, file);
    assert.equal(content('og:image'), base + 'static/img/og.jpg', file);
    assert.ok(existsSync(path.join(root, new URL(content('og:image')).pathname.slice('/Workify/'.length))), file);
    if (file !== 'capture-apply-1.html') {
      assert.equal(content('og:image:width'), '1200', file);
      assert.equal(content('og:image:height'), '630', file);
      assert.equal(metadata.querySelector('meta[name="twitter:card"]')?.getAttribute('content'), 'summary_large_image', file);
    }
  }
});

test('Every static preview page remains excluded from indexing and following', () => {
  for (const file of files) {
    const directives = head(file).querySelector('meta[name="robots"]')?.getAttribute('content').split(',').map(value => value.trim());
    assert.ok(directives?.includes('noindex'), `${file}: missing noindex`);
    assert.ok(directives?.includes('nofollow'), `${file}: missing nofollow`);
  }
});
