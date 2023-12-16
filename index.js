'use strict';

const binding = require('node-gyp-build')(__dirname);

let codeEventsInited = false;
let codeEventListener = null;
let timer = null;

module.exports = {
  /**
   * Sets the function for processing v8 code events.
   * Will start listening for code events if not already listening.
   * starts a timer which polls for an available code event once every `interval` value.
   *
   * @param {Function} cb callback function to process code events
   * @param {number} [interval=1000] polling interval in ms
   */
  setCodeEventListener(cb, interval = 1000) {
    if (codeEventsInited) {
      codeEventListener = cb;
      return;
    }

    binding.initHandler();
    codeEventsInited = true;
    codeEventListener = cb;
    timer = setInterval(() => {
      const codeEvent = binding.getNextCodeEvent();
      if (codeEvent) codeEventListener(codeEvent);
    }, interval);
  },

  /**
   * Stop listening for v8 code events
   */
  stopListening() {
    if (!codeEventsInited) return;

    clearInterval(timer);
    binding.deinitHandler();
    codeEventListener = null;
    codeEventsInited = false;
  },
};
