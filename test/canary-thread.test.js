// @ts-check
'use strict';

const { Worker } = require('worker_threads');
const assert = require('node:assert');

describe('canary worker_thread test', function() {
  it('require in a worker thread succeeds after require in main thread', async function() {
    this.timeout(30000);

    return new Promise((resolve, reject) => {
      const worker = new Worker(`
      const { setCodeEventListener, stopListening } = require('.');

      setCodeEventListener(function (event) {
        //console.log(event);
      });

      setTimeout(() => {
        stopListening();
      }, 250);
    `, { eval: true });

      worker.on('error', reject);

      worker.on('exit', exitCode => {
        assert.equal(exitCode, 0, `unexpected exit code ${exitCode}`);
        resolve();
      });
    });
  });

  it('handles multiple worker threads', async function() {
    this.timeout(30000);

    const all = [];
    for (let i = 0; i < 2; i++) {
      const p = new Promise((resolve, reject) => {

        const worker = new Worker(`
        const { setCodeEventListener, stopListening } = require('.');

        setCodeEventListener(function (event) {
          //console.log(event);
        });

        setTimeout(() => {
          stopListening();
        }, 250);
        `, { eval: true });

        worker.on('error', reject);

        worker.on('exit', exitCode => {
          assert.equal(exitCode, 0, `unexpected exit code ${exitCode}`);
          resolve(0);
        });
      });
      all.push(p);
    }

    return Promise.all(all);
  });

  it('waits', function(done) {
    setTimeout(done, 1000);
  });
});
