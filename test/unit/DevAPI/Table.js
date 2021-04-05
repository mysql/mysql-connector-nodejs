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

const expect = require('chai').expect;
const td = require('testdouble');
const warnings = require('../../../lib/constants/warnings');

describe('Table', () => {
    let databaseObject, execute, sqlExecute, table, warning;

    beforeEach('create fakes', () => {
        execute = td.function();
        warning = td.function();

        databaseObject = td.replace('../../../lib/DevAPI/DatabaseObject');
        sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');

        const logger = td.replace('../../../lib/logger');
        td.when(logger('api:table')).thenReturn({ warning });

        table = require('../../../lib/DevAPI/Table');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('mixins', () => {
        it('mixes the DatabaseObject blueprint', () => {
            const connection = 'foo';

            table(connection);

            expect(td.explain(databaseObject).callCount).to.equal(1);
            return expect(td.explain(databaseObject).calls[0].args).to.deep.equal([connection]);
        });
    });

    context('getName()', () => {
        it('returns the table name', () => {
            const instance = table(null, null, 'foobar');

            expect(instance.getName()).to.equal('foobar');
        });
    });

    context('getSchema()', () => {
        it('returns the instance of the table schema', () => {
            const connection = 'foo';
            const getName = td.function();
            const schema = { getName };
            const coll = table(connection, schema, 'bar');

            td.when(getName()).thenReturn('baz');

            return expect(coll.getSchema().getName()).to.equal('baz');
        });
    });

    context('existsInDatabase()', () => {
        let fetchAll, getName;

        beforeEach('create fakes', () => {
            fetchAll = td.function();
            getName = td.function();
        });

        it('returns true if the table exists in database', () => {
            const schema = { getName };
            const instance = table('foo', schema, 'baz');

            td.when(getName()).thenReturn('bar');
            td.when(fetchAll()).thenReturn([['baz', 'TABLE']]);
            td.when(execute()).thenResolve({ fetchAll });
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar', pattern: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.existsInDatabase()
                .then(actual => expect(actual).to.be.true);
        });

        it('returns false if a collection with the same name exists in the database', () => {
            const schema = { getName };
            const instance = table('foo', schema, 'baz');

            td.when(getName()).thenReturn('bar');
            td.when(fetchAll()).thenReturn([['baz', 'COLLECTION']]);
            td.when(execute()).thenResolve({ fetchAll });
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar', pattern: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.existsInDatabase()
                .then(actual => expect(actual).to.be.false);
        });

        it('returns false if the table does not exist in database', () => {
            const schema = { getName };
            const instance = table('foo', schema, 'baz');

            td.when(getName()).thenReturn('bar');
            td.when(fetchAll()).thenReturn([]);
            td.when(execute()).thenResolve({ fetchAll });
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar', pattern: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.existsInDatabase()
                .then(actual => expect(actual).to.be.false);
        });
    });

    context('isView()', () => {
        it('returns true if the table exists in database', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback(['bar']))).thenResolve();
            td.when(sqlExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

            return instance.isView()
                .then(actual => expect(actual).to.be.true);
        });

        it('returns false if the table does not exist in database', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const query = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback([]))).thenResolve();
            td.when(sqlExecute('foo', query, ['def', 'bar', 'baz'])).thenReturn({ execute });

            return instance.isView()
                .then(actual => expect(actual).to.be.false);
        });
    });

    context('select()', () => {
        it('returns an instance of TableSelect', () => {
            const query = table().select();

            // as defined by https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html
            expect(query.where).to.be.a('function');
            expect(query.groupBy).to.be.a('function');
            expect(query.having).to.be.a('function');
            expect(query.orderBy).to.be.a('function');
            expect(query.limit).to.be.a('function');
            expect(query.offset).to.be.a('function');
            expect(query.lockExclusive).to.be.a('function');
            expect(query.lockShared).to.be.a('function');
            expect(query.bind).to.be.a('function');
            expect(query.execute).to.be.a('function');

            /* eslint-disable no-unused-expressions */

            // is not a TableInsert
            expect(query.insert).to.not.exist;
            expect(query.values).to.not.exist;

            // is not a TableUpdate
            expect(query.set).to.not.exist;

            /* eslint-disable no-unused-expressions */
        });

        it('sets the projection parameters provided as an array', () => {
            const connection = 'foo';
            const expressions = ['bar', 'baz'];
            const instance = table(connection).select(expressions);

            expect(instance.getProjections()).to.deep.equal(expressions);
        });

        it('sets the projection parameters provided as multiple arguments', () => {
            const connection = 'foo';
            const expressions = ['bar', 'baz'];
            const instance = table(connection).select(expressions[0], expressions[1]);

            expect(instance.getProjections()).to.deep.equal(expressions);
        });
    });

    context('insert()', () => {
        it('returns an instance of TableInsert', () => {
            const query = table().insert([]);

            // as defined by https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html
            expect(query.values).to.be.a('function');
            expect(query.execute).to.be.a('function');

            /* eslint-disable no-unused-expressions */

            // is not a TableSelect or a TableDelete
            expect(query.where).to.not.exist;
            expect(query.orderBy).to.not.exist;
            expect(query.limit).to.not.exist;
            expect(query.bind).to.not.exist;
            expect(query.groupBy).to.not.exist;
            expect(query.having).to.not.exist;
            expect(query.offset).to.not.exist;
            expect(query.lockExclusive).to.not.exist;
            expect(query.lockShared).to.not.exist;

            // is not a TableUpdate
            expect(query.set).to.not.exist;

            /* eslint-disable no-unused-expressions */
        });

        it('sets column names provided as an array', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().insert(expressions);

            expect(instance.getColumns()).to.deep.equal(expressions);
        });

        it('sets column names provided as multiple arguments', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().insert(expressions[0], expressions[1]);

            expect(instance.getColumns()).to.deep.equal(expressions);
        });

        it('generates a deprecation message while setting column names provided as object keys', () => {
            const expressions = ['foo', 'bar'];
            const instance = table().insert({ foo: 'baz', bar: 'qux' });

            expect(instance.getColumns()).to.deep.equal(expressions);
            expect(td.explain(warning).callCount).to.equal(1);
            return expect(td.explain(warning).calls[0].args).to.deep.equal(['insert', warnings.MESSAGES.WARN_DEPRECATED_TABLE_INSERT_OBJECT_ARGUMENT, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
        });

        it('throws an error if the columns are invalid', () => {
            const instance = table();

            expect(() => instance.insert()).to.throw(Error);
        });
    });

    context('count()', () => {
        it('returns the number of records found', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const count = 3;

            td.when(getName()).thenReturn('bar');
            td.when(execute(td.callback([count]))).thenResolve();
            td.when(sqlExecute('foo', 'SELECT COUNT(*) FROM `bar`.`baz`')).thenReturn({ execute });

            return instance.count()
                .then(actual => expect(actual).to.equal(count));
        });

        it('fails if an expected error is thrown', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table('foo', schema, 'baz');
            const error = new Error('foobar');

            td.when(getName()).thenReturn('bar');
            td.when(execute(), { ignoreExtraArgs: true }).thenReject(error);
            td.when(sqlExecute('foo', 'SELECT COUNT(*) FROM `bar`.`baz`')).thenReturn({ execute });

            return instance.count()
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    context('inspect()', () => {
        it('hides internals', () => {
            const getName = td.function();
            const schema = { getName };
            const instance = table(null, schema, 'bar');
            const expected = { schema: 'foo', table: 'bar' };

            td.when(getName()).thenReturn('foo');

            expect(instance.inspect()).to.deep.equal(expected);
        });
    });

    context('delete()', () => {
        it('returns an instance of TableDelete', () => {
            const query = table().delete();

            // as defined by https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html
            expect(query.where).to.be.a('function');
            expect(query.orderBy).to.be.a('function');
            expect(query.limit).to.be.a('function');
            expect(query.bind).to.be.a('function');
            expect(query.execute).to.be.a('function');

            /* eslint-disable no-unused-expressions */

            // is not a TableSelect or a TableDelete
            expect(query.groupBy).to.not.exist;
            expect(query.having).to.not.exist;
            expect(query.offset).to.not.exist;
            expect(query.lockExclusive).to.not.exist;
            expect(query.lockShared).to.not.exist;

            // is not a TableInsert
            expect(query.insert).to.not.exist;
            expect(query.values).to.not.exist;

            // is not a TableUpdate
            expect(query.set).to.not.exist;

            /* eslint-disable no-unused-expressions */
        });

        it('generates a deprecation message if an argument is provided', () => {
            table().delete('foo');

            expect(td.explain(warning).callCount).to.equal(1);
            return expect(td.explain(warning).calls[0].args).to.deep.equal(['delete', warnings.MESSAGES.WARN_DEPRECATED_TABLE_DELETE_EXPR_ARGUMENT, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
        });
    });

    context('update()', () => {
        it('returns an instance of TableUpdate', () => {
            const query = table().update();

            // as defined by https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-table-crud-functions.html
            expect(query.set).to.be.a('function');
            expect(query.where).to.be.a('function');
            expect(query.orderBy).to.be.a('function');
            expect(query.limit).to.be.a('function');
            expect(query.bind).to.be.a('function');
            expect(query.execute).to.be.a('function');

            /* eslint-disable no-unused-expressions */

            // is not a TableSelect
            expect(query.groupBy).to.not.exist;
            expect(query.having).to.not.exist;
            expect(query.offset).to.not.exist;
            expect(query.lockExclusive).to.not.exist;
            expect(query.lockShared).to.not.exist;

            // is not a TableInsert
            expect(query.insert).to.not.exist;
            expect(query.values).to.not.exist;

            /* eslint-disable no-unused-expressions */
        });

        it('generates a deprecation message if an argument is provided', () => {
            table().update('foo');

            expect(td.explain(warning).callCount).to.equal(1);
            return expect(td.explain(warning).calls[0].args).to.deep.equal(['update', warnings.MESSAGES.WARN_DEPRECATED_TABLE_UPDATE_EXPR_ARGUMENT, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
        });
    });

    context('escapeIdentifier()', () => {
        it('escapes and wrap the identifier with a set of backticks', () => {
            expect(table.escapeIdentifier('foo')).to.equal('`foo`');
            expect(table.escapeIdentifier('fo`o')).to.equal('`fo``o`');
            expect(table.escapeIdentifier('fo``o-ba``r')).to.equal('`fo````o-ba````r`');
        });
    });
});
