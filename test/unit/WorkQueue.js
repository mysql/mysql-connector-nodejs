'use strict';

/* eslint-env node, mocha */

const WorkQueue = require('../../lib/WorkQueue');
const expect = require('chai').expect;

describe('WorkQueue', () => {
    describe('Simple queue processing', () => {
        it('throws an exception when empty', () => {
            expect(() => (new WorkQueue()).process(true)).to.throw(/Queue is empty/);
        });

        it('calls first handler on first call', () => {
            const queue = new WorkQueue();
            let called = false;

            queue.push(() => { called = true; });

            expect(called).to.equal(false);
            queue.process(false);
            expect(called).to.equal(true);
        });

        it('calls first handler on repeating calls', () => {
            const queue = new WorkQueue();
            let called = 0;

            queue.push(() => { called++; });

            expect(called).to.equal(0);

            for (let i = 0; i < 10; ++i) {
                queue.process(false);
                expect(called).to.equal(i + 1);
            }
        });

        it('provides the argument passed to process to the handler', () => {
            const queue = new WorkQueue();

            queue.push((arg) => {
                expect(arg).to.equal('teststring');
            });

            queue.process('teststring');
        });

        it('provides a callback as second argument to callback', () => {
            const queue = new WorkQueue();

            queue.push((message, cb) => {
                expect(cb).to.be.a('function');
            });

            queue.process(false);
        });

        it('throws exception when queue becomes empty', () => {
            const queue = new WorkQueue();
            queue.push((message, cb) => cb());
            queue.process(true);

            expect(() => queue.process(true)).to.throw(/Queue is empty/);
        });

        it('clears', () => {
            const queue = new WorkQueue();
            queue.push((message, cb) => cb());
            queue.clear();

            expect(() => queue.process(true)).to.throw(/Queue is empty/);
        });

        it('handles multiple handlers in order', () => {
            const queue = new WorkQueue();
            let count = 0;

            for (let i = 0; i < 10; ++i) {
                queue.push((message, cb) => {
                    count++;
                    cb();
                });
            }

            for (let i = 0; i < 10; ++i) {
                queue.process(true);
                expect(count).to.equal(i + 1);
            }
        });

        it('throws after last handler', () => {
            const queue = new WorkQueue();

            for (let i = 0; i < 10; ++i) {
                queue.push(function (message, cb) {
                    cb();
                });
            }

            for (let i = 0; i < 10; ++i) {
                queue.process(true);
            }

            expect(() => queue.process(true)).to.throw(/Queue is empty/);
        });
    });
});
