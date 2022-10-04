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

const dataModel = require('../../../lib/Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;
const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const td = require('testdouble');
const util = require('util');
const updateType = require('../../../lib/Protocol/Stubs/mysqlx_crud_pb').UpdateOperation.UpdateType.SET;

// subject under test needs to be reloaded with test doubles
let TableUpdate = require('../../../lib/DevAPI/TableUpdate');

describe('TableUpdate', () => {
    let Preparing;

    beforeEach('replace dependencies with test doubles', () => {
        Preparing = td.replace('../../../lib/DevAPI/Preparing');
        // reload module with the replacements
        TableUpdate = require('../../../lib/DevAPI/TableUpdate');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('bind()', () => {
        let binding;

        beforeEach('replace dependencies with test doubles', () => {
            binding = td.replace('../../../lib/DevAPI/Binding');
            // reload module with the replacements
            TableUpdate = require('../../../lib/DevAPI/TableUpdate');
        });

        it('calls the bind() method provided by the Binding mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const bind = td.function();
            const placeholder = 'baz';
            const value = 'qux';

            td.when(binding()).thenReturn({ bind });
            td.when(bind(placeholder, value)).thenReturn(expected);

            expect(TableUpdate({ connection }).bind(placeholder, value)).to.equal(expected);
        });
    });

    context('execute()', () => {
        let Result;

        beforeEach('replace dependencies with test doubles', () => {
            Result = td.replace('../../../lib/DevAPI/Result');
            // reload module with the replacements
            TableUpdate = require('../../../lib/DevAPI/TableUpdate');
        });

        it('executes a TableUpdate statement and returns a Result instance with the details provided by the server', () => {
            const context = 'foo';
            const crudModify = td.function();
            const connection = { getClient: () => ({ crudModify }), isIdle: () => false, isOpen: () => true };
            const criteria = 'bar';
            const details = 'baz';
            const execute = td.function();
            const expected = 'qux';
            const forceRestart = td.function();

            td.when(Preparing({ connection })).thenReturn({ execute, forceRestart });

            const statement = TableUpdate({ connection }).where(criteria);

            td.when(crudModify(statement)).thenReturn(context);
            td.when(execute(td.matchers.argThat(fn => fn() === context))).thenResolve(details);
            td.when(Result(details)).thenReturn(expected);

            return statement.execute()
                .then(got => expect(got).to.equal(expected));
        });

        it('fails to execute the statement when the filtering criteria is not defined', () => {
            return TableUpdate().execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_MISSING_TABLE_CRITERIA));
                });
        });

        it('fails to execute the TableUpdate statement when the connection is not open', () => {
            const criteria = 'foo';
            const error = new Error('bar');
            const connection = { getError: () => error, isOpen: () => false };
            const forceRestart = td.function();

            td.when(Preparing({ connection })).thenReturn({ forceRestart });

            return TableUpdate({ connection }).where(criteria)
                .execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('fails to execute the TableUpdate statement when the connection has expired', () => {
            const criteria = 'foo';
            const error = new Error('bar');
            const connection = { getError: () => error, isIdle: () => true, isOpen: () => true };
            const forceRestart = td.function();

            td.when(Preparing({ connection })).thenReturn({ forceRestart });

            return TableUpdate({ connection }).where(criteria)
                .execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });
    });

    context('limit()', () => {
        let limiting;

        beforeEach('replace dependencies with test doubles', () => {
            limiting = td.replace('../../../lib/DevAPI/Limiting');
            // reload module with the replacements
            TableUpdate = require('../../../lib/DevAPI/TableUpdate');
        });

        it('calls the limit() method provided by the Limiting mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const limit = td.function();
            const preparable = 'baz';
            const size = 3;

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(limiting({ preparable })).thenReturn({ limit });
            td.when(limit(size)).thenReturn(expected);

            expect(TableUpdate({ connection }).limit(size)).to.equal(expected);
        });
    });

    context('set()', () => {
        let TableField, ExprOrLiteral;

        beforeEach('replace dependencies with test doubles', () => {
            TableField = td.replace('../../../lib/DevAPI/TableField');
            ExprOrLiteral = td.replace('../../../lib/DevAPI/ExprOrLiteral');
            // reload module with the replacements
            TableUpdate = require('../../../lib/DevAPI/TableUpdate');
        });

        it('adds the appropriate ITEM_SET operation to the list of update operations that need to be executed', () => {
            const connection = 'foo';
            const tableField = 'bar';
            const exprOrLiteral = 'baz';
            const forceRestart = td.function();
            const getValue = td.function();
            const isLiteral = () => true;
            const operationList = ['qux'];
            const source = 'quux';
            const value = 'quuz';
            const expected = operationList.concat([{ source: source, type: updateType, value, isLiteral: true }]);

            td.when(Preparing({ connection })).thenReturn({ forceRestart });
            td.when(ExprOrLiteral({ dataModel, value: exprOrLiteral })).thenReturn({ getValue, isLiteral });
            td.when(TableField(tableField)).thenReturn({ getValue });
            td.when(getValue()).thenReturn(value);
            td.when(getValue(), { times: 1 }).thenReturn(source);

            // Adds some operations beforehand to ensure those are not removed.
            TableUpdate({ connection, operationList }).set(tableField, exprOrLiteral);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(operationList).to.deep.equal(expected);
        });
    });

    context('orderBy()', () => {
        let Ordering;

        beforeEach('replace dependencies with test doubles', () => {
            Ordering = td.replace('../../../lib/DevAPI/TableOrdering');
            // reload module with the replacements
            TableUpdate = require('../../../lib/DevAPI/TableUpdate');
        });

        it('calls the orderBy() method provided by the TableOrdering mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const preparable = 'baz';
            const orderBy = td.function();
            const sortExpr = 'qux';

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Ordering({ preparable })).thenReturn({ orderBy });
            td.when(orderBy(sortExpr)).thenReturn(expected);

            expect(TableUpdate({ connection }).orderBy(sortExpr)).to.equal(expected);
        });
    });

    context('where()', () => {
        let Filtering;

        beforeEach('replace dependencies with test doubles', () => {
            Filtering = td.replace('../../../lib/DevAPI/TableFiltering');
            // reload module with the replacements
            TableUpdate = require('../../../lib/DevAPI/TableUpdate');
        });

        it('calls the where() method provided by the Filtering mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const where = td.function();
            const preparable = 'baz';
            const searchExprStrList = 'qux';

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Filtering({ preparable })).thenReturn({ where });
            td.when(where(searchExprStrList)).thenReturn(expected);

            expect(TableUpdate({ connection }).where(searchExprStrList)).to.equal(expected);
        });
    });
});
