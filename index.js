'use strict';

const binding = require('node-gyp-build')(__dirname);

let codeEventsInited = false;
let codeEventListener = null;
let timer = null;

const codeEvents = {
  /**
   * Sets the function for processing v8 code events.
   * Will start listening for code events if not already listening.
   * starts a timer which polls for an available code event once every `interval` value.
   *
   * @param {Function} cb callback function to process code events
   * @param {object} {interval:100, exclude_node:false, array:false} polling interval in ms
   */
  setCodeEventListener(cb, options = {}) {
    if (codeEventsInited) {
      codeEventListener = cb;
      return;
    }

    const { interval = 100, exclude_node = true, exclude_non_function = true } = options;
    const bits = (exclude_node ? 1 : 0) | (exclude_non_function ? 2 : 0);

    const active = binding.start(bits);
    codeEventsInited = true;
    codeEventListener = cb;

    function getEvents() {
      const start = process.hrtime.bigint();
      let codeEvent;
      let i = 0;
      while ((codeEvent = binding.getEvent())) {
        i += 1;
        codeEventListener(codeEvent);
      }
      module.exports.totalEvents += i;
      module.exports.totalTime += process.hrtime.bigint() - start;
    };

    // get any outstanding events immediately
    getEvents();

    // and then start polling
    timer = setInterval(getEvents, interval);
    timer.unref();

    return active;
  },

  /**
   * Stop listening for v8 code events
   */
  stopListening() {
    if (!codeEventsInited) {
      return;
    }
    clearInterval(timer);
    binding.stop();
    codeEventListener = null;
    codeEventsInited = false;
  },
};

// these are here for only for testing, so they're not enumerable.
Object.defineProperties(codeEvents, {
  totalEvents: {
    enumerable: false,
    writable: true,
    value: 0,
  },
  totalTime: {
    enumerable: false,
    writable: true,
    value: 0n,
   },
  noop: {
    enumerable: false,
    value: binding.noop,
  },
  size: {
    enumerable: false,
    value: binding.size,
  },
  getEvent: {
    enumerable: false,
    value: binding.getEvent,
  },
  stats: {
    enumerable: false,
    value: binding.stats,
  },
});

module.exports = codeEvents;
