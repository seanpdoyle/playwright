/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { TestServer } from '../../utils/testserver';
import { test as it, expect } from './pageTest';

function initServer(server: TestServer): string[] {
  const messages = [];
  server.setRoute('/empty.html', async (req, res) => {
    messages.push('route');
    res.setHeader('Content-Type', 'text/html');
    res.end(`<link rel='stylesheet' href='./one-style.css'>`);
  });
  return messages;
}

it.skip(({ isAndroid }) => isAndroid, 'Too flaky on Android');

it('should await navigation when clicking anchor', async ({ page, server }) => {
  const messages = initServer(server);
  await page.setContent(`<a id="anchor" href="${server.EMPTY_PAGE}">empty.html</a>`);
  await Promise.all([
    page.click('a').then(() => messages.push('click')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|click');
});

it('should not stall on JS navigation link', async ({ page, browserName }) => {
  await page.setContent(`<a href="javascript:console.log(1)">console.log</a>`);
  await page.click('a');
});

it('should await navigation when clicking anchor programmatically', async ({ page, server }) => {
  const messages = initServer(server);
  await page.setContent(`<a id="anchor" href="${server.EMPTY_PAGE}">empty.html</a>`);
  await Promise.all([
    page.evaluate(() => (window as any).anchor.click()).then(() => messages.push('click')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|click');
});

it('should await navigation when clicking anchor via $eval', async ({ page, server }) => {
  const messages = initServer(server);
  await page.setContent(`<a id="anchor" href="${server.EMPTY_PAGE}">empty.html</a>`);
  await Promise.all([
    page.$eval('#anchor', anchor => (anchor as any).click()).then(() => messages.push('click')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|click');
});

it('should await navigation when clicking anchor via handle.eval', async ({ page, server }) => {
  const messages = initServer(server);
  await page.setContent(`<a id="anchor" href="${server.EMPTY_PAGE}">empty.html</a>`);
  const handle = await page.evaluateHandle('document');
  await Promise.all([
    handle.evaluate(doc => (doc as any).getElementById('anchor').click()).then(() => messages.push('click')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|click');
});

it('should await navigation when clicking anchor via handle.$eval', async ({ page, server }) => {
  const messages = initServer(server);
  await page.setContent(`<a id="anchor" href="${server.EMPTY_PAGE}">empty.html</a>`);
  const handle = await page.$('body');
  await Promise.all([
    handle.$eval('#anchor', anchor => (anchor as any).click()).then(() => messages.push('click')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|click');
});

it('should await cross-process navigation when clicking anchor', async ({ page, server }) => {
  const messages = initServer(server);
  await page.setContent(`<a href="${server.CROSS_PROCESS_PREFIX + '/empty.html'}">empty.html</a>`);

  await Promise.all([
    page.click('a').then(() => messages.push('click')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|click');
});

it('should await cross-process navigation when clicking anchor programatically', async ({ page, server }) => {
  const messages = initServer(server);
  await page.setContent(`<a id="anchor" href="${server.CROSS_PROCESS_PREFIX + '/empty.html'}">empty.html</a>`);

  await Promise.all([
    page.evaluate(() => (window as any).anchor.click()).then(() => messages.push('click')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|click');
});

it('should await form-get on click', async ({ page, server }) => {
  const messages = [];
  server.setRoute('/empty.html?foo=bar', async (req, res) => {
    messages.push('route');
    res.setHeader('Content-Type', 'text/html');
    res.end(`<link rel='stylesheet' href='./one-style.css'>`);
  });

  await page.setContent(`
    <form action="${server.EMPTY_PAGE}" method="get">
      <input name="foo" value="bar">
      <input type="submit" value="Submit">
    </form>`);

  await Promise.all([
    page.click('input[type=submit]').then(() => messages.push('click')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|click');
});

it('should await form-post on click', async ({ page, server }) => {
  const messages = initServer(server);
  await page.setContent(`
    <form action="${server.EMPTY_PAGE}" method="post">
      <input name="foo" value="bar">
      <input type="submit" value="Submit">
    </form>`);

  await Promise.all([
    page.click('input[type=submit]').then(() => messages.push('click')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|click');
});

it('should await navigation when assigning location', async ({ page, server }) => {
  const messages = initServer(server);
  await Promise.all([
    page.evaluate(`window.location.href = "${server.EMPTY_PAGE}"`).then(() => messages.push('evaluate')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|evaluate');
});

it('should await navigation when assigning location twice', async ({ page, server }) => {
  const messages = [];
  server.setRoute('/empty.html?cancel', async (req, res) => { res.end('done'); });
  server.setRoute('/empty.html?override', async (req, res) => { messages.push('routeoverride'); res.end('done'); });
  await page.evaluate(`
      window.location.href = "${server.EMPTY_PAGE}?cancel";
      window.location.href = "${server.EMPTY_PAGE}?override";
    `);
  messages.push('evaluate');
  expect(messages.join('|')).toBe('routeoverride|evaluate');
});

it('should await navigation when evaluating reload', async ({ page, server }) => {
  await page.goto(server.EMPTY_PAGE);
  const messages = initServer(server);
  await Promise.all([
    page.evaluate(`window.location.reload()`).then(() => messages.push('evaluate')),
    page.waitForEvent('framenavigated').then(() => messages.push('navigated')),
  ]);
  expect(messages.join('|')).toBe('route|navigated|evaluate');
});

it('should work with noWaitAfter: true', async ({ page, server }) => {
  server.setRoute('/empty.html', async () => {});
  await page.setContent(`<a id="anchor" href="${server.EMPTY_PAGE}">empty.html</a>`);
  await page.click('a', { noWaitAfter: true });
});

it('should work with dblclick noWaitAfter: true', async ({ page, server }) => {
  server.setRoute('/empty.html', async () => {});
  await page.setContent(`<a id="anchor" href="${server.EMPTY_PAGE}">empty.html</a>`);
  await page.dblclick('a', { noWaitAfter: true });
});

it('should work with waitForLoadState(load)', async ({ page, server }) => {
  const messages = initServer(server);
  await page.setContent(`<a id="anchor" href="${server.EMPTY_PAGE}">empty.html</a>`);
  await Promise.all([
    page.click('a').then(() => page.waitForLoadState('load')).then(() => messages.push('clickload')),
    page.waitForEvent('load').then(() => messages.push('load')),
  ]);
  expect(messages.join('|')).toBe('route|load|clickload');
});

it('should work with goto following click', async ({ page, server }) => {
  server.setRoute('/login.html', async (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(`You are logged in`);
  });

  await page.setContent(`
    <form action="${server.PREFIX}/login.html" method="get">
      <input type="text">
      <input type="submit" value="Submit">
    </form>`);

  await page.fill('input[type=text]', 'admin');
  await page.click('input[type=submit]');
  await page.goto(server.EMPTY_PAGE);
});

it('should report navigation in the log when clicking anchor', async ({ page, server, mode }) => {
  it.skip(mode !== 'default');

  await page.setContent(`<a href="${server.PREFIX + '/frames/one-frame.html'}">click me</a>`);
  const __testHookAfterPointerAction = () => new Promise(f => setTimeout(f, 6000));
  const error = await page.click('a', { timeout: 5000, __testHookAfterPointerAction } as any).catch(e => e);
  expect(error.message).toContain('page.click: Timeout 5000ms exceeded.');
  expect(error.message).toContain('waiting for scheduled navigations to finish');
  expect(error.message).toContain(`navigated to "${server.PREFIX + '/frames/one-frame.html'}"`);
});
