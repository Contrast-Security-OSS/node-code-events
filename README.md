# @contrast/code-events

[![Test](https://github.com/Contrast-Security-Inc/node-code-events/actions/workflows/test.yml/badge.svg)](https://github.com/Contrast-Security-Inc/node-code-events/actions/workflows/test.yml)

This module exposes CodeEvent data from the underlying v8 engine, such as 'LAZY_COMPILE'.

## Usage

Register a listener for code events:

```js
const { setCodeEventListener } = require('@contrast/code-events');

// with the default poll interval of one second:
setCodeEventListener((event) => {
  console.log(event);
});

// with a custom poll interval of 500ms:
setCodeEventListener((event) => {
  console.log(event);
}, 500);
```
```

## Building locally

`npm run build` will build the project for your current OS and architecture.

`npm run download` will pull the most recent build artifacts from GitHub.

## Publishing

Simply run `npm version` and `git push && git push --tags`. CI will take care of
releasing on taggedcommits.
