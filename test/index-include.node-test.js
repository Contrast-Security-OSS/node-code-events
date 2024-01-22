// @ts-check
'use strict';

const { describe, it, before, afterEach, after } = require('node:test');
const { expect } = require('chai');

const codeEvents = require('..');
// @ts-ignore
const { setCodeEventListener, stopListening, size, stats, getEvent } = codeEvents; // eslint-disable-line

const listenerOptions = {
  interval: 100,
  excludeNode: false,
  excludeNonFunction: false,
};

const nodeVersion = +process.versions.node.split('.')[0];
const nodeModulePrefix = nodeVersion >= 16 ? 'node:' : 'internal/';
let type = null;
if (!listenerOptions.excludeNonFunctions) {
  type = nodeVersion >= 20 ? 'Function' : 'LazyCompile';
}

let lastTotalEvents = 0;
let lastTotalTime = 0n; // eslint-disable-line

const timeout = process.platform === 'win32' ? 60000 : 10000;

describe('setCodeEventListener', { timeout }, function () {
  let waitForLazyCompile;
  let handler;
  let nodeColonSeen = false;
  const events = [];

  before(async function () {
    let eventIndex = 0;

    waitForLazyCompile = (name) =>
      new Promise((resolve) => { const peIx = eventIndex; // eslint-disable-line
        const _interval = setInterval(() => {
          for (let i = eventIndex; i < events.length; i++, eventIndex++) {
            if (events[i].script.startsWith(nodeModulePrefix)) {
              nodeColonSeen = true;
            }
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
    // in CI it takes a long time for windows to get through the initial burst
    // of available code events
    let p = Promise.resolve();
    if (process.platform === 'win32') {
      p = new Promise((resolve) => setTimeout(resolve, timeout - 2000));
    }

    return p;
  });

  afterEach(function() {
    // @ts-ignore
    lastTotalEvents = codeEvents.totalEvents;
    // @ts-ignore
    lastTotalTime = codeEvents.totalTime;
  });

  after(function () {
    stopListening();
    events.length = 0;
    // wait for them all to be done before reporting what remains.
    setTimeout(() => {
      // @ts-ignore
      console.log('remaining size', size(), 'totalEvents', codeEvents.totalEvents);
    }, 2000);
  });

  it('reports simple LazyCompile events', async function () {
    // @ts-ignore
    const lineNumber = thisLine() + 1;
    function testfunc1() {
      return 1 + 2;
    }

    testfunc1();

    const event = await waitForLazyCompile('testfunc1');
    expect(event).to.deep.equal(makeExpected({
      func: 'testfunc1',
      lineNumber,
      script: __filename,
      type
    }));
    // @ts-ignore
    expect(codeEvents.totalEvents).above(500);

    // only seen when not excluded
    expect(nodeColonSeen).true;
  });

  it('reports arrow function', async function () {
    const testfunc2 = () => 1 + 2; const lineNumber = thisLine();

    testfunc2();

    const event = await waitForLazyCompile('testfunc2');
    expect(event).to.deep.equal(makeExpected({
      func: 'testfunc2',
      lineNumber,
      script: __filename,
      type
    }));
    // @ts-ignore
    expect(codeEvents.totalEvents - lastTotalEvents).above(5);
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
    expect(event1).to.deep.equal(makeExpected({
      func: 'MyClass',
      lineNumber: lineNumber1,
      script: __filename,
      type
    }));
    // @ts-ignore
    expect(codeEvents.totalEvents - lastTotalEvents).above(0);

    const event2 = await waitForLazyCompile('bar');
    expect(event2).to.deep.equal(makeExpected({
      func: 'bar',
      lineNumber: lineNumber2,
      script: __filename,
      type
    }));
  });

  it('reports delayed function', async function () {
    const declareTime = Date.now();

    const testfunc3 = () => 1 + 2; const lineNumber = thisLine();
    setTimeout(testfunc3, 500);

    const event = await waitForLazyCompile('testfunc3');
    expect(event).to.deep.equal(makeExpected({
      func: 'testfunc3',
      lineNumber,
      script: __filename,
      type
    }));
    // @ts-ignore
    expect(codeEvents.totalEvents - lastTotalEvents).above(0);

    // setTimeout isn't exact but it should never been 10ms below the timeout
    expect(Date.now() - declareTime).to.be.above(490);
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
    expect(newListenerCalled).to.be.true;
    expect(event).to.deep.equal(makeExpected({
      func: 'testfunc4',
      lineNumber,
      script: __filename,
      type
    }));
  });

  it('can stop listening when not listening', function () {
    stopListening();
    //console.log(stats());
    //console.log('size of queue', size(3));

    // eat the events in the queue.
    while (getEvent()) { } // eslint-disable-line
    expect(size(3)).equal(0);
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

function makeExpected({ func, lineNumber, script, type }) {
  const expected = { func, lineNumber, script };
  if (type) {
    expected.type = type;
  }
  return expected;
}
