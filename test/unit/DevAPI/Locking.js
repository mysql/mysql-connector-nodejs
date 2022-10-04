/*
 * Copyright (c) 2017, 2022, Oracle and/or its affiliates.
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

const expect = require('chai').expect;
const locking = require('../../../lib/DevAPI/Locking');
const td = require('testdouble');

describe('Locking', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    it('sets the default lock type and mode', () => {
        const query = locking();

        expect(query.getLock_()).to.equal(locking.Type.NONE);
        expect(query.getLock_()).to.equal(locking.LockContention.DEFAULT);
    });

    context('lockShared()', () => {
        it('forces an associated statement to be re-prepared', () => {
            const forceRestart = td.function();
            const statement = locking({ preparable: { forceRestart } });

            statement.lockShared();

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('allows the default locking mode', () => {
            const query = locking().lockShared();

            expect(query.getLock_()).to.equal(locking.Type.SHARED_LOCK);
            expect(query.getLockOptions_()).to.equal(locking.LockContention.DEFAULT);
        });

        it('sets a valid given locking mode', () => {
            const query = locking().lockShared(locking.LockContention.NOWAIT);

            expect(query.getLock_()).to.equal(locking.Type.SHARED_LOCK);
            expect(query.getLockOptions_()).to.equal(locking.LockContention.NOWAIT);

            query.lockShared(locking.LockContention.SKIP_LOCKED);

            expect(query.getLock_()).to.equal(locking.Type.SHARED_LOCK);
            expect(query.getLockOptions_()).to.equal(locking.LockContention.SKIP_LOCKED);
        });

        it('throws an error if the locking mode is not valid', () => {
            expect(() => locking().lockShared('foo')).to.throw('Invalid lock contention mode. Use "NOWAIT" or "SKIP_LOCKED".');
        });
    });

    context('lockExclusive()', () => {
        it('forces an associated statement to be re-prepared', () => {
            const forceRestart = td.function();
            const statement = locking({ preparable: { forceRestart } });

            statement.lockExclusive();

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('allows the default locking mode', () => {
            const query = locking().lockExclusive();

            expect(query.getLock_()).to.equal(locking.Type.EXCLUSIVE_LOCK);
            expect(query.getLockOptions_()).to.equal(locking.LockContention.DEFAULT);
        });

        it('sets a valid given locking mode', () => {
            const query = locking().lockExclusive(locking.LockContention.NOWAIT);

            expect(query.getLock_()).to.equal(locking.Type.EXCLUSIVE_LOCK);
            expect(query.getLockOptions_()).to.equal(locking.LockContention.NOWAIT);

            query.lockExclusive(locking.LockContention.SKIP_LOCKED);

            expect(query.getLock_()).to.equal(locking.Type.EXCLUSIVE_LOCK);
            expect(query.getLockOptions_()).to.equal(locking.LockContention.SKIP_LOCKED);
        });

        it('throws an error if the locking mode is not valid', () => {
            expect(() => locking().lockExclusive('foo')).to.throw('Invalid lock contention mode. Use "NOWAIT" or "SKIP_LOCKED".');
        });
    });
});
