// @ts-check
'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert');

const timeout = process.platform === 'win32' ? 60000 : 10000;
const options = { timeout };

describe('multiple terminating worker_threads test', function() {
  it('require in a worker thread succeeds after require in main thread', options, function() {
    let resolve;
    let reject;
    const p = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
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

    // @ts-ignore
    worker.on('error', reject);

    worker.on('exit', exitCode => {
      assert(exitCode === 0, `unexpected exit code ${exitCode}`);
      resolve();
    });

    return p;
  });

  // @ts-ignore
  it('handles multiple worker threads', options, async function() {
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

  it('waits a bit', function() {
    return new Promise((resolve) => setTimeout(resolve, 1000));
  });
});
