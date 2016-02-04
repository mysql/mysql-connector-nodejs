var assert = require('assert');
var WorkQueue = require('../../lib/WorkQueue');

describe('WorkQueue', function () {
    describe('Simple queue processing', function () {
        it('should throw an exception when empty', function () {
            var called = false;
            var queue = new WorkQueue();
            assert.throws(
                function() {
                    queue.process(true);
                },
                /Queue is empty/
            );
        });
        it('should call first handler on first call', function () {
            var called = false;
            var queue = new WorkQueue();
            queue.push(function() {
                called = true;
            });
            assert.equal(false, called);
            queue.process(false);
            assert.equal(true, called);
        });
        it('should call first handler on repeating calls', function () {
            var called = 0;
            var queue = new WorkQueue();
            queue.push(function () {
                called++;
            });
            assert.equal(false, called);
            for (var i = 0; i < 10; ++i) {
                queue.process(false);
                assert.equal(i + 1, called);
            }
        });
        it('should provide the argument passed to process to the handler', function () {
            var queue = new WorkQueue();
            queue.push(function (arg) {
                assert.equal("teststring", arg)
            });
            queue.process("teststring");
        });
        it('should provide a callback as second argument to callback', function () {
            var queue = new WorkQueue();
            queue.push(function(message, cb) {
                assert.equal('function', typeof cb);
            });
            queue.process(false);
        });
        it('should throw exception when queue becomes empty', function () {
            var queue = new WorkQueue();
            queue.push(function(message, cb) {
                cb();
            });
            queue.process(true);
            assert.throws(
                function() {
                    queue.process(true);
                },
                /Queue is empty/
            );
        });
        it('should clear', function () {
            var queue = new WorkQueue();
            queue.push(function(message, cb) {
                cb();
            });
            queue.clear();
            assert.throws(
                function() {
                    queue.process(true);
                },
                /Queue is empty/
            );
        });
        it('should handle multiple handlers in order', function () {
            var cnt = 0;
            var queue = new WorkQueue();
            for (var i = 0; i < 10; ++i) {
                queue.push(function (message, cb) {
                    cnt++;
                    cb();
                });
            }
            for (var i = 0; i < 10; ++i) {
                queue.process(true);
                assert.equal(i + 1, cnt);
            }
        });
        it('should throw after last handler', function () {
            var queue = new WorkQueue();
            for (var i = 0; i < 10; ++i) {
                queue.push(function (message, cb) {
                    cb();
                });
            }
            for (var i = 0; i < 10; ++i) {
                queue.process(true);
            }
            assert.throws(
                function() {
                    queue.process(true);
                },
                /Queue is empty/
            );
        });

    });
});
