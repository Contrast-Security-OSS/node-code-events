// @ts-check
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { Worker } = require('node:worker_threads');

describe('worker_thread executing tests', function() {

  it('executes index-include.node-test.js in a thread', { timeout: 60000 }, async function() {
    let resolve;
    let reject;
    const p = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const worker = new Worker('./test/index-include.node-test.js', {});

    // @ts-ignore
    worker.on('error', reject);

    worker.on('exit', exitCode => {
      assert(exitCode === 0, `unexpected exit code ${exitCode}`);
      resolve();
    });

    return p;
  });

  it('executes index-exclude.node-test.js in a thread', { timeout: 60000 }, async function() {
    let resolve;
    let reject;
    const p = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const worker = new Worker('./test/index-exclude.node-test.js', {});

    // @ts-ignore
    worker.on('error', reject);

    worker.on('exit', exitCode => {
      assert(exitCode === 0, `unexpected exit code ${exitCode}`);
      resolve();
    });

    return p;
  });
});
