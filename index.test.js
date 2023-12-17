// @ts-check
'use strict';

const semver = require('semver');
const { expect } = require('chai');
const { setCodeEventListener, stopListening } = require('.');

describe('canary worker_thread test', function () {
  it('require in a worker thread succeeds after require in main thread', function (done) {
    const { Worker } = require('worker_threads');
    const worker = new Worker(`
      const { setCodeEventListener, stopListening } = require('.');

      setCodeEventListener(function (event) {
        console.log(event);
      });

      setTimeout(() => {
        stopListening();
      }, 100);
    `, { eval: true });

    worker.on('error', done);

    worker.on('exit', exitCode => {
      expect(exitCode).equal(0);
      done();
    });
  });
});

describe('setCodeEventListener', function () {
  const type = semver.gte(process.version, '20.0.0') ? 'Function' : 'LazyCompile';
  const TIMEOUT = process.platform === 'win32' ? 61000 : 10000;
  this.timeout(TIMEOUT);

  let waitForLazyCompile;
  let handler;

  before(function (done) {
    const events = [];
    let eventIndex = 0;

    waitForLazyCompile = (name) =>
      new Promise((resolve) => {
        const _interval = setInterval(() => {
          for (let i = eventIndex; i < events.length; i++, eventIndex++) {
            if (events[i].func === name) {
              clearInterval(_interval);
              resolve(events[i]);
              return;
            }
          }
        }, 10);
      });

    handler = (event) => {
      // this is technically a memory leak as we're just always
      // appending to the array of events and never releasing them
      // to be GC'ed.  Not a good idea in practice, but fine for
      // these unit tests
      events.push(event);
    };

    setCodeEventListener(handler, 1);

    // in CI it takes a long time for windows to get through the initial burst
    // of available code events
    if (process.platform === 'win32') {
      setTimeout(done, TIMEOUT - 1000);
    } else {
      done();
    }
  });

  after(function () {
    stopListening();
  });

  it('reports simple LazyCompile events', async function () {
    function testfunc1() {
      return 1 + 2;
    }

    testfunc1();

    const event = await waitForLazyCompile('testfunc1');
    expect(event).to.deep.equal({
      func: 'testfunc1',
      lineNumber: 81,
      script: __filename,
      type
    });
  });

  it('reports arrow function', async function () {
    const testfunc2 = () => 1 + 2;

    testfunc2();

    const event = await waitForLazyCompile('testfunc2');
    expect(event).to.deep.equal({
      func: 'testfunc2',
      lineNumber: 97,
      script: __filename,
      type
    });
  });

  it('reports class functions', async function () {
    class MyClass {
      constructor() {
        this.foo = 123;
      }

      bar() {
        return this.foo + 2;
      }
    }

    const instance = new MyClass();
    instance.bar();

    const event1 = await waitForLazyCompile('MyClass');
    expect(event1).to.deep.equal({
      func: 'MyClass',
      lineNumber: 112,
      script: __filename,
      type
    });

    const event2 = await waitForLazyCompile('bar');
    expect(event2).to.deep.equal({
      func: 'bar',
      lineNumber: 116,
      script: __filename,
      type
    });
  });

  it('reports delayed function', async function () {
    const declareTime = Date.now();

    const testfunc3 = () => 1 + 2;
    setTimeout(testfunc3, 1500);

    const event = await waitForLazyCompile('testfunc3');
    expect(event).to.deep.equal({
      func: 'testfunc3',
      lineNumber: 144,
      script: __filename,
      type
    });

    // setTimeout isn't exact but it should be close to 1.5 seconds after declaration
    expect(Date.now() - declareTime).to.be.above(1250);
  });

  it('should be able to change the listener function', async function () {
    let newListenerCalled = false;
    setCodeEventListener(function (event) {
      newListenerCalled = true;
      handler(event);
    });

    const testfunc4 = () => 1 + 2;
    testfunc4();

    const event = await waitForLazyCompile('testfunc4');
    expect(newListenerCalled).to.be.true;
    expect(event).to.deep.equal({
      func: 'testfunc4',
      lineNumber: 166,
      script: __filename,
      type
    });
  });

  it('can be stop listening when not listening', function () {
    stopListening();
  });
});

