// @ts-check
'use strict';

// this really could/should be a non-node test, but the way mocha combines
// tests means the test does not run with a clean instance of code-events.

const { describe, it } = require('node:test');
const { expect } = require('chai');

const ce = require('..');
const { setCodeEventListener } = ce;

const listenerOptions = {
  interval: 100,
  excludeNode: false,
  excludeNonFunction: false
};

const CE_INSTANCE = 1;
const CE_EVENT_QUEUE_INSTANCE = 2;
const CE_EVENT_QUEUE_BYTES = 3;
const CE_CURRENT_QUEUE_LENGTH = 4;

let totalEvents = 0;
const types = {
  not_function: 0,
  node: 0,
  no_script_name: 0,
};
function aggregator(event) {
  totalEvents++;
  if (event.type !== 'Function' && event.type !== 'LazyCompile') {
    types.not_function++;
  }
  if (event.script.startsWith('node:')) {
    types.node++;
  }
  if (event.script === '') {
    // this won't happen - the C++ code doesn't return these
    types.no_script_name++;
  }
}

describe('get C++ sizes', function() {
  it('should get the size of the CodeEvents instance', function() {
    // @ts-ignore
    expect(ce.size(CE_INSTANCE)).equal(88);
  });

  it('should get the size of CodeEvent\'s EventQueue instance', function() {
    // @ts-ignore
    expect(ce.size(CE_EVENT_QUEUE_INSTANCE)).equal(24);
  });

  it('should get the bytes in the CodeEvent\'s EventQueue', function() {
    // @ts-ignore
    expect(ce.size(CE_EVENT_QUEUE_BYTES)).equal(0);
  });

  it('should get stats', function() {
    // @ts-ignore
    const stats = ce.stats();
    expect(stats).property('total', 0);
    expect(stats).property('not_function', 0);
    expect(stats).property('total_node_scripts', 0);
    expect(stats).property('no_script_name', 0);
    expect(stats).property('total_queued', 0);
  });

  it('should enable the listener', function() {
    setCodeEventListener(aggregator, listenerOptions);
  });

  it('should get new stats', function() {
    /* eslint-disable newline-per-chained-call */
    // @ts-ignore
    const stats = ce.stats();
    expect(stats).property('total').above(0);
    expect(stats).property('not_function').above(0);
    expect(stats).property('total_node_scripts').above(0);
    expect(stats).property('no_script_name').above(0);
    expect(stats).property('total_queued').above(0);

    // the total internally queued cannot be lower than the number of events
    // this code has seen.
    expect(stats.total_queued).greaterThanOrEqual(totalEvents);
    expect(stats.total_node_scripts).greaterThanOrEqual(types.node);
  });

  it('should see items in the queue that have not been seen yet', function(t, done) {
    // in theory, could be 0 if the queue is processed immediately before
    // this test, so take two samples.
    // @ts-ignore
    const length1 = ce.size(CE_CURRENT_QUEUE_LENGTH);
    setTimeout(() => {
      // @ts-ignore
      const length2 = ce.size(CE_CURRENT_QUEUE_LENGTH);
      expect(length1 + length2).not.equal(0);
      done();
    }, 25);
  });

  // add some tests that don't use the timer but use getEvent() directly.


});
