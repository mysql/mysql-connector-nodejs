'use strict';

/* eslint-env node, mocha */

const connectionPool = require('../../../lib/DevAPI/ConnectionPool');
const expect = require('chai').expect;
const td = require('testdouble');

describe('DevAPI ConnectionPool', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('factory', () => {
        it('throws an error when unknown options are provided', () => {
            expect(() => connectionPool({ foo: 'bar' })).to.throw(`Client option 'pooling.foo' is not recognized as valid.`);
        });

        it('throws an error when invalid option values are provided', () => {
            const nonBooleans = [undefined, null, 1, 2.2, 'foo', {}, [], () => {}];
            const nonPositiveIntegers = [undefined, null, true, false, 2.2, -1, 'foo', {}, [], () => {}];
            const nonZeroOrPositiveIntegers = nonPositiveIntegers.concat(0);

            nonBooleans.forEach(invalid => {
                expect(() => connectionPool({ enabled: invalid })).to.throw(`Client option 'pooling.enabled' does not support value '${invalid}'.`);
            });

            nonPositiveIntegers.forEach(invalid => {
                expect(() => connectionPool({ maxIdleTime: invalid })).to.throw(`Client option 'pooling.maxIdleTime' does not support value '${invalid}'.`);
            });

            nonZeroOrPositiveIntegers.forEach(invalid => {
                expect(() => connectionPool({ maxSize: invalid })).to.throw(`Client option 'pooling.maxSize' does not support value '${invalid}'.`);
            });

            nonPositiveIntegers.forEach(invalid => {
                expect(() => connectionPool({ queueTimeout: invalid })).to.throw(`Client option 'pooling.queueTimeout' does not support value '${invalid}'.`);
            });
        });
    });

    context('acquire()', () => {
        let connect, reset;

        beforeEach('create fakes', () => {
            connect = td.function();
            reset = td.function();
        });

        it('picks a new connection and create the given session', () => {
            const pool = connectionPool({ idle: [{ connect }, {}], maxIdleTime: 0, maxSize: 2 });

            td.when(connect()).thenResolve('foo');

            return pool.acquire()
                .then(actual => expect(actual).to.equal('foo'));
        });

        it('picks and reset an idle connection', () => {
            const pool = connectionPool({ idle: [{ _isOpen: true, reset }, {}], maxIdleTime: 0, maxSize: 2 });

            td.when(reset()).thenResolve('foo');

            return pool.acquire()
                .then(actual => expect(actual).to.equal('foo'));
        });

        it('creates a new connection if it cannot reset the underlying session', () => {
            const pool = connectionPool({ idle: [{ connect, reset }, { connect, reset }], maxIdleTime: 0, maxSize: 2 });

            td.when(connect()).thenResolve('foo');
            td.when(reset()).thenReject(new Error());

            return pool.acquire()
                .then(actual => expect(actual).to.equal('foo'));
        });

        it('waits for an idle connection before timing out', () => {
            const active = [{ _isValid: true, _isOpen: true, reset }, {}];
            const pool = connectionPool({ active, queueTimeout: 0, maxSize: 2 });

            td.when(reset()).thenResolve('foo');

            setTimeout(() => pool.release(active[0]), 200);

            return pool.acquire()
                .then(actual => expect(actual).to.equal('foo'));
        });

        it('fails when the queue timeout is exceeded', () => {
            const queueTimeout = 100;
            const pool = connectionPool({ active: [{ reset }, { reset }], idle: [], maxSize: 2, queueTimeout });
            const error = `Could not retrieve a connection from the pool. Timeout of ${queueTimeout} ms was exceeded.`;

            return pool.acquire()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });
    });

    // TODO(Rui): after BUG#28471569 gets a fix, a Mysqlx.Connection.Close message should be sent.
    context('destroy()', () => {
        let done;

        beforeEach('create fakes', () => {
            done = td.function();
        });

        it('closes all connections and disconnect from the server', () => {
            const maxSize = 4;
            const connections = [{ done }, { done }, { done }];
            const pool = connectionPool({ active: connections, idle: [{ done }], maxSize });

            td.when(done()).thenResolve();

            return pool.destroy()
                .then(() => {
                    expect(td.explain(done).callCount).to.equal(4); // active connections
                });
        });

        it('does not fail if there is an error closing a connection', () => {
            const active = [{ done }, { done }];
            const pool = connectionPool({ active, maxSize: active.length });
            const error = new Error('foobar');

            td.when(done()).thenReject(error);

            return pool.destroy()
                .then(() => {
                    expect(td.explain(done).callCount).to.equal(2); // actice connections
                });
        });
    });

    context('pick()', () => {
        let pool;

        context('legacy connections', () => {
            let disconnect;

            beforeEach('create fakes', () => {
                disconnect = td.function();

                pool = connectionPool({ enabled: false, idle: [{ disconnect }] });
            });

            it('returns an idle legacy connection if pooling is not enabled', () => {
                td.when(disconnect()).thenResolve();

                return pool.pick().close()
                    .then(() => expect(td.explain(disconnect).callCount).to.equal(1));
            });

            it('clears the pool if the connection is closed', () => {
                const pool = connectionPool({ enabled: false, idle: [{ disconnect }] });
                const clear = td.replace(pool, 'clear');

                td.when(disconnect()).thenResolve();

                return pool.pick().close()
                    .then(() => expect(td.explain(clear).callCount).to.equal(1));
            });
        });

        context('pooling connections', () => {
            it('returns an idle pooled connection if pooling is enabled', () => {
                const session = {};
                const pool = connectionPool({ active: [{}, {}], enabled: true, idle: [session] });
                const release = td.replace(pool, 'release');

                return pool.pick().close()
                    .then(() => {
                        expect(td.explain(release).callCount).to.equal(1);
                        expect(td.explain(release).calls[0].args[0]).to.equal(session);
                    });
            });
        });
    });

    context('refresh()', () => {
        let close;

        beforeEach('create fakes', () => {
            close = td.function();
        });

        it('closes all idle connections where the maximum idle time was exceeded', () => {
            const timestamp = Date.now();
            const pool = connectionPool({ idle: [{ close, timestamp }, { close, timestamp }, { close, timestamp: timestamp + 200 }], maxIdleTime: 50, maxSize: 3 });

            const delay = () => new Promise((resolve, reject) => {
                setTimeout(() => pool.refresh().then(resolve).catch(reject), 100);
            });

            return delay()
                .then(() => expect(td.explain(close).callCount).to.equal(2));
        });

        it('does not close any connection if the maximum idle time time is infinite', () => {
            const timestamp = Date.now();
            const pool = connectionPool({ idle: [{ close, timestamp }, { close, timestamp }], maxIdleTime: 0, maxSize: 3 });

            const delay = () => new Promise((resolve, reject) => {
                setTimeout(() => pool.refresh().then(resolve).catch(reject), 100);
            });

            return delay()
                .then(() => expect(td.explain(close).callCount).to.equal(0));
        });
    });

    context('release()', () => {
        it('moves move a connection from active state into idle state', () => {
            const active = [{ id: 'foo' }, { id: 'bar' }];
            const pool = connectionPool({ active, idle: [], maxSize: 2 });

            pool.release(active[1]);

            return expect(pool.pick()).to.deep.include({ id: 'bar' });
        });
    });
});
