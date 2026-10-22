import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function worker(fetchImpl) {
 const handlers = {};
 const cached = [];
 const fallback = new Response('offline');
 const context = {
  self: { location: { origin: 'https://mechat.test' }, addEventListener: (name, cb) => { handlers[name] = cb; }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
  caches: { open: async () => ({ add: async (request) => cached.push(request.url) }), match: async () => fallback, keys: async () => [] },
  fetch: fetchImpl, URL, Request: class { constructor(url) { this.url = url; } }, Response,
 };
 vm.runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), context);
 return { handlers, cached, fallback };
}

test('offline cache contains only the public fallback', async () => {
 const { handlers, cached } = worker(async () => new Response('online'));
 let done; handlers.install({ waitUntil: (promise) => { done = promise; } }); await done;
 assert.deepEqual(cached, ['/offline.html']);
});
test('navigation uses network and falls back only on network failure', async () => {
 for (const online of [true, false]) {
  const { handlers } = worker(async () => { if (!online) throw new Error('offline'); return new Response('network'); });
  let result; handlers.fetch({ request: { method: 'GET', mode: 'navigate', url: 'https://mechat.test/chat/private' }, respondWith: (promise) => { result = promise; } });
  const response = await result;
  assert.equal(await response.text(), online ? 'network' : 'offline');
 }
});
test('worker never intercepts APIs, writes, external resources or RSC fetches', () => {
 const { handlers } = worker(() => { throw new Error('must not fetch'); });
 for (const request of [
  { method: 'GET', mode: 'navigate', url: 'https://mechat.test/api/auth/get-session' },
  { method: 'POST', mode: 'navigate', url: 'https://mechat.test/chat' },
  { method: 'GET', mode: 'cors', url: 'https://mechat.test/chat?_rsc=1' },
  { method: 'GET', mode: 'navigate', url: 'https://external.test/' },
 ]) handlers.fetch({ request, respondWith: () => assert.fail('private request intercepted') });
});
