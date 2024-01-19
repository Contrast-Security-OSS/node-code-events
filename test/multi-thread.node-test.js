// @ts-check
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const listenerOptions = {
  interval: 100,
  exclude_node: false,
  exclude_non_function: false
};

const nodeVersion = +process.versions.node.split('.')[0];
const nodeModulePrefix = nodeVersion >= 16 ? 'node:' : 'internal/';

let lastTotalEvents = 0;
let lastTotalTime = 0n; // eslint-disable-line

const timeout = process.platform === 'win32' ? 60000 : 10000;
const options = { timeout };

describe('multiple terminating worker_threads test', function() {
  it('require in a worker thread succeeds after require in main thread', options, function(t, done) {
    const { Worker } = require('worker_threads');
    const worker = new Worker(`
      const { setCodeEventListener, stopListening } = require('.');

      setCodeEventListener(function (event) {
        //console.log(event);
      });

      setTimeout(() => {
        stopListening();
      }, 100);
    `, { eval: true });

    worker.on('error', done);

    worker.on('exit', exitCode => {
      assert(exitCode === 0, `unexpected exit code ${exitCode}`);
      done();
    });
  });

  // @ts-ignore
  it('handles multiple worker threads', options, async function(t) {
    const all = [];
    for (let i = 0; i < 2; i++) {
      const p = new Promise((resolve, reject) => {

        const { Worker } = require('worker_threads');
        const worker = new Worker(`
        const { setCodeEventListener, stopListening } = require('.');

        setCodeEventListener(function (event) {
          //console.log(event);
        });

        setTimeout(() => {
          stopListening();
        }, 100);
        `, { eval: true });

        worker.on('error', reject);

        worker.on('exit', exitCode => {
          assert(exitCode === 0, `unexpected exit code ${exitCode}`);
          resolve(0);
        });
      });
      all.push(p);
    }
    return Promise.all(all);
  });

  it('waits a bit', function(t, done) {
    setTimeout(done, 1000);
  });
});
