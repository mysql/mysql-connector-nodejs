/*
 * Copyright (c) 2017, 2021, Oracle and/or its affiliates.
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
const warnings = require('../../../lib/constants/warnings');

// subject under test needs to be reloaded with replacement fakes
let session = require('../../../lib/DevAPI/Session');

describe('X DevAPI Session', () => {
    let connection, schema, sqlExecute, table, warning;

    beforeEach('create fakes', () => {
        connection = {
            close: td.function(),
            getAuth: td.function(),
            getSchemaName: td.function(),
            getServerHostname: td.function(),
            getServerPort: td.function(),
            getServerSocketPath: td.function(),
            getUser: td.function(),
            isFromPool: td.function(),
            isSecure: td.function()
        };

        warning = td.function();

        table = td.replace('../../../lib/DevAPI/Table');
        schema = td.replace('../../../lib/DevAPI/Schema');
        sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');

        const logger = td.replace('../../../lib/logger');
        td.when(logger('api:session')).thenReturn({ warning });

        session = require('../../../lib/DevAPI/Session');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('commit()', () => {
        let execute;

        beforeEach('create fakes', () => {
            execute = td.function();
        });

        it('commits an ongoing database transaction in the scope of the current session', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');

            td.when(sql('COMMIT')).thenReturn({ execute });
            td.when(execute()).thenResolve();

            return dbSession.commit()
                .then(res => {
                    expect(td.explain(execute).callCount).to.equal(1);
                    return expect(res).to.be.true;
                });
        });

        it('fails when the ongoing database transaction cannot be committed', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const error = new Error('bar');

            td.when(sql('COMMIT')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return dbSession.commit()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('close()', () => {
        it('closes the underlying connection to the database or release it back into a connection pool', () => {
            td.when(connection.close()).thenResolve('foo');

            return session(connection).close()
                .then(res => {
                    return expect(res).to.equal('foo');
                });
        });

        it('fails when there is an error in the underlying connection', () => {
            const error = new Error('foo');

            td.when(connection.close()).thenReject(error);

            return session(connection).close()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('createSchema()', () => {
        let execute;

        beforeEach('create fakes', () => {
            execute = td.function();
        });

        it('creates a schema in the database with a properly escaped name when one does not exist', () => {
            const name = 'foo';
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const getShema = td.replace(dbSession, 'getSchema');

            td.when(table.escapeIdentifier(name)).thenReturn('bar');
            td.when(sql('CREATE DATABASE bar')).thenReturn({ execute });
            td.when(execute()).thenResolve();
            td.when(getShema(name)).thenReturn('baz');

            return dbSession.createSchema(name)
                .then(res => {
                    return expect(res).to.equal('baz');
                });
        });

        it('fails when a schema with a given name already exists', () => {
            const name = 'foo';
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const error = new Error('bar');

            td.when(table.escapeIdentifier(name)).thenReturn('baz');
            td.when(sql('CREATE DATABASE baz')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return dbSession.createSchema(name)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('dropSchema()', () => {
        let execute;

        beforeEach('create fakes', () => {
            execute = td.function();
        });

        it('drops a schema with a properly escaped name from the database when one does exist', () => {
            const name = 'foo';
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');

            td.when(table.escapeIdentifier(name)).thenReturn('bar');
            td.when(sql('DROP DATABASE bar')).thenReturn({ execute });
            td.when(execute()).thenResolve();

            return dbSession.dropSchema(name)
                .then(res => {
                    return expect(res).to.be.true;
                });
        });

        it('does not fail when a schema with the given name does not exist', () => {
            const name = 'foo';
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const error = new Error();
            error.info = { code: errors.ER_DB_DROP_EXISTS };

            td.when(table.escapeIdentifier(name)).thenReturn('bar');
            td.when(sql('DROP DATABASE bar')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return dbSession.dropSchema(name)
                .then(res => {
                    return expect(res).to.be.false;
                });
        });

        it('fails when the operation reports an unexpected error', () => {
            const name = 'foo';
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const error = new Error('bar');

            td.when(table.escapeIdentifier(name)).thenReturn('baz');
            td.when(sql('DROP DATABASE baz')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return dbSession.dropSchema(name)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('executeSql()', () => {
        it('is a proxy for the Session.sql() method', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');

            td.when(sql('foo')).thenReturn('bar');

            return expect(dbSession.executeSql('foo')).to.equal('bar');
        });

        it('generates a deprecation warning', () => {
            const dbSession = session(connection);
            td.replace(dbSession, 'sql');

            dbSession.executeSql('foo');

            expect(td.explain(warning).callCount).to.equal(1);
            return expect(td.explain(warning).calls[0].args).to.deep.equal(['executeSql', warnings.MESSAGES.WARN_DEPRECATED_EXECUTE_SQL, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
        });
    });

    context('getDefaultSchema()', () => {
        it('returns the instance of a default schema associated to the underlying database connection', () => {
            const dbSession = session(connection);
            const getSchema = td.replace(dbSession, 'getSchema');
            const name = 'foo';

            td.when(connection.getSchemaName()).thenReturn(name);
            td.when(getSchema(name)).thenReturn('bar');

            return expect(dbSession.getDefaultSchema()).to.equal('bar');
        });

        it('returns undefined if the underlying database connection is not associated to any default schema', () => {
            td.when(connection.getSchemaName()).thenReturn();

            return expect(session(connection).getDefaultSchema()).to.not.exist;
        });
    });

    context('getSchema()', () => {
        it('returns an instance of a Schema with a given name', () => {
            const name = 'foo';

            td.when(schema(connection, name)).thenReturn('bar');

            return expect(session(connection).getSchema(name)).to.equal('bar');
        });
    });

    context('getSchemas()', () => {
        let execute, fetchAll;

        beforeEach('create fakes', () => {
            execute = td.function();
            fetchAll = td.function();
        });

        it('returns a list of instances of all the existing schemas in the database', () => {
            const dbSession = session(connection);
            const getSchema = td.replace(dbSession, 'getSchema');
            const sql = td.replace(dbSession, 'sql');

            td.when(sql('SHOW DATABASES')).thenReturn({ execute });
            td.when(execute()).thenResolve({ fetchAll });
            td.when(fetchAll()).thenReturn([['foo'], ['bar']]);
            td.when(getSchema('foo')).thenReturn('baz');
            td.when(getSchema('bar')).thenReturn('qux');

            return dbSession.getSchemas()
                .then(res => {
                    return expect(res).to.deep.equal(['baz', 'qux']);
                });
        });
    });

    context('inspect()', () => {
        it('returns the details of the underlying database connection', () => {
            td.when(connection.getAuth()).thenReturn('foo');
            td.when(connection.getSchemaName()).thenReturn('bar');
            td.when(connection.getServerHostname()).thenReturn('baz');
            td.when(connection.getServerPort()).thenReturn('qux');
            td.when(connection.getServerSocketPath()).thenReturn('quux');
            td.when(connection.getUser()).thenReturn('quuz');
            td.when(connection.isFromPool()).thenReturn('corge');
            td.when(connection.isSecure()).thenReturn('grault');

            return expect(session(connection).inspect()).to.deep.include({
                auth: 'foo',
                host: 'baz',
                pooling: 'corge',
                port: 'qux',
                schema: 'bar',
                socket: 'quux',
                tls: 'grault',
                user: 'quuz'
            });
        });

        it('generates a deprecation warning for deprecated properties', () => {
            td.when(connection.getUser()).thenReturn('foo');
            td.when(connection.isSecure()).thenReturn('bar');

            const details = session(connection).inspect();

            expect(details.dbUser).to.equal('foo');
            expect(details.ssl).to.equal('bar');

            expect(td.explain(warning).callCount).to.equal(2);
            expect(td.explain(warning).calls[0].args).to.deep.equal(['inspect', warnings.MESSAGES.WARN_DEPRECATED_DB_USER, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
            return expect(td.explain(warning).calls[1].args).to.deep.equal(['inspect', warnings.MESSAGES.WARN_DEPRECATED_SSL_OPTION, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
        });
    });

    context('releaseSavepoint()', () => {
        let execute;

        beforeEach('create fakes', () => {
            execute = td.function();
        });

        it('discards a given savepoint from an ongoing transaction in the database', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');

            td.when(table.escapeIdentifier('foo')).thenReturn('bar');
            td.when(sql('RELEASE SAVEPOINT bar')).thenReturn({ execute });
            td.when(execute()).thenResolve();

            return dbSession.releaseSavepoint('foo')
                .then(() => {
                    return expect(td.explain(sql).callCount).to.equal(1);
                });
        });

        it('fails if the savepoint name is not a string', () => {
            return session(connection).releaseSavepoint(false)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME);
                });
        });

        it('fails if the savepoint name is an empty string', () => {
            return session(connection).releaseSavepoint(' ')
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME);
                });
        });

        it('fails if an error is reported by the server', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const error = new Error('foobar');

            td.when(table.escapeIdentifier('foo')).thenReturn('bar');
            td.when(sql('RELEASE SAVEPOINT bar')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return dbSession.releaseSavepoint('foo')
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('rollback()', () => {
        let execute;

        beforeEach('create fakes', () => {
            execute = td.function();
        });

        it('rolls back an ongoing transaction in the scope of the current session', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');

            td.when(sql('ROLLBACK')).thenReturn({ execute });
            td.when(execute()).thenResolve();

            return dbSession.rollback()
                .then(res => {
                    return expect(res).to.be.true;
                });
        });

        it('fails if an error is reported by the server', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const error = new Error('foobar');

            td.when(sql('ROLLBACK')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return dbSession.rollback()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('rollbackTo()', () => {
        let execute;

        beforeEach('create fakes', () => {
            execute = td.function();
        });

        it('rolls back to an existing savepoint within the scope of an ongoing database transaction', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');

            td.when(table.escapeIdentifier('foo')).thenReturn('bar');
            td.when(sql('ROLLBACK TO SAVEPOINT bar')).thenReturn({ execute });
            td.when(execute()).thenResolve();

            return dbSession.rollbackTo('foo')
                .then(() => {
                    return expect(td.explain(execute).callCount).to.equal(1);
                });
        });

        it('fails if the savepoint name is not a string', () => {
            return session(connection).rollbackTo(false)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME);
                });
        });

        it('fails if the savepoint name is an empty string', () => {
            return session(connection).rollbackTo(' ')
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME);
                });
        });

        it('fails if an error is reported by the server', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const error = new Error('foobar');

            td.when(table.escapeIdentifier('foo')).thenReturn('bar');
            td.when(sql('ROLLBACK TO SAVEPOINT bar')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return dbSession.rollbackTo('foo')
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('setSavepoint()', () => {
        let execute;

        beforeEach('create fakes', () => {
            execute = td.function();
        });

        it('creates a savepoint with the given name within the scope of an ongoing database transaction', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');

            td.when(table.escapeIdentifier('foo')).thenReturn('bar');
            td.when(sql('SAVEPOINT bar')).thenReturn({ execute });
            td.when(execute()).thenResolve();

            return dbSession.setSavepoint('foo')
                .then(res => {
                    return expect(res).to.equal('foo');
                });
        });

        it('creates a savepoint with an auto-generated name within the scope of an ongoing database transaction', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const regexp = /^connector-nodejs-[0-9a-f]{32}$/;

            td.when(table.escapeIdentifier(td.matchers.contains(regexp))).thenReturn('foo');
            td.when(sql('SAVEPOINT foo')).thenReturn({ execute });
            td.when(execute()).thenResolve();

            return dbSession.setSavepoint()
                .then(res => {
                    expect(res).to.be.a('string');
                    return expect(res).to.match(regexp);
                });
        });

        it('fails if the savepoint name is not a string', () => {
            return session(connection).setSavepoint(false)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME);
                });
        });

        it('fails if the savepoint name is an empty string', () => {
            return session(connection).setSavepoint(' ')
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SAVEPOINT_NAME);
                });
        });

        it('fails if an error is reported by the server', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const error = new Error('foobar');

            td.when(table.escapeIdentifier('foo')).thenReturn('bar');
            td.when(sql('SAVEPOINT bar')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return dbSession.setSavepoint('foo')
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });

    context('sql()', () => {
        it('creates a new operational context to execute an SQL statement in the database', () => {
            const statement = 'foo';

            td.when(sqlExecute(connection, statement)).thenReturn('bar');

            return expect(session(connection).sql(statement)).to.equal('bar');
        });
    });

    context('startTransaction()', () => {
        let execute;

        beforeEach('create fakes', () => {
            execute = td.function();
        });

        it('rolls back an ongoing transaction in the scope of the current session', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');

            td.when(sql('BEGIN')).thenReturn({ execute });
            td.when(execute()).thenResolve();

            return dbSession.startTransaction()
                .then(res => {
                    return expect(res).to.be.true;
                });
        });

        it('fails if an error is reported by the server', () => {
            const dbSession = session(connection);
            const sql = td.replace(dbSession, 'sql');
            const error = new Error('foobar');

            td.when(sql('BEGIN')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return dbSession.startTransaction()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });
    });
});
