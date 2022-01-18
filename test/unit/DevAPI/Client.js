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

const expect = require('chai').expect;
const errors = require('../../../lib/constants/errors');
const td = require('testdouble');
const util = require('util');

// subject under test needs to be reloaded with replacement fakes
let client = require('../../../lib/DevAPI/Client');

describe('DevAPI Client', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getSession()', () => {
        let connection, pool, session;

        beforeEach('create fakes', () => {
            connection = td.function();
            pool = td.function();
            session = td.function();

            td.replace('../../../lib/DevAPI/Connection', connection);
            td.replace('../../../lib/DevAPI/ConnectionPool', pool);
            td.replace('../../../lib/DevAPI/Session', session);

            client = require('../../../lib/DevAPI/Client');
        });

        it('creates a session over a standalone connection if pooling is not enabled', () => {
            const options = { foo: 'bar', pooling: { enabled: false } };
            const open = td.function();

            td.when(connection(options)).thenReturn({ open });
            td.when(open()).thenResolve('baz');
            td.when(session('baz')).thenReturn('qux');

            return client(options).getSession()
                .then(res => {
                    expect(res).to.equal('qux');
                });
        });

        it('creates a session over a connection retrieved from a connection pool if pooling is enabled', () => {
            const options = { foo: 'bar', pooling: { enabled: true } };
            const create = td.function();
            const getConnection = td.function();

            td.when(pool(options)).thenReturn({ create });
            td.when(create()).thenReturn({ getConnection });
            td.when(getConnection()).thenResolve('baz');
            td.when(session('baz')).thenReturn('qux');

            return client(options).getSession()
                .then(res => {
                    expect(res).to.equal('qux');
                });
        });

        it('does not create a session if the pool is not able to return a valid connection', () => {
            const options = { foo: 'bar', pooling: { enabled: true } };
            const create = td.function();
            const getConnection = td.function();

            td.when(pool(options)).thenReturn({ create });
            td.when(create()).thenReturn({ getConnection });
            td.when(getConnection()).thenResolve('baz');

            return client(options).getSession()
                .then(res => {
                    return expect(res).to.not.exist;
                });
        });
    });

    context('close()', () => {
        let connection, pool, session;

        beforeEach('create fakes', () => {
            connection = td.function();
            pool = td.function();
            session = td.function();

            td.replace('../../../lib/DevAPI/Connection', connection);
            td.replace('../../../lib/DevAPI/ConnectionPool', pool);
            td.replace('../../../lib/DevAPI/Session', session);

            client = require('../../../lib/DevAPI/Client');
        });

        it('destroys an existing connection pool', () => {
            const destroy = td.function();
            const create = td.function();
            const getConnection = td.function();

            td.when(pool(), { ignoreExtraArgs: true }).thenReturn({ create });
            td.when(create()).thenReturn({ destroy, getConnection });
            td.when(getConnection()).thenResolve('foo');
            td.when(session('foo')).thenReturn();
            td.when(destroy()).thenResolve();

            const cli = client({ pooling: { enabled: true } });

            return cli.getSession()
                .then(() => {
                    return cli.close();
                })
                .then(() => {
                    expect(td.explain(destroy).callCount).to.equal(1);
                });
        });

        it('fails if an existing connection pool has already been destroyed', () => {
            const destroy = td.function();
            const create = td.function();
            const getConnection = td.function();

            td.when(pool(), { ignoreExtraArgs: true }).thenReturn({ create });
            td.when(create()).thenReturn({ destroy, getConnection });
            td.when(getConnection()).thenResolve('foo');
            td.when(session('foo')).thenReturn();
            td.when(destroy()).thenResolve();

            const cli = client({ pooling: { enabled: true } });

            return cli.getSession()
                .then(() => {
                    return cli.close();
                })
                .then(() => {
                    return cli.close();
                })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.deep.equal(errors.MESSAGES.ER_DEVAPI_POOL_CLOSED);
                });
        });

        it('fails if an existing connection pool is not available', () => {
            return client({ pooling: { enabled: true } }).close()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.deep.equal(errors.MESSAGES.ER_DEVAPI_POOL_CLOSED);
                });
        });

        it('destroys an existing standalone connection', () => {
            const destroy = td.function();
            const open = td.function();

            td.when(connection(), { ignoreExtraArgs: true }).thenReturn({ destroy, open });
            td.when(open()).thenResolve('foo');
            td.when(session('foo')).thenReturn();
            td.when(destroy()).thenResolve();

            const cli = client({ pooling: { enabled: false } });

            return cli.getSession()
                .then(() => {
                    return cli.close();
                })
                .then(() => {
                    expect(td.explain(destroy).callCount).to.equal(1);
                });
        });

        it('does nothing if an existing standalone connection has already been closed', () => {
            const destroy = td.function();
            const open = td.function();

            td.when(connection(), { ignoreExtraArgs: true }).thenReturn({ destroy, open });
            td.when(open()).thenResolve('foo');
            td.when(session('foo')).thenReturn();
            td.when(destroy()).thenResolve();

            const cli = client({ pooling: { enabled: false } });

            return cli.getSession()
                .then(() => {
                    return cli.close();
                })
                .then(() => {
                    return cli.close();
                })
                .then(() => {
                    expect(td.explain(destroy).callCount).to.equal(1);
                });
        });

        it('does nothing if an existing standalone connection is not available', () => {
            const destroy = td.function();

            td.when(connection(), { ignoreExtraArgs: true }).thenReturn(null);
            td.when(destroy()).thenResolve();

            return client({ pooling: { enabled: false } }).close()
                .then(() => {
                    expect(td.explain(destroy).callCount).to.equal(0);
                });
        });
    });

    context('Client.validate()', () => {
        let connection, pool;

        beforeEach('create fakes', () => {
            connection = td.replace('../../../lib/DevAPI/Connection');
            pool = td.replace('../../../lib/DevAPI/ConnectionPool');

            client = require('../../../lib/DevAPI/Client');
        });

        it('fails when a connection option is badly specified', () => {
            const options = { foo: 'bar' };
            const error = new Error('foobar');

            td.when(connection.validate(options)).thenThrow(error);

            return expect(() => client.validate(options)).to.throw(error);
        });

        it('fails when an unknown client option is provided', () => {
            const options = { foo: 'bar' };

            td.when(connection.validate(), { ignoreExtraArgs: true }).thenReturn(true);

            return expect(() => client.validate(options)).to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION, 'foo'));
        });

        it('fails when the pooling option is badly specified', () => {
            const options = { pooling: 'foo' };

            td.when(connection.validate(), { ignoreExtraArgs: true }).thenReturn(true);

            return expect(() => client.validate(options)).to.throw(util.format(errors.MESSAGES.ER_DEVAPI_BAD_CLIENT_OPTION_VALUE, 'pooling', 'foo'));
        });

        it('fails when a pooling option value is badly specified', () => {
            const options = { pooling: { foo: 'bar' } };
            const error = new Error('foobar');

            td.when(connection.validate(), { ignoreExtraArgs: true }).thenReturn(true);
            // In this case, the object will also contain default values for
            // the valid pooling options.
            td.when(pool.validate(td.matchers.contains(options.pooling))).thenThrow(error);

            return expect(() => client.validate(options)).to.throw(error);
        });
    });
});
