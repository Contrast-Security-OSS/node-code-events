# @contrast/code-events

[![Test](https://github.com/Contrast-Security-Inc/node-code-events/actions/workflows/test.yml/badge.svg)](https://github.com/Contrast-Security-Inc/node-code-events/actions/workflows/test.yml)

This module exposes CodeEvent data from the underlying v8 engine, such as the 'LAZY_COMPILE' and 'FUNCTION' types.

## Usage

Register a listener for code events:

```js
const { setCodeEventListener } = require('@contrast/code-events');

// with the default poll interval of 100ms:
setCodeEventListener((event) => {
  console.log(event);
});

// with a custom poll interval of 500ms:
setCodeEventListener((event) => {
  console.log(event);
}, { interval: 500 });
```
