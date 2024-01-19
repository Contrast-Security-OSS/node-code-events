#!/bin/bash

# execute the suite of leak tests. leak tests follow the *.node-test.js naming
# convention. each test is intended to be run in isolation because they generate
# a valgrind.xml file that is parsed to determine if there are any leaks.
#
# this script is intended to be run from the root of the project.

VALGRIND_CMD="valgrind --xml=yes --xml-file=./valgrind.xml --trace-children=yes --leak-check=full --show-leak-kinds=all"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

errors=0

#
# these tests fail because valgrind detects leaks.
#
# noop.node-test.js does nothing more than require the code-events addon. valgrind
# reports 120 bytes definitely lost (88 directly, 32 indirectly). 88 bytes is the
# size of the CodeEvents instance and the indirect bytes have nothing to do with
# our code in the addon - it does no listen, so it doesn't build a queue or allocate
# EventNodes in the queue.
#
# index-exclude.node-test.js loads the code-events addon with the default options,
# which exclude non-function types and node scripts. valgrind reports 218 bytes
# definitely lost (88 directly, 130 indirectly). the key is that the code-events
# instance is what is causing the indirect bytes to be held.
#
# index-include.node-test.js loads the code-events addon with with options that
# cause it to return both the type and node scripts. this test has code at the
# end that turns off the listener and then fetches all queued events. valgrind
# reports 120 bytes definitely lost (88 directly, 32 indirectly) - the same as
# the noop test.
#
# so the key is to get node to unload the addon and make sure there are no leaks
# when it does. see the EXPECT_PASS section below for those tests.
#
EXPECT_FAIL="noop.node-test.js index-exclude.node-test.js index-include.node-test.js"

for test in $EXPECT_FAIL; do
    echo "expecting $test to detect leak"
    if ! $VALGRIND_CMD node "./test/$test" ; then
        echo -e "${RED}$test failed (the test should not fail)$NC"
        exit 1
    fi

    if ! node ./scripts/parse-valgrind.js ; then
        echo -e "${GREEN}parse-valgrind-xml for $test found leaks (as expected)$NC"
    else
        echo -e "${RED}parse-valgrind-xml for $test found no leaks (NOT EXPECTED)$NC"
        errors=$((errors+1))
    fi
done

#
# multi-thread.node-test.js only loads the code-events addon in worker threads, not in
# the main thread. when the threads terminate all their memory should be freed.
#
# worker-thread-exec-test.node-test.js executes index-include.node-test.js in a worker
# thread. even though valgrind detects leaks with that test, this test shows that they
# are not "real" leaks because the memory is freed when the thread terminates (because
# the addon is unloaded at that time).
#
EXPECT_PASS="multi-thread.node-test.js worker-thread-exec-test.node-test.js"

for test in $EXPECT_PASS; do
    echo -e "expecting $test to not detect leak"
    if ! $VALGRIND_CMD node "./test/$test" ; then
        echo -e "${RED}$test failed (the test should not fail)$NC"
        exit 1
    fi

    if ! node ./scripts/parse-valgrind.js ; then
        echo -e "${RED}parse-valgrind-xml for $test found leaks (NOT EXPECTED)$NC"
        errors=$((errors+1))
    else
        echo -e "${GREEN}parse-valgrind-xml for $test found no leaks$NC"
    fi
done

exit $errors
