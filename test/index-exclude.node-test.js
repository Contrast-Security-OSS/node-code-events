// @ts-check
'use strict';

const assert = require('node:assert/strict');
const { describe, it, before, beforeEach, afterEach, after } = require('node:test');

const codeEvents = require('../index.js');
const { setCodeEventListener, stopListening, size, getEvent } = codeEvents;

// the excludes are the defaults, but we want to document it here.
const listenerOptions = {
  interval: 100,
  exclude_node: true,
  exclude_non_function: true,
};

let lastTotalEvents = 0;
let lastTotalTime = 0n; // eslint-disable-line

const timeout = process.platform === 'win32' ? 60000 : 10000;

describe('setCodeEventListener reports function events', { timeout }, function () {

  let waitForLazyCompile;
  let handler;
  let events = [];

  before(function (t, done) {
    let eventIndex = 0;

    waitForLazyCompile = (name) =>
      new Promise((resolve) => { const peIx = eventIndex; // eslint-disable-line
        const _interval = setInterval(() => {
          for (let i = eventIndex; i < events.length; i++, eventIndex++) {
            if (events[i].func === name) {
              clearInterval(_interval);
              resolve(events[i]); false && console.log('n', eventIndex - peIx);
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

    setCodeEventListener(handler, listenerOptions);

    // in CI it takes a long time for windows to get through the initial burst
    // of available code events
    if (process.platform === 'win32') {
      setTimeout(done, timeout - 2000);
    } else {
      done();
    }
  });

  afterEach(function() {
    lastTotalEvents = codeEvents.totalEvents;
    lastTotalTime = codeEvents.totalTime;
  });

  after(function () {
    stopListening();
    events.length = 0;
    // wait for them all to be done before reporting what remains.
    setTimeout(() => {
      const ceSize = size(1); // bytes in CodeEvent instance
      const eqSize = size(2); // bytes in EventQueue object
      const eqBytes = size(3); // bytes in EventQueue's queue
      const eqLength = size(4); // number of items in EventQueue's queue
      console.log('ceSize', ceSize, 'eqSize', eqSize, 'eqBytes', eqBytes, 'eqLength', eqLength, 'totalEvents', codeEvents.totalEvents);
    }, 2000)
  });

  it('reports simple function', async function () {
    // @ts-ignore
    const lineNumber = thisLine() + 1;
    function testfunc1() {
      return 1 + 2;
    }

    testfunc1();

    const event = await waitForLazyCompile('testfunc1');
    assert.deepEqual(event, {
      func: 'testfunc1',
      lineNumber,
      script: __filename,
      //type
    });
    assert(codeEvents.totalEvents > 0, 'no events reported');
  });

  it('reports arrow function', async function () {
    const testfunc2 = () => 1 + 2; const lineNumber = thisLine();

    testfunc2();

    const event = await waitForLazyCompile('testfunc2');
    assert.deepEqual(event, {
      func: 'testfunc2',
      lineNumber,
      script: __filename,
      //type
    });
    assert(codeEvents.totalEvents - lastTotalEvents, 'no events reported');
  });

  it('reports class functions', async function () {
    let lineNumber1;
    let lineNumber2;
    class MyClass {
      constructor() {
        // @ts-ignore
        lineNumber1 = thisLine() - 2;
        this.foo = 123;
      }

      bar() {
        // @ts-ignore
        lineNumber2 = thisLine() - 2;
        return this.foo + 2;
      }
    }

    const instance = new MyClass();
    instance.bar();

    const event1 = await waitForLazyCompile('MyClass');
    assert.deepEqual(event1, {
      func: 'MyClass',
      lineNumber: lineNumber1,
      script: __filename,
      //type
    });
    assert(codeEvents.totalEvents - lastTotalEvents > 0, 'totalEvent expected > 0');

    const event2 = await waitForLazyCompile('bar');
    assert.deepEqual(event2, {
      func: 'bar',
      lineNumber: lineNumber2,
      script: __filename,
      //type
    });
  });

  it('reports delayed function', async function () {
    const declareTime = Date.now();

    const testfunc3 = () => 1 + 2; const lineNumber = thisLine();
    setTimeout(testfunc3, 500);

    const event = await waitForLazyCompile('testfunc3');
    assert.deepEqual(event, {
      func: 'testfunc3',
      lineNumber,
      script: __filename,
      //type
    });
    assert(codeEvents.totalEvents - lastTotalEvents > 0, 'totalEvent expected > 0');

    // setTimeout isn't exact but it should never been 10ms below the timeout
    assert(declareTime + 490 < Date.now(), 'timer fired too soon');
  });

  it('should be able to change the listener function', async function () {
    let newListenerCalled = false;
    setCodeEventListener(function (event) {
      newListenerCalled = true;
      handler(event);
    }, listenerOptions);

    const testfunc4 = () => 1 + 2; const lineNumber = thisLine();
    testfunc4();

    const event = await waitForLazyCompile('testfunc4');
    assert(newListenerCalled, 'new listener not called')
    assert.deepEqual(event, {
      func: 'testfunc4',
      lineNumber,
      script: __filename,
      //type
    });
  });

  it('can require something for fun', function() {
    // @ts-ignore
    require('./resources/functions-1.js');
    // @ts-ignore
    require('./resources/functions-2.js');
    // @ts-ignore
    require('./resources/functions-3.js');
  });

  it('can stop listening when not listening', function (t, done) {
    setTimeout(() => {
      let n = 0;
      while (getEvent()) {
        n += 1;
      }
      // it's fiddling with the internals, but it's a test.
      codeEvents.totalEvents += n;
      stopListening();
      done();
    });
  });
});

function thisLine() {
  let line;
  const _prepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (_, stack) => {
    line = stack[1].getLineNumber();
  };
  const e = new Error();
  e.stack;
  Error.prepareStackTrace = _prepareStackTrace;
  return line;
}
