// @ts-check
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const child_process = require('child_process');

describe('canary worker_thread test', function() {

  it('executes test as a child', { timeout: 60_000 }, async function(t) {
    return new Promise((resolve, reject) => {
        const cp = child_process.spawn('node', ['node_modules/.bin/mocha', 'test/canary-thread.test.js'], {
          stdio: 'inherit'
        });

        cp.on('error', reject);

        cp.on('exit', exitCode => {
          assert.equal(exitCode, 0, `unexpected exit code ${exitCode}`);
          resolve();
        });
    });
  });
});
