/*
 * Copyright (c) 2016, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const WorkQueue = require('../../lib/WorkQueue');
const errors = require('../../lib/constants/errors');
const expect = require('chai').expect;

describe('WorkQueue', () => {
    describe('Simple queue processing', () => {
        it('throws an exception when empty', () => {
            expect(() => (new WorkQueue()).process(true)).to.throw(errors.MESSAGES.ER_X_CLIENT_EMPTY_WORK_QUEUE);
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

            expect(() => queue.process(true)).to.throw(errors.MESSAGES.ER_X_CLIENT_EMPTY_WORK_QUEUE);
        });

        it('clears', () => {
            const queue = new WorkQueue();
            queue.push((message, cb) => cb());
            queue.clear();

            expect(() => queue.process(true)).to.throw(errors.MESSAGES.ER_X_CLIENT_EMPTY_WORK_QUEUE);
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

            expect(() => queue.process(true)).to.throw(errors.MESSAGES.ER_X_CLIENT_EMPTY_WORK_QUEUE);
        });
    });
});
