'use strict';

const binding = require('node-gyp-build')(__dirname);
binding.start(0);
setTimeout(() => {
  const ev = binding.getEvent();
  console.log('event.type', ev.type);
}, 10);

//console.log(process.pid);
//const int = process.argv[2] || 1;
//process.title = 'x' + int
//setInterval(() => {
//  // do nothing
//  x.noop();
//}, +int);

//binding.loseMemory(100);
//
//let bits = x.start(3);
//console.log(bits);

// let ev;
// let count = 0;
// while ((ev = x.getEvent())) {
//   //console.log(ev);
//   count += 1;
// }
// console.log(count);
