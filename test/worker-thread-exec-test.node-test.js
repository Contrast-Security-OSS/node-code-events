// @ts-check
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');
const { Worker } = require('node:worker_threads');

describe('worker_thread executing tests', function() {

  it('executes index-include.node-test.js in a thread', { timeout: 60_000 }, function(t, done) {
    const worker = new Worker('./test/index-include.node-test.js', {});

    worker.on('error', done);

    worker.on('exit', exitCode => {
      assert(exitCode === 0, `unexpected exit code ${exitCode}`);
      done();
    });
  });

  it('executes index-exclude.node-test.js in a thread', { timeout: 60_000 }, function(t, done) {
    const worker = new Worker('./test/index-exclude.node-test.js', {});

    worker.on('error', done);

    worker.on('exit', exitCode => {
      assert(exitCode === 0, `unexpected exit code ${exitCode}`);
      done();
    });
  });
});
