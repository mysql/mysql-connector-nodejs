/*
 * Copyright (c) 2016, 2022, Oracle and/or its affiliates.
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
const warnings = require('../../../lib/constants/warnings');

// subject under test needs to be reloaded with test doubles
let Table = require('../../../lib/DevAPI/Table');

describe('Table factory function', () => {
    let DatabaseObject;

    beforeEach('replace dependencies with test doubles', () => {
        DatabaseObject = td.replace('../../../lib/DevAPI/DatabaseObject');
        // reload module with the replacements
        Table = require('../../../lib/DevAPI/Table');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('count()', () => {
        let SqlExecute;

        beforeEach('replace dependencies with test doubles', () => {
            SqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
            // reload module with the replacements
            Table = require('../../../lib/DevAPI/Table');
        });

        it('creates and executes an SqlExecute statement that counts the number of documents in a table', () => {
            const total = 3;
            const connection = 'foo';
            const escapeIdentifier = td.replace(Table, 'escapeIdentifier');
            const escapedSchemaName = 'bar';
            const escapedTableName = 'baz';
            const execute = td.function();
            const schemaName = 'qux';
            const schema = { getName: () => schemaName };
            const tableName = 'quux';

            td.when(escapeIdentifier(schemaName)).thenReturn(escapedSchemaName);
            td.when(escapeIdentifier(tableName)).thenReturn(escapedTableName);
            td.when(SqlExecute(connection, `SELECT COUNT(*) FROM ${escapedSchemaName}.${escapedTableName}`)).thenReturn({ execute });
            td.when(execute(td.callback([total]))).thenResolve();

            return Table({ connection, schema, tableName }).count()
                .then(actual => expect(actual).to.equal(total));
        });
    });

    context('delete()', () => {
        let Logger, TableDelete, warning;

        beforeEach('replace dependencies with test doubles', () => {
            Logger = td.replace('../../../lib/logger');
            TableDelete = td.replace('../../../lib/DevAPI/TableDelete');
            warning = td.function();

            td.when(Logger('api:table')).thenReturn({ warning });

            // reload module with the replacements
            Table = require('../../../lib/DevAPI/Table');
        });

        it('creates a TableDelete statement when no criteria is given', () => {
            const connection = 'foo';
            const schema = 'bar';
            const tableName = 'baz';
            const expected = 'qux';
            const where = td.function();

            td.when(TableDelete({ connection, schema, tableName })).thenReturn({ where });
            td.when(where(undefined)).thenReturn(expected);

            expect(Table({ connection, schema, tableName }).delete()).to.equal(expected);
        });

        it('creates a TableDelete statement to delete all rows that match a given criteria and logs a warning', () => {
            const connection = 'foo';
            const schema = 'bar';
            const tableName = 'baz';
            const expected = 'qux';
            const searchConditionStr = 'quux';
            const where = td.function();
            const warningMessage = warnings.MESSAGES.WARN_DEPRECATED_TABLE_DELETE_EXPR_ARGUMENT;
            const warningOptions = { code: warnings.CODES.DEPRECATION, type: warnings.TYPES.DEPRECATION };

            td.when(TableDelete({ connection, schema, tableName })).thenReturn({ where });
            td.when(where(searchConditionStr)).thenReturn(expected);

            expect(Table({ connection, schema, tableName }).delete(searchConditionStr)).to.equal(expected);
            expect(td.explain(warning).callCount).to.equal(1);
            expect(td.explain(warning).calls[0].args).to.deep.equal(['delete', warningMessage, warningOptions]);
        });
    });

    context('existsInDatabase()', () => {
        let SqlExecute;

        beforeEach('replace dependencies with test doubles', () => {
            SqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
            // reload module with the replacements
            Table = require('../../../lib/DevAPI/Table');
        });

        it('creates and executes a SqlExecute statement that returns true if the table exists in the database', () => {
            const connection = 'foo';
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const tableName = 'baz';

            td.when(SqlExecute(connection, 'list_objects', [{ schema: schemaName, pattern: tableName }], 'mysqlx')).thenReturn({ execute });
            td.when(execute()).thenResolve({ fetchAll: () => [[tableName, 'TABLE']] });

            return Table({ connection, schema, tableName }).existsInDatabase()
                .then(actual => expect(actual).to.be.true);
        });

        it('creates and executes a SqlExecute statement that returns false if the table does not exist in the database', () => {
            const connection = 'foo';
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const tableName = 'baz';

            td.when(SqlExecute(connection, 'list_objects', [{ schema: schemaName, pattern: tableName }], 'mysqlx')).thenReturn({ execute });
            td.when(execute()).thenResolve({ fetchAll: () => [] });

            return Table({ connection, schema, tableName }).existsInDatabase()
                .then(actual => expect(actual).to.be.false);
        });
    });

    context('getName()', () => {
        it('returns the table name', () => {
            expect(Table({ tableName: 'foo' }).getName()).to.equal('foo');
        });
    });

    context('getSession()', () => {
        it('returns the associated session instance', () => {
            const connection = 'foo';
            const session = 'bar';
            const getSession = () => session;

            td.when(DatabaseObject(connection)).thenReturn({ getSession });

            expect(Table({ connection }).getSession()).to.deep.equal(session);
        });
    });

    context('getSchema()', () => {
        it('returns the instance of the collection schema', () => {
            const schemaName = 'foo';
            const schema = { getName: () => schemaName };
            const instance = Table({ schema });

            expect(instance.getSchema()).to.equal(schema);
            expect(instance.getSchema().getName()).to.equal(schemaName);
        });
    });

    context('inspect()', () => {
        it('returns a stringified object containing the collection details', () => {
            const schemaName = 'foo';
            const schema = { getName: () => schemaName };
            const tableName = 'bar';
            const expected = { schema: schemaName, table: tableName };

            expect(Table({ schema, tableName }).inspect()).to.deep.equal(expected);
        });
    });

    context('insert()', () => {
        let TableInsert, Logger, warning;

        beforeEach('replace dependencies with test doubles', () => {
            Logger = td.replace('../../../lib/logger');
            TableInsert = td.replace('../../../lib/DevAPI/TableInsert');
            warning = td.function();

            td.when(Logger('api:table')).thenReturn({ warning });

            // reload module with the replacements
            Table = require('../../../lib/DevAPI/Table');
        });

        it('creates a TableInsert statement to insert values in the columns provided as an array', () => {
            const connection = 'foo';
            const tableFields = ['bar', 'baz'];
            const expected = 'qux';
            const schema = 'quux';
            const tableName = 'quuz';

            td.when(TableInsert({ connection, schema, tableName, columns: tableFields })).thenReturn(expected);

            expect(Table({ connection, schema, tableName }).insert(tableFields)).to.equal(expected);
        });

        it('creates a TableInsert statement to insert values in the columns provided as multiple arguments', () => {
            const connection = 'foo';
            const tableFields = ['bar', 'baz'];
            const expected = 'qux';
            const schema = 'quux';
            const tableName = 'quuz';

            td.when(TableInsert({ connection, schema, tableName, columns: tableFields })).thenReturn(expected);

            expect(Table({ connection, schema, tableName }).insert(tableFields[0], tableFields[1])).to.equal(expected);
        });

        it('creates a TableInsert statement to insert values in the columns provided by an key-value map and logs a warning', () => {
            const connection = 'foo';
            const columnValues = ['bar', 'baz'];
            const expected = 'qux';
            const schema = 'quux';
            const tableFields = ['quuz', 'corge'];
            const keyValuePairs = { [tableFields[0]]: columnValues[0], [tableFields[1]]: columnValues[1] };
            const tableName = 'grault';
            const values = td.function();
            const warningMessage = warnings.MESSAGES.WARN_DEPRECATED_TABLE_INSERT_OBJECT_ARGUMENT;
            const warningOptions = { code: warnings.CODES.DEPRECATION, type: warnings.TYPES.DEPRECATION };

            td.when(TableInsert({ connection, schema, tableName, columns: tableFields })).thenReturn({ values });
            td.when(values(columnValues)).thenReturn(expected);

            expect(Table({ connection, schema, tableName }).insert(keyValuePairs)).to.equal(expected);
            expect(td.explain(warning).callCount).to.equal(1);
            expect(td.explain(warning).calls[0].args).to.deep.equal(['insert', warningMessage, warningOptions]);
        });

        it('throws an error when a table field is not a valid expression or key-value map', () => {
            // insert('foo', undefined) should work because it the same as insert('foo')
            [1, true, false, [['foo']], {}, null].forEach(invalid => {
                expect(() => Table().insert(invalid)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_TABLE_INSERT_ARGUMENT);
                expect(() => Table().insert('foo', invalid)).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_TABLE_INSERT_ARGUMENT);
            });

            // insert('foo', undefined) or insert('foo', []) are the same as insert('foo')
            expect(() => Table().insert()).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_TABLE_INSERT_ARGUMENT);
            expect(() => Table().insert([])).to.throw(errors.MESSAGES.ER_DEVAPI_BAD_TABLE_INSERT_ARGUMENT);
        });
    });

    context('isView()', () => {
        let SqlExecute;

        beforeEach('replace dependencies with test doubles', () => {
            SqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
            // reload module with the replacements
            Table = require('../../../lib/DevAPI/Table');
        });

        it('creates and executes a SqlExecute statement returning true if the corresponding database table is a view', () => {
            const connection = 'foo';
            const count = 1;
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const sqlStatement = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';
            const tableName = 'baz';

            td.when(SqlExecute(connection, sqlStatement, ['def', schemaName, tableName])).thenReturn({ execute });
            td.when(execute(td.callback([count]))).thenResolve();

            return Table({ connection, schema, tableName }).isView()
                .then(got => expect(got).to.be.true);
        });

        it('creates and executes a SqlExecute statement returning true if the corresponding database table is not a view', () => {
            const connection = 'foo';
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const sqlStatement = 'SELECT COUNT(*) cnt FROM information_schema.VIEWS WHERE TABLE_CATALOG = ? AND TABLE_SCHEMA = ? AND TABLE_NAME = ? HAVING COUNT(*) = 1';
            const tableName = 'baz';

            td.when(SqlExecute(connection, sqlStatement, ['def', schemaName, tableName])).thenReturn({ execute });
            td.when(execute(td.callback([]))).thenResolve();

            return Table({ connection, schema, tableName }).isView()
                .then(got => expect(got).to.be.false);
        });
    });

    context('select()', () => {
        let ProjectedSearchExprStr, TableSelect;

        beforeEach('replace dependencies with test doubles', () => {
            ProjectedSearchExprStr = td.replace('../../../lib/DevAPI/ProjectedSearchExprStr');
            TableSelect = td.replace('../../../lib/DevAPI/TableSelect');
            // reload module with the replacements
            Table = require('../../../lib/DevAPI/Table');
        });

        it('creates a TableSelect statement with a projection list containing the field expressions provided as an array', () => {
            const connection = 'foo';
            const expected = 'bar';
            const getValue = td.function();
            const schema = 'bar';
            const tableName = 'baz';
            const projectedSearchExprStrList = ['qux', 'quux'];
            const projectionList = ['quuz', 'corge'];

            td.when(ProjectedSearchExprStr(projectedSearchExprStrList[0])).thenReturn({ getValue });
            td.when(ProjectedSearchExprStr(projectedSearchExprStrList[1])).thenReturn({ getValue });
            td.when(getValue()).thenReturn(projectionList[1]);
            td.when(getValue(), { times: 1 }).thenReturn(projectionList[0]);
            td.when(TableSelect({ connection, projectionList, schema, tableName })).thenReturn(expected);

            expect(Table({ connection, schema, tableName }).select(projectedSearchExprStrList)).to.equal(expected);
        });

        it('creates a TableSelect statement with a projection list containing the field expressions provided as different arguments', () => {
            const connection = 'foo';
            const expected = 'bar';
            const getValue = td.function();
            const schema = 'bar';
            const tableName = 'baz';
            const projectedSearchExprStrList = ['qux', 'quux'];
            const projectionList = ['quuz', 'corge'];

            td.when(ProjectedSearchExprStr(projectedSearchExprStrList[0])).thenReturn({ getValue });
            td.when(ProjectedSearchExprStr(projectedSearchExprStrList[1])).thenReturn({ getValue });
            td.when(getValue()).thenReturn(projectionList[1]);
            td.when(getValue(), { times: 1 }).thenReturn(projectionList[0]);
            td.when(TableSelect({ connection, projectionList, schema, tableName })).thenReturn(expected);

            expect(Table({ connection, schema, tableName }).select(projectedSearchExprStrList[0], projectedSearchExprStrList[1])).to.equal(expected);
        });
    });

    context('update()', () => {
        let Logger, TableUpdate, warning;

        beforeEach('replace dependencies with test doubles', () => {
            Logger = td.replace('../../../lib/logger');
            TableUpdate = td.replace('../../../lib/DevAPI/TableUpdate');
            warning = td.function();

            td.when(Logger('api:table')).thenReturn({ warning });

            // reload module with the replacements
            Table = require('../../../lib/DevAPI/Table');
        });

        it('creates a TableUpdate statement when no criteria is given', () => {
            const connection = 'foo';
            const schema = 'bar';
            const tableName = 'baz';
            const expected = 'qux';
            const where = td.function();

            td.when(TableUpdate({ connection, schema, tableName })).thenReturn({ where });
            td.when(where(undefined)).thenReturn(expected);

            expect(Table({ connection, schema, tableName }).update()).to.equal(expected);
        });

        it('creates a TableUpdate statement to delete all rows that match a given criteria and logs a warning', () => {
            const connection = 'foo';
            const schema = 'bar';
            const tableName = 'baz';
            const expected = 'qux';
            const searchConditionStr = 'quux';
            const where = td.function();
            const warningMessage = warnings.MESSAGES.WARN_DEPRECATED_TABLE_UPDATE_EXPR_ARGUMENT;
            const warningOptions = { code: warnings.CODES.DEPRECATION, type: warnings.TYPES.DEPRECATION };

            td.when(TableUpdate({ connection, schema, tableName })).thenReturn({ where });
            td.when(where(searchConditionStr)).thenReturn(expected);

            expect(Table({ connection, schema, tableName }).update(searchConditionStr)).to.equal(expected);
            expect(td.explain(warning).callCount).to.equal(1);
            expect(td.explain(warning).calls[0].args).to.deep.equal(['update', warningMessage, warningOptions]);
        });
    });

    context('Table.escapeIdentifier()', () => {
        let escapeQuotes;

        beforeEach('replace dependencies with test doubles', () => {
            escapeQuotes = td.replace('../../../lib/DevAPI/Util/escapeQuotes');
            // reload module with the replacements
            Table = require('../../../lib/DevAPI/Table');
        });

        it('escapes an identifier and wraps it within backticks', () => {
            const value = 'foo';
            const escapedValue = 'bar';
            const expected = `\`${escapedValue}\``;

            td.when(escapeQuotes(value)).thenReturn(escapedValue);

            expect(Table.escapeIdentifier(value)).to.equal(expected);
        });
    });
});
