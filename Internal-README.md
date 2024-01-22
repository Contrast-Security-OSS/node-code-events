# @contrast/code-events

Instantiate a v8 code-event listener. It will not be enabled until `binding.start()`
is called by `setCodeEventListener()`, which sets an interval timer and fetches
all queued code-events at each interval. It's important that the interval timer
fetches all outstanding requests on a regular basis because the C++ code is queueing
the events as they happen.

# developing

There are multiple flavors of build commands that can be used. The best for
development are the fastest ones, `npm run rebuild` or `npm run rebuild:debug`.
It builds the binary only for the current architecture and node version. Use
`npm run build` to build for all supported versions of node for the current
architecture.

Because the leak tests are not run in CI, they should be run after any change
that has a remote chance to result in a leak.

# testing

File names `*.test.js` are to be executed by mocha and run in all CI. They are
intended to verify that basic functions work as expected.

File names `*.node-test.js` are used to verify that there are no leaks. They use
the node test-runner (`node:test`) and are intended to be run interactively (and
possibly on final release).

## functional testing

`$ npm test` will execute `*.test.js` to verify that the package functions correctly.

## leak tests

The process is to run a test to verify that it works. Following that, run the
test with valgrind, then execute `scripts/parse-valgrind.js`. It will output a
summary of the errors found, or simply `valgrind output clean`. The exit code
will be set appropriately.

The `*.node-test.js` files are:

- `index-exclude.node-test.js` - code-events does not return node: modules or non-function events
- `index-include.node-test.js` - code-events returns all events
- `multi-thread.node-test.js` - starts one worker thread, then two
- `noop.node-test.js` - does nothing but require code-events
- `spawned-test.node-test.js` - use child_process to spawn `canary-thread.test.js` (see note)
- `worker-thread-exec-test.node-test.js` - executes the include and exclude scripts

The best place to see how this works is `scripts/execute-leak-suite.sh` (as soon as i write it).

Running `index-*-node-test.js` or `noop.node-test.js`, the valgrind results will show
`Leak_DefinitelyLost` results. My hypothesis is that node does not unload the addon
when it's exiting, so valgrind believes that memory is lost.

To test that, I created `multi-thread.node-test.js` and `worker-thread-exec-test.node-test.js`.
Neither of them load code-events in the main thread; only in the worker-threads they create.
Because the worker threads end, and the main thread does not have the addon loaded, node
should unload the addon when the worker-threads terminate. Both tests result in
`valgrind output clean`, so it appears that no memory is being lost and that the
`Leak_DefinitelyLost` message is valgrind misinterpreting the context-specific data
in the code-events addon.

#### Note re: spawned-test.node-test.js

This was my first attempt at getting node to unload the addon. I expected node would
unload the addon when the child process was done. It might, or might not - valgrind
writes a bad `valgrind.xml` output file that looks like the two processes are either
overwriting or interleaving data. There are two `</valgrindoutput>` close tags, but
only one `<valgrindoutput>` open tag. I didn't spend any time trying to debug what
was going on with valgrind.


## Publishing

Simply run `npm version` and `git push && git push --tags`. CI will take care of
releasing on taggedcommits.
