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

const dataModel = require('../../../lib/Protocol/Stubs/mysqlx_crud_pb').DataModel.TABLE;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with test doubles
let TableSelect = require('../../../lib/DevAPI/TableSelect');

describe('TableSelect', () => {
    let Preparing;

    beforeEach('replace dependencies with test doubles', () => {
        Preparing = td.replace('../../../lib/DevAPI/Preparing');
        // reload module with the replacements
        TableSelect = require('../../../lib/DevAPI/TableSelect');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('bind()', () => {
        let binding;

        beforeEach('replace dependencies with test doubles', () => {
            binding = td.replace('../../../lib/DevAPI/Binding');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
        });

        it('calls the bind() method provided by the Binding mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const bind = td.function();
            const placeholder = 'baz';
            const value = 'qux';

            td.when(binding()).thenReturn({ bind });
            td.when(bind(placeholder, value)).thenReturn(expected);

            expect(TableSelect({ connection }).bind(placeholder, value)).to.equal(expected);
        });
    });

    context('execute()', () => {
        let ColumnWrapper, Result;

        beforeEach('replace dependencies with test doubles', () => {
            ColumnWrapper = td.replace('../../../lib/DevAPI/Util/columnWrapper');
            Result = td.replace('../../../lib/DevAPI/RowResult');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
        });

        it('executes a TableSelect statement and returns a RowResult instance with the details provided by the server', () => {
            const context = 'foo';
            const crudFind = td.function();
            const integerType = 'bar';
            const connection = { getClient: () => ({ crudFind }), getIntegerType: () => integerType, isIdle: () => false, isOpen: () => true };
            const details = { baz: 'qux' };
            const execute = td.function();
            const want = 'quux';

            td.when(Preparing({ connection })).thenReturn({ execute });

            const statement = TableSelect({ connection });

            td.when(crudFind(statement, undefined, undefined)).thenReturn(context);
            td.when(execute(td.matchers.argThat(fn => fn() === context), undefined, undefined)).thenResolve(details);
            td.when(Result({ ...details, integerType })).thenReturn(want);

            return statement.execute()
                .then(got => expect(got).to.equal(want));
        });

        it('executes a TableSelect statement with a given cursor and returns a RowResult instance with the details provided by the server', () => {
            const crudFind = td.function();
            const integerType = 'foo';
            const connection = { getClient: () => ({ crudFind }), getIntegerType: () => integerType, isIdle: () => false, isOpen: () => true };
            const dataCursor = td.function();
            const details = { bar: 'baz' };
            const execute = td.function();
            const values = ['quux'];
            const row = { toArray: () => values };
            const statementContext = 'quuux';
            const cursorContext = 'quuuux';
            const cursorContextMatcher = td.matchers.argThat(fn => fn(row) === cursorContext);
            const statementContextMatcher = td.matchers.argThat(fn => fn() === statementContext);
            const want = 'quuuuux';

            td.when(Preparing({ connection })).thenReturn({ execute });

            const statement = TableSelect({ connection });

            td.when(dataCursor(values)).thenReturn(cursorContext);
            td.when(crudFind(statement, cursorContextMatcher), { ignoreExtraArgs: true }).thenReturn(statementContext);
            td.when(execute(statementContextMatcher, cursorContextMatcher), { ignoreExtraArgs: true }).thenResolve(details);
            td.when(Result({ ...details, integerType })).thenReturn(want);

            return statement.execute(dataCursor)
                .then(got => expect(got).to.equal(want));
        });

        it('executes a TableSelect statement with a given metadata cursor and returns a RowResult instance with the details provided by the server', () => {
            const crudFind = td.function();
            const columnWrapper = 'foo';
            const integerType = 'bar';
            const connection = { getClient: () => ({ crudFind }), getIntegerType: () => integerType, isIdle: () => false, isOpen: () => true };
            const dataCursor = td.function();
            const details = 'baz';
            const execute = td.function();
            const metadataCursor = td.function();
            const values = ['quux'];
            const row = { toArray: () => values };
            const statementContext = 'quuux';
            const cursorContext = 'quuuux';
            const cursorContextMatcher = td.matchers.argThat(fn => fn(row) === cursorContext);
            const statementContextMatcher = td.matchers.argThat(fn => fn() === statementContext);
            const expected = 'quux';

            td.when(Preparing({ connection })).thenReturn({ execute });

            const statement = TableSelect({ connection });

            td.when(dataCursor(values)).thenReturn(cursorContext);
            td.when(ColumnWrapper(metadataCursor)).thenReturn(columnWrapper);
            td.when(crudFind(statement, cursorContextMatcher, columnWrapper)).thenReturn(statementContext);
            td.when(execute(statementContextMatcher, cursorContextMatcher, columnWrapper)).thenResolve(details);
            td.when(Result({ ...details, integerType })).thenReturn(expected);

            return statement.execute(dataCursor, metadataCursor)
                .then(got => expect(got).to.equal(expected));
        });

        it('fails to execute the TableSelect statement when the connection is not open', () => {
            const error = new Error('foo');
            const connection = { getError: () => error, isOpen: () => false };

            return TableSelect({ connection }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('fails to execute the TableSelect statement when the connection has expired', () => {
            const error = new Error('foo');
            const connection = { getError: () => error, isIdle: () => true, isOpen: () => true };

            return TableSelect({ connection }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });
    });

    context('groupBy()', () => {
        let Grouping;

        beforeEach('replace dependencies with test doubles', () => {
            Grouping = td.replace('../../../lib/DevAPI/Grouping');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
        });

        it('calls the groupBy() method provided by the Grouping mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const groupBy = td.function();
            const preparable = 'baz';
            const searchExprStrList = 'qux';

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Grouping({ dataModel, preparable })).thenReturn({ groupBy });
            td.when(groupBy(searchExprStrList)).thenReturn(expected);

            expect(TableSelect({ connection }).groupBy(searchExprStrList)).to.equal(expected);
        });
    });

    context('having()', () => {
        let Grouping;

        beforeEach('replace dependencies with test doubles', () => {
            Grouping = td.replace('../../../lib/DevAPI/Grouping');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
        });

        it('calls the having() method provided by the Grouping mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const having = td.function();
            const preparable = 'baz';
            const searchConditionStr = 'qux';

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Grouping({ dataModel, preparable })).thenReturn({ having });
            td.when(having(searchConditionStr)).thenReturn(expected);

            expect(TableSelect({ connection }).having(searchConditionStr)).to.equal(expected);
        });
    });

    context('limit()', () => {
        let Skipping;

        beforeEach('replace dependencies with test doubles', () => {
            Skipping = td.replace('../../../lib/DevAPI/Skipping');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
        });

        it('calls the limit() method provided by the Skipping mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const limit = td.function();
            const preparable = 'baz';
            const size = 3;

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Skipping({ preparable })).thenReturn({ limit });
            td.when(limit(size)).thenReturn(expected);

            expect(TableSelect({ connection }).limit(size)).to.equal(expected);
        });
    });

    context('lockExclusive()', () => {
        let Locking;

        beforeEach('replace dependencies with test doubles', () => {
            Locking = td.replace('../../../lib/DevAPI/Locking');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
        });

        it('calls the lockExclusive() method provided by the Locking mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const lockExclusive = td.function();
            const preparable = 'baz';
            const lockContention = 'qux';

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Locking({ preparable })).thenReturn({ lockExclusive });
            td.when(lockExclusive(lockContention)).thenReturn(expected);

            expect(TableSelect({ connection }).lockExclusive(lockContention)).to.equal(expected);
        });
    });

    context('lockShared()', () => {
        let Locking;

        beforeEach('replace dependencies with test doubles', () => {
            Locking = td.replace('../../../lib/DevAPI/Locking');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
        });

        it('calls the lockShared() method provided by the Locking mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const lockShared = td.function();
            const preparable = 'baz';
            const lockContention = 'qux';

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Locking({ preparable })).thenReturn({ lockShared });
            td.when(lockShared(lockContention)).thenReturn(expected);

            expect(TableSelect({ connection }).lockShared(lockContention)).to.equal(expected);
        });
    });

    context('offset()', () => {
        let Skipping;

        beforeEach('replace dependencies with test doubles', () => {
            Skipping = td.replace('../../../lib/DevAPI/Skipping');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
        });

        it('calls the offset() method provided by the Skipping mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const offset = td.function();
            const preparable = 'baz';
            const size = 3;

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Skipping({ preparable })).thenReturn({ offset });
            td.when(offset(size)).thenReturn(expected);

            expect(TableSelect({ connection }).offset(size)).to.equal(expected);
        });
    });

    context('orderBy()', () => {
        let Ordering;

        beforeEach('replace dependencies with test doubles', () => {
            Ordering = td.replace('../../../lib/DevAPI/TableOrdering');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
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

            expect(TableSelect({ connection }).orderBy(sortExpr)).to.equal(expected);
        });
    });

    context('where()', () => {
        let Filtering;

        beforeEach('replace dependencies with test doubles', () => {
            Filtering = td.replace('../../../lib/DevAPI/TableFiltering');
            // reload module with the replacements
            TableSelect = require('../../../lib/DevAPI/TableSelect');
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

            expect(TableSelect({ connection }).where(searchExprStrList)).to.equal(expected);
        });
    });
});
