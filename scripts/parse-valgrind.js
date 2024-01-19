'use strict';

const ngb = require('node-gyp-build');
const target = ngb.path();

const convert = require('xml-js');
const fs = require('fs');

const xml = fs.readFileSync('./valgrind.xml', 'utf8');

const json = convert.xml2json(xml, { compact: true });
const result = JSON.parse(json);
const relatedErrors = result.valgrindoutput.error.filter((err) => {
  for (const frame of err.stack.frame) {
    if (frame.obj && frame.obj._text.includes(target)) {
      return true;
    }
  }
  return false;
});

if (relatedErrors.length > 0) {
  console.error('UNEXPECTED VALGRIND ERRORS. Details written to valgrind-errors.xml');
  fs.writeFileSync('./valgrind-errors.xml', JSON.stringify(relatedErrors, null, 4));

  const kinds = {};

  console.error('abbreviated report:');
  for (let i = 0; i < relatedErrors.length; i++) {
    const err = relatedErrors[i];
    const kind = err.kind._text;
    const leakedBlocks = +err.xwhat.leakedblocks._text;
    const leakedBytes = +err.xwhat.leakedbytes._text;
    if (!kinds[kind]) {
      kinds[kind] = 0;
    }
    kinds[kind] += leakedBytes;
    console.error(`error index ${i}: ${kind} ${leakedBytes} bytes in ${leakedBlocks} blocks`);
  }
  console.error('totals');
  for (const k in kinds) {
    console.error(`${k}: ${kinds[k]} bytes`);
  }
  // eslint-disable-next-line no-process-exit
  process.exit(1);
} else {
  console.log('valgrind output clean');
}
