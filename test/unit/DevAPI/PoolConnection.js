/*
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
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
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let poolConnection = require('../../../lib/DevAPI/PoolConnection');

describe('X DevAPI Pool Connection', () => {
    let connection;

    beforeEach('create fakes', () => {
        connection = td.function();

        td.replace('../../../lib/DevAPI/Connection', connection);

        poolConnection = require('../../../lib/DevAPI/PoolConnection');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('mixins', () => {
        it('mixes in the general Connection API', () => {
            const options = 'foo';
            const bar = td.function();

            td.when(bar()).thenReturn('baz');
            td.when(connection(options)).thenReturn({ bar });

            expect(poolConnection(options).bar).to.be.a('function');
            return expect(poolConnection(options).bar()).to.equal('baz');
        });
    });

    context('acquire()', () => {
        it('activates the connection', () => {
            const con = poolConnection().acquire();

            return expect(con.isIdle()).to.be.false;
        });
    });

    context('close()', () => {
        it('deactivates the connection with a current timestamp', () => {
            const con = poolConnection();

            return con.close()
                .then(() => {
                    return expect(con.isIdle()).to.be.true;
                });
        });
    });

    context('isExpired()', () => {
        let system;

        beforeEach('setup fake time', () => {
            system = td.replace('../../../lib/system');

            poolConnection = require('../../../lib/DevAPI/PoolConnection');
        });

        it('checks if an idle connection has exceeded maxIdleTime', () => {
            const maxIdleTime = 2000;
            const con = poolConnection({ pooling: { maxIdleTime } });
            const now = Date.now();

            // maxIdleTime should be exceeded when we check if the connection
            // is idle.
            td.when(system.time()).thenReturn(now + maxIdleTime + 100);
            // Potential time after the connection is released.
            // Determined by the close() call.
            td.when(system.time(), { times: 1 }).thenReturn(now);

            // eslint-disable-next-line no-unused-expressions
            expect(con.isExpired()).to.be.false;

            return con.close()
                .then(() => {
                    return expect(con.isExpired()).to.be.true;
                });
        });

        it('does not check if a connection has expired when it is active', () => {
            return expect(poolConnection({ pooling: { maxIdleTime: 2000 } }).acquire().isExpired()).to.be.false;
        });

        it('does not check if a connection has expired when maxIdleTime is infinite', () => {
            const maxIdleTime = 0;
            const con = poolConnection({ pooling: { maxIdleTime } });

            // Potential time after the connection is released.
            // Determined by the close() call.
            td.when(system.time()).thenReturn(Date.now());

            // eslint-disable-next-line no-unused-expressions
            expect(con.isExpired()).to.be.false;

            return con.close()
                .then(() => {
                    return expect(con.isExpired()).to.be.false;
                });
        });
    });

    context('isFromPool()', () => {
        it('always reports that a connection is from a pool', () => {
            return expect(poolConnection().isFromPool()).to.be.true;
        });
    });

    context('isIdle()', () => {
        let system;

        beforeEach('setup fake time', () => {
            system = td.replace('../../../lib/system');

            poolConnection = require('../../../lib/DevAPI/PoolConnection');
        });

        it('checks if a connection is idle', () => {
            const maxIdleTime = 2000;
            const con = poolConnection({ pooling: { maxIdleTime } });

            // maxIdleTime should be exceeded when we check if a potential
            // expired connection is idle.
            td.when(system.time()).thenReturn(Date.now() + maxIdleTime + 100);

            // Fresh connections are never idle.
            // eslint-disable-next-line no-unused-expressions
            expect(con.isIdle()).to.be.false;

            // Active connections are also never idle.
            // eslint-disable-next-line no-unused-expressions
            expect(con.acquire().isIdle()).to.be.false;

            // Closed connections are always idle.
            return con.close()
                .then(() => {
                    // eslint-disable-next-line no-unused-expressions
                    expect(con.isIdle()).to.be.true;
                    // Expired connections should still be idle.
                    return expect(con.isIdle()).to.be.true;
                });
        });
    });
});
