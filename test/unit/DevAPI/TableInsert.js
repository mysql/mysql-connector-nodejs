/*
 * Copyright (c) 2016, 2023, Oracle and/or its affiliates.
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

const Expr = require('../../../lib/DevAPI/Expr');
const dataModel = require('../../../lib/Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with test doubles
let TableInsert = require('../../../lib/DevAPI/TableInsert');

describe('TableInsert', () => {
    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('execute()', () => {
        let Result;

        beforeEach('replace dependencies with test doubles', () => {
            Result = td.replace('../../../lib/DevAPI/Result');
            // reload module with the replacements
            TableInsert = require('../../../lib/DevAPI/TableInsert');
        });

        it('executes a TableInsert statement and returns a Result instance with the details provided by the server', () => {
            const columns = 'foo';
            const crudInsert = td.function();
            const integerType = 'bar';
            const connection = { getClient: () => ({ crudInsert }), getIntegerType: () => integerType, isIdle: () => false, isOpen: () => true };
            const details = 'baz';
            const rows = 'qux';
            const schemaName = 'quux';
            const schema = { getName: () => schemaName };
            const tableName = 'quuux';
            const want = 'quuuux';

            td.when(crudInsert({ dataModel, columns, rows, schemaName, tableName })).thenResolve(details);
            td.when(Result({ ...details, integerType })).thenReturn(want);

            return TableInsert({ columns, connection, rows, schema, tableName }).execute()
                .then(got => expect(got).to.equal(want));
        });

        it('fails to execute the TableInsert statement when the connection is not open', () => {
            const error = new Error('bar');
            const connection = { getError: () => error, isOpen: () => false };

            return TableInsert({ connection })
                .execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('fails to execute the TableInsert statement when the connection has expired', () => {
            const error = new Error('bar');
            const connection = { getError: () => error, isIdle: () => true, isOpen: () => true };

            return TableInsert({ connection })
                .execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });
    });

    context('values()', () => {
        it('appends literal column values provided in an array to the list of rows to be inserted', () => {
            const rows = [];
            const literals = ['foo', 'bar'];
            const expected = [literals.map(value => ({ value, isLiteral: true }))];

            TableInsert({ rows }).values(literals);

            return expect(rows).to.deep.equal(expected);
        });

        it('appends literal column values provided in as multiple arguments to the list of rows to be inserted', () => {
            const rows = [];
            const literals = ['foo', 'bar'];
            const expected = [literals.map(value => ({ value, isLiteral: true }))];

            TableInsert({ rows }).values(literals[0], literals[1]);

            return expect(rows).to.deep.equal(expected);
        });

        it('appends literal column values provided in different calls as different rows to be inserted', () => {
            const rows = [];
            const literals = ['foo', 'bar', 'baz'];
            const expected = [[{ value: 'foo', isLiteral: true }, { value: 'bar', isLiteral: true }], [{ value: 'baz', isLiteral: true }]];

            TableInsert({ rows }).values(literals[0], literals[1]).values(literals[2]);

            return expect(rows).to.deep.equal(expected);
        });

        it('appends X DevAPI expressions provided in an array to the list of rows to be inserted', () => {
            const rows = [];
            const expressions = [Expr({ dataModel, value: 'foo' }), Expr({ dataModel, value: 'bar' })];
            const expected = [expressions.map(expr => ({ value: expr.getValue(), isLiteral: false }))];

            TableInsert({ rows }).values(expressions);

            return expect(rows).to.deep.equal(expected);
        });

        it('appends X DevAPI expressions provided in as multiple arguments to the list of rows to be inserted', () => {
            const rows = [];
            const expressions = [Expr({ dataModel, value: 'foo' }), Expr({ dataModel, value: 'bar' })];
            const expected = [expressions.map(expr => ({ value: expr.getValue(), isLiteral: false }))];

            TableInsert({ rows }).values(expressions[0], expressions[1]);

            return expect(rows).to.deep.equal(expected);
        });

        it('appends X DevAPI expressions provided in different calls as different rows to be inserted', () => {
            const rows = [];
            const expressions = [
                Expr({ dataModel, value: 'foo' }),
                Expr({ dataModel, value: 'bar' }),
                Expr({ dataModel, value: 'baz' })
            ];

            const expected = [[
                { value: expressions[0].getValue(), isLiteral: false },
                { value: expressions[1].getValue(), isLiteral: false }
            ], [
                { value: expressions[2].getValue(), isLiteral: false }
            ]];

            TableInsert({ rows }).values(expressions[0], expressions[1]).values(expressions[2]);

            return expect(rows).to.deep.equal(expected);
        });
    });
});
