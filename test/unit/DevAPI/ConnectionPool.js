/*
 * Copyright (c) 2018, 2022, Oracle and/or its affiliates.
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

const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const td = require('testdouble');
const util = require('util');

// subject under test needs to be reloaded with replacement fakes
let connectionPool = require('../../../lib/DevAPI/ConnectionPool');

describe('ConnectionPool', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('create()', () => {
        it('returns an initialized pool instance', () => {
            let pool = connectionPool().create();

            expect(pool.destroy).to.be.a('function');
            expect(pool.getConnection).to.be.a('function');
            expect(pool.isFull).to.be.a('function');
            expect(pool.reset).to.be.a('function');
            expect(pool.update).to.be.a('function');

            pool = connectionPool().create({ foo: 'bar' });

            expect(pool.destroy).to.be.a('function');
            expect(pool.getConnection).to.be.a('function');
            expect(pool.isFull).to.be.a('function');
            expect(pool.reset).to.be.a('function');
            expect(pool.update).to.be.a('function');
        });
    });

    context('destroy()', () => {
        let destroy;

        before('create fakes', () => {
            destroy = td.function();
        });

        it('destroys all active and idle connections', () => {
            const pool = connectionPool().create({ active: [{ destroy }, { destroy }], idle: [{ destroy }] });

            td.when(destroy()).thenResolve();

            return pool.destroy()
                .then(() => {
                    return expect(td.explain(destroy).callCount).to.equal(3);
                });
        });

        it('resets the pool state on success', () => {
            const pool = connectionPool();
            const reset = td.replace(pool, 'reset');

            return pool.destroy()
                .then(() => {
                    return expect(td.explain(reset).callCount).to.equal(1);
                });
        });

        it('resets the pool state on failure', () => {
            const error = new Error('foobar');
            const pool = connectionPool().create({ active: [{ destroy }] });
            const reset = td.replace(pool, 'reset');

            td.when(destroy()).thenReject(error);

            return pool.destroy()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                    return expect(td.explain(reset).callCount).to.equal(1);
                });
        });

        it('makes the pool instance unvailable for future use', () => {
            const pool = connectionPool().create({ active: [{ destroy }] });

            return pool.destroy()
                .then(() => {
                    // eslint-disable-next-line no-unused-expressions
                    expect(pool.isAvailable()).to.be.false;
                });
        });
    });

    context('getConnection()', () => {
        let acquire, connection, destroy, isClosing, isExpired, isOpen, open, override;

        beforeEach('create fakes', () => {
            acquire = td.function();
            connection = td.function();
            destroy = td.function();
            isClosing = td.function();
            isExpired = td.function();
            isOpen = td.function();
            open = td.function();
            override = td.function();

            td.replace('../../../lib/DevAPI/PoolConnection', connection);

            connectionPool = require('../../../lib/DevAPI/ConnectionPool');
        });

        it('acquires and returns an idle connection if one exists and no expired ones exist', () => {
            const poolConnection = { acquire, isClosing, isExpired, isOpen, override };
            const pool = connectionPool({ pooling: { maxSize: 3 } }).create({ active: ['foo'], idle: [poolConnection] });
            const isAvailable = td.replace(pool, 'isAvailable');
            const update = td.replace(pool, 'update');

            td.when(update()).thenResolve();
            td.when(isAvailable()).thenReturn(true);
            td.when(isClosing()).thenReturn(false);
            td.when(isOpen()).thenReturn(true);
            td.when(isExpired()).thenReturn(false);
            td.when(override()).thenResolve(poolConnection);

            return pool.getConnection()
                .then(con => {
                    expect(td.explain(acquire).callCount).to.equal(1);
                    expect(pool.activeConnections()).to.deep.include(con);
                    // eslint-disable-next-line no-unused-expressions
                    expect(pool.idleConnections()).to.be.an('array').and.be.empty;
                    return expect(con).to.deep.equal(poolConnection);
                });
        });

        it('acquires and returns an idle connection if one exists and expired ones exist', () => {
            const poolConnection = { acquire, isClosing, isExpired, isOpen, override };
            const pool = connectionPool({ pooling: { maxSize: 3 } }).create({ active: ['foo'], idle: [poolConnection], expired: ['bar'] });
            const isAvailable = td.replace(pool, 'isAvailable');
            const update = td.replace(pool, 'update');

            td.when(update()).thenResolve();
            td.when(isAvailable()).thenReturn(true);
            td.when(isClosing()).thenReturn(false);
            td.when(isOpen()).thenReturn(true);
            td.when(isExpired()).thenReturn(false);
            td.when(override()).thenResolve(poolConnection);

            return pool.getConnection()
                .then(con => {
                    expect(td.explain(acquire).callCount).to.equal(1);
                    expect(pool.activeConnections()).to.deep.include(con);
                    // eslint-disable-next-line no-unused-expressions
                    expect(pool.idleConnections()).to.be.an('array').and.be.empty;
                    return expect(con).to.deep.equal(poolConnection);
                });
        });

        it('acquires and returns a refurbished connection if one exists and no idle ones exist but expired ones exist', () => {
            const expiredConnection = { isClosing, isExpired, isOpen, open };
            const options = { foo: 'bar', pooling: { maxSize: 3 } };
            const pool = connectionPool(options).create({ active: ['baz'], idle: [], expired: [expiredConnection] });
            const isAvailable = td.replace(pool, 'isAvailable');
            const update = td.replace(pool, 'update');
            const poolConnection = { acquire };

            td.when(update()).thenResolve();
            td.when(isAvailable()).thenReturn(true);
            td.when(isClosing()).thenReturn(false);
            td.when(isOpen()).thenReturn(true);
            td.when(isExpired()).thenReturn(true);
            td.when(open()).thenResolve(poolConnection);

            return pool.getConnection()
                .then(con => {
                    expect(td.explain(acquire).callCount).to.equal(1);
                    expect(pool.activeConnections()).to.deep.include(con);
                    // eslint-disable-next-line no-unused-expressions
                    expect(pool.expiredConnections()).to.be.an('array').and.be.empty;
                    return expect(con).to.deep.equal(poolConnection);
                });
        });

        it('acquires and returns a refurbished connection if all idle ones have expired', () => {
            const expiredConnection = { isClosing, isExpired, isOpen, open };
            const options = { foo: 'bar', pooling: { maxSize: 3 } };
            const pool = connectionPool(options).create({ active: ['baz'], idle: [expiredConnection] });
            const isAvailable = td.replace(pool, 'isAvailable');
            const update = td.replace(pool, 'update');
            const poolConnection = { acquire };

            td.when(update()).thenResolve();
            td.when(isAvailable()).thenReturn(true);
            td.when(isClosing()).thenReturn(false);
            td.when(isOpen()).thenReturn(true);
            td.when(isExpired()).thenReturn(true);
            td.when(open()).thenResolve(poolConnection);

            return pool.getConnection()
                .then(con => {
                    expect(td.explain(acquire).callCount).to.equal(1);
                    expect(pool.activeConnections()).to.deep.include(con);
                    // eslint-disable-next-line no-unused-expressions
                    expect(pool.idleConnections()).to.be.an('array').and.be.empty;
                    return expect(con).to.deep.equal(poolConnection);
                });
        });

        it('acquires and returns a new connection if neither idle nor expired ones exist', () => {
            const options = { foo: 'bar', pooling: { maxSize: 3 } };
            const pool = connectionPool(options).create({ active: ['baz'], idle: [], expired: [] });
            const isAvailable = td.replace(pool, 'isAvailable');
            const update = td.replace(pool, 'update');
            const poolConnection = { acquire };

            td.when(update()).thenResolve();
            td.when(isAvailable()).thenReturn(true);
            td.when(connection(options)).thenReturn({ open });
            td.when(open()).thenResolve(poolConnection);

            return pool.getConnection()
                .then(con => {
                    expect(td.explain(acquire).callCount).to.equal(1);
                    expect(pool.activeConnections()).to.deep.include(con);
                    return expect(con).to.deep.equal(poolConnection);
                });
        });

        context('when the pool is full', () => {
            let system;

            beforeEach('setup fake time', () => {
                system = td.replace('../../../lib/system');

                connectionPool = require('../../../lib/DevAPI/ConnectionPool');
            });

            it('queues the request if queueTimeout was not exceeded', done => {
                const queueTimeout = 1000;
                const options = { pooling: { maxSize: 3, queueTimeout } };
                const pool = connectionPool(options).create({ active: ['foo', 'bar', 'baz'] });
                const isAvailable = td.replace(pool, 'isAvailable');
                const update = td.replace(pool, 'update');
                const poolConnection = { acquire };
                const now = Date.now();

                // The last time it is called, system.time() should return a time
                // after queueTimeout.
                td.when(system.time()).thenReturn(now + queueTimeout / 10 + 1);
                // The first time it is called, system.time() should return the
                // initial time.
                td.when(system.time(), { times: 1 }).thenReturn(now);
                td.when(update()).thenResolve();
                td.when(isAvailable()).thenReturn(true);
                td.when(connection(options)).thenReturn({ open });
                td.when(open()).thenResolve(poolConnection);

                // We need to travel in time only after calling
                // pool.getConnection(), otherwise, Date.now() will also be in the
                // future.
                pool.getConnection().then(con => {
                    expect(td.explain(acquire).callCount).to.equal(1);
                    expect(pool.activeConnections()).to.deep.include(con);
                    expect(con).to.deep.equal(poolConnection);

                    return done();
                });

                // We reset the pool after queueTimeout / 10.
                setTimeout(() => pool.reset(), queueTimeout / 10);
            });

            it('queues the request when an an expired connection is available but is still being closed and queueTimeout was not exceeded', () => {
                const queueTimeout = 1000;
                const options = { pooling: { maxSize: 3, queueTimeout } };
                const pool = connectionPool(options).create({ active: ['foo', 'bar'], expired: [{ isClosing }] });
                const isAvailable = td.replace(pool, 'isAvailable');
                const update = td.replace(pool, 'update');
                const poolConnection = { acquire };
                const now = Date.now();

                // The last time it is called, system.time() should return a time
                // after queueTimeout.
                td.when(system.time()).thenReturn(now + queueTimeout / 10 + 1);
                // The first time it is called, system.time() should return the
                // initial time.
                td.when(system.time(), { times: 1 }).thenReturn(now);
                td.when(update()).thenResolve();
                td.when(isAvailable()).thenReturn(true);
                td.when(isClosing()).thenReturn(true);
                td.when(connection(options)).thenReturn({ open });
                td.when(open()).thenResolve(poolConnection);

                // We need to travel in time only after calling
                // pool.getConnection(), otherwise, Date.now() will also be in the
                // future.
                return pool.getConnection()
                    .then(con => {
                        expect(td.explain(acquire).callCount).to.equal(1);
                        expect(pool.activeConnections()).to.deep.include(con);
                        return expect(con).to.deep.equal(poolConnection);
                    });
            });

            it('fails when queueTimeout is exceeded', () => {
                const queueTimeout = 5000;
                const pool = connectionPool({ pooling: { maxSize: 3, queueTimeout } }).create({ active: ['foo', 'bar', 'baz'] });
                const isAvailable = td.replace(pool, 'isAvailable');
                const update = td.replace(pool, 'update');
                const now = Date.now();

                // The last time it is called, system.time() should return a time
                // after queueTimeout.
                td.when(system.time()).thenReturn(now + queueTimeout + 1);
                // The first time it is called, system.time() should return the
                // initial time.
                td.when(system.time(), { times: 1 }).thenReturn(now);
                td.when(update()).thenResolve();
                td.when(isAvailable()).thenReturn(true);

                // We need to travel in time only after calling
                // pool.getConnection(), otherwise, Date.now() will also be in the
                // future.
                return pool.getConnection()
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_POOL_QUEUE_TIMEOUT, queueTimeout));
                    });
            });
        });

        it('does not re-use any connection when the pool is not available', () => {
            const options = { pooling: { maxSize: 2, queueTimeout: 0 } };
            const poolConnection = { destroy, override };
            const pool = connectionPool(options).create({ idle: [poolConnection, poolConnection] });
            const isAvailable = td.replace(pool, 'isAvailable');
            const update = td.replace(pool, 'update');

            td.when(update()).thenResolve();
            td.when(isAvailable()).thenReturn(false);

            return pool.getConnection()
                .then(() => {
                    expect(td.explain(override).callCount).to.equal(0);
                });
        });

        it('does not refurbish any connection when the pool is not available', () => {
            const options = { pooling: { maxSize: 2, queueTimeout: 0 } };
            const poolConnection = { destroy, open };
            const pool = connectionPool(options).create({ expired: [poolConnection, poolConnection] });
            const isAvailable = td.replace(pool, 'isAvailable');
            const update = td.replace(pool, 'update');

            td.when(update()).thenResolve();
            td.when(isAvailable()).thenReturn(false);

            return pool.getConnection()
                .then(() => {
                    expect(td.explain(open).callCount).to.equal(0);
                });
        });

        it('does not create new connections when the pool is not available', () => {
            const options = { pooling: { maxSize: 2, queueTimeout: 0 } };
            const pool = connectionPool(options).create();
            const isAvailable = td.replace(pool, 'isAvailable');

            td.when(isAvailable()).thenReturn(false);
            td.when(connection(options)).thenReturn({ open });
            td.when(open()).thenResolve({ acquire });

            return Promise.all([pool.getConnection(), pool.destroy()])
                .then(() => {
                    expect(td.explain(open).callCount).to.equal(0);
                });
        });
    });

    context('isAvailable()', () => {
        let destroy;

        beforeEach('create fakes', () => {
            destroy = td.function();
        });

        it('checks if the pool is available to fulfill connection requests', done => {
            const poolConnection = { destroy };
            const pool = connectionPool({ pooling: { maxSize: 2 } }).create({ active: [poolConnection, poolConnection] });

            // eslint-disable-next-line no-unused-expressions
            expect(pool.isAvailable()).to.be.true;

            // We need to check the state before the pool is effectively
            // closed.
            pool.destroy().then(() => done());
            // eslint-disable-next-line no-unused-expressions
            expect(pool.isAvailable()).to.be.false;
        });
    });

    context('isFull()', () => {
        it('checks if the pool is full', () => {
            let pool = connectionPool({ pooling: { maxSize: 3 } }).create({ active: ['foo', 'bar', 'baz'] });
            // eslint-disable-next-line no-unused-expressions
            expect(pool.isFull()).to.be.true;

            pool = connectionPool({ pooling: { maxSize: 2 } }).create({ active: ['foo'] });
            return expect(pool.isFull()).to.be.false;
        });
    });

    context('reset()', () => {
        it('resets the internal state of the pool', () => {
            const pool = connectionPool().create({ active: ['foo', 'bar'], idle: ['baz', 'qux'], expired: ['qux'] }).reset();

            /* eslint-disable no-unused-expressions */
            expect(pool.activeConnections()).to.be.an('array').and.be.empty;
            expect(pool.idleConnections()).to.be.an('array').and.be.empty;
            expect(pool.expiredConnections()).to.be.an('array').and.be.empty;
            /* elint-enable no-unused-expressions */
            return expect(pool.isAvailable()).to.be.false;
        });
    });

    context('update()', () => {
        let destroy, isExpired, isIdle, isOpen;

        beforeEach('create fakes', () => {
            destroy = td.function();
            isExpired = td.function();
            isIdle = td.function();
            isOpen = td.function();
        });

        it('moves active connections that have been closed by the client into the list of idle connections', () => {
            const connection = { isExpired, isIdle, isOpen };
            const pool = connectionPool().create({ active: [connection] });

            td.when(isOpen()).thenReturn(true);
            td.when(isExpired()).thenReturn(false);
            td.when(isIdle()).thenReturn(true);
            td.when(destroy()).thenResolve();

            return pool.update()
                .then(() => {
                    // eslint-disable-next-line no-unused-expressions
                    expect(pool.activeConnections()).to.be.an('array').and.be.empty;
                    return expect(pool.idleConnections()).to.deep.include(connection);
                });
        });

        it('moves active connections that have been closed by the server into the list of expired connections', () => {
            const connection = { destroy, isIdle, isOpen };
            const pool = connectionPool().create({ active: [connection] });

            td.when(isOpen()).thenReturn(false);
            td.when(destroy()).thenResolve();

            return pool.update()
                .then(() => {
                    // eslint-disable-next-line no-unused-expressions
                    expect(pool.activeConnections()).to.be.an('array').and.be.empty;
                    return expect(pool.expiredConnections()).to.deep.include(connection);
                });
        });

        it('moves idle connections that have expired into the list of expired connections', () => {
            const connection = { destroy, isExpired, isOpen };
            const pool = connectionPool().create({ idle: [connection] });

            td.when(isOpen()).thenReturn(true);
            td.when(isExpired()).thenReturn(true);
            td.when(destroy()).thenResolve();

            return pool.update()
                .then(() => {
                    // eslint-disable-next-line no-unused-expressions
                    expect(pool.idleConnections()).to.be.an('array').and.be.empty;
                    return expect(pool.expiredConnections()).to.deep.include(connection);
                });
        });

        it('destroys all connections that have expired or have been closed', () => {
            const connection1 = { destroy };
            const connection2 = { destroy };
            const pool = connectionPool().create({ expired: [connection1, connection2] });

            td.when(destroy()).thenResolve(connection2);
            td.when(destroy(), { times: 1 }).thenResolve(connection1);

            return pool.update()
                .then(res => {
                    expect(res).to.be.an('array').and.have.lengthOf(2);
                    expect(res[0]).to.deep.equal(connection1);
                    expect(res[1]).to.deep.equal(connection2);
                });
        });
    });

    context('ConnectionPool.validate()', () => {
        it('fails when an unknown property is specified', () => {
            return expect(() => connectionPool.validate({ foo: 'bar' })).to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION, 'pooling.foo'));
        });

        it('fails when the "enabled" property value is not a boolean', () => {
            const error = errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE;
            const path = 'pooling.enabled';

            expect(() => connectionPool.validate({ enabled: 'foo' })).to.throw(util.format(error, path, 'foo'));
            expect(() => connectionPool.validate({ enabled: 1 })).to.throw(util.format(error, path, 1));
            expect(() => connectionPool.validate({ enabled: null })).to.throw(util.format(error, path, null));
            expect(() => connectionPool.validate({ enabled: [] })).to.throw(util.format(error, path, []));
            expect(() => connectionPool.validate({ enabled: {} })).to.throw(util.format(error, path, {}));
        });

        it('fails when the "maxIdleTime" property is not a positive integer (including 0)', () => {
            const error = errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE;
            const path = 'pooling.maxIdleTime';

            expect(() => connectionPool.validate({ maxIdleTime: -1 })).to.throw(util.format(error, path, -1));
            expect(() => connectionPool.validate({ maxIdleTime: 'foo' })).to.throw(util.format(error, path, 'foo'));
            expect(() => connectionPool.validate({ maxIdleTime: true })).to.throw(util.format(error, path, true));
            expect(() => connectionPool.validate({ maxIdleTime: false })).to.throw(util.format(error, path, false));
            expect(() => connectionPool.validate({ maxIdleTime: null })).to.throw(util.format(error, path, null));
            expect(() => connectionPool.validate({ maxIdleTime: [] })).to.throw(util.format(error, path, []));
            expect(() => connectionPool.validate({ maxIdleTime: {} })).to.throw(util.format(error, path, {}));
        });

        it('fails when the "maxSize" property is not an integer above 1', () => {
            const error = errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE;
            const path = 'pooling.maxSize';

            expect(() => connectionPool.validate({ maxSize: 0 })).to.throw(util.format(error, path, 0));
            expect(() => connectionPool.validate({ maxSize: 'foo' })).to.throw(util.format(error, path, 'foo'));
            expect(() => connectionPool.validate({ maxSize: true })).to.throw(util.format(error, path, true));
            expect(() => connectionPool.validate({ maxSize: false })).to.throw(util.format(error, path, false));
            expect(() => connectionPool.validate({ maxSize: null })).to.throw(util.format(error, path, null));
            expect(() => connectionPool.validate({ maxSize: [] })).to.throw(util.format(error, path, []));
            expect(() => connectionPool.validate({ maxSize: {} })).to.throw(util.format(error, path, {}));
        });

        it('fails when the "queueTimeout" property is not a positive integer (including 0)', () => {
            const error = errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE;
            const path = 'pooling.queueTimeout';

            expect(() => connectionPool.validate({ queueTimeout: -1 })).to.throw(util.format(error, path, -1));
            expect(() => connectionPool.validate({ queueTimeout: 'foo' })).to.throw(util.format(error, path, 'foo'));
            expect(() => connectionPool.validate({ queueTimeout: true })).to.throw(util.format(error, path, true));
            expect(() => connectionPool.validate({ queueTimeout: false })).to.throw(util.format(error, path, false));
            expect(() => connectionPool.validate({ queueTimeout: null })).to.throw(util.format(error, path, null));
            expect(() => connectionPool.validate({ queueTimeout: [] })).to.throw(util.format(error, path, []));
            expect(() => connectionPool.validate({ queueTimeout: {} })).to.throw(util.format(error, path, {}));
        });
    });
});
