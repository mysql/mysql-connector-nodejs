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

const dataModel = require('../../../lib/Protocol/Stubs/mysqlx_crud_pb').DataModel.DOCUMENT;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with test doubles
let CollectionFind = require('../../../lib/DevAPI/CollectionFind');

describe('CollectionFind', () => {
    let Preparing;

    beforeEach('replace dependencies with test doubles', () => {
        Preparing = td.replace('../../../lib/DevAPI/Preparing');
        // reload module with the replacements
        CollectionFind = require('../../../lib/DevAPI/CollectionFind');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('bind()', () => {
        let Binding;

        beforeEach('replace dependencies with test doubles', () => {
            Binding = td.replace('../../../lib/DevAPI/Binding');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
        });

        it('calls the bind() method provided by the Binding mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const bind = td.function();
            const placeholder = 'baz';
            const value = 'qux';

            td.when(Binding()).thenReturn({ bind });
            td.when(bind(placeholder, value)).thenReturn(expected);

            expect(CollectionFind({ connection }).bind(placeholder, value)).to.equal(expected);
        });
    });

    context('execute()', () => {
        let Result;

        beforeEach('replace dependencies with test doubles', () => {
            Result = td.replace('../../../lib/DevAPI/DocResult');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
        });

        it('executes a CollectionFind statement and returns a DocResult instance with the details provided by the server', () => {
            const context = 'foo';
            const crudFind = td.function();
            const integerType = 'bar';
            const connection = { getClient: () => ({ crudFind }), getIntegerType: () => integerType, isIdle: () => false, isOpen: () => true };
            const details = { baz: 'qux' };
            const execute = td.function();
            const want = 'quux';

            td.when(Preparing({ connection })).thenReturn({ execute });

            const statement = CollectionFind({ connection });

            td.when(crudFind(statement, undefined)).thenReturn(context);
            td.when(execute(td.matchers.argThat(fn => fn() === context), undefined)).thenResolve(details);
            td.when(Result({ ...details, integerType })).thenReturn(want);

            return statement.execute()
                .then(got => expect(got).to.equal(want));
        });

        it('executes a CollectionFind statement with a given cursor and returns a DocResult instance with the details provided by the server', () => {
            const crudFind = td.function();
            const integerType = 'foo';
            const connection = { getClient: () => ({ crudFind }), getIntegerType: () => integerType, isIdle: () => false, isOpen: () => true };
            const dataCursor = td.function();
            const details = { bar: 'baz' };
            const execute = td.function();
            const value = 'qux';
            const row = { toArray: () => [value] };
            const statementContext = 'quuux';
            const cursorContext = 'quuuux';
            const cursorContextMatcher = td.matchers.argThat(fn => fn(row) === cursorContext);
            const statementContextMatcher = td.matchers.argThat(fn => fn() === statementContext);
            const want = 'quux';

            td.when(Preparing({ connection })).thenReturn({ execute });

            const statement = CollectionFind({ connection });

            td.when(dataCursor(value)).thenReturn(cursorContext);
            td.when(crudFind(statement, cursorContextMatcher)).thenReturn(statementContext);
            td.when(execute(statementContextMatcher, cursorContextMatcher)).thenResolve(details);
            td.when(Result({ ...details, integerType })).thenReturn(want);

            return statement.execute(dataCursor)
                .then(got => expect(got).to.equal(want));
        });

        it('fails to execute the CollectionFind statement when the connection is not open', () => {
            const error = new Error('foo');
            const connection = { getError: () => error, isOpen: () => false };

            return CollectionFind({ connection }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('fails to execute the CollectionFind statement when the connection has expired', () => {
            const error = new Error('foo');
            const connection = { getError: () => error, isIdle: () => true, isOpen: () => true };

            return CollectionFind({ connection }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });
    });

    context('fields()', () => {
        let ProjectedDocumentExprStr;

        beforeEach('replace dependencies with test doubles', () => {
            ProjectedDocumentExprStr = td.replace('../../../lib/DevAPI/ProjectedDocumentExprStr');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
        });

        it('appends the field expressions to the statement projection list', () => {
            const connection = 'foo';
            const forceRestart = td.function();
            const projectionList = ['bar'];
            const projectedDocumentExprStr = 'baz';
            const projectedDocumentExpr = 'qux';
            const getValue = () => projectedDocumentExpr;
            const expected = [...projectionList, projectedDocumentExpr];

            td.when(Preparing({ connection })).thenReturn({ forceRestart });
            td.when(ProjectedDocumentExprStr(projectedDocumentExprStr)).thenReturn({ getValue });

            // Adds some operations beforehand to ensure those are not removed.
            CollectionFind({ connection, projectionList }).fields(projectedDocumentExprStr);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(projectionList).to.deep.equal(expected);
        });
    });

    context('groupBy()', () => {
        let Grouping;

        beforeEach('replace dependencies with test doubles', () => {
            Grouping = td.replace('../../../lib/DevAPI/Grouping');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
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

            expect(CollectionFind({ connection }).groupBy(searchExprStrList)).to.equal(expected);
        });
    });

    context('having()', () => {
        let Grouping;

        beforeEach('replace dependencies with test doubles', () => {
            Grouping = td.replace('../../../lib/DevAPI/Grouping');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
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

            expect(CollectionFind({ connection }).having(searchConditionStr)).to.equal(expected);
        });
    });

    context('limit()', () => {
        let Skipping;

        beforeEach('replace dependencies with test doubles', () => {
            Skipping = td.replace('../../../lib/DevAPI/Skipping');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
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

            expect(CollectionFind({ connection }).limit(size)).to.equal(expected);
        });
    });

    context('lockExclusive()', () => {
        let Locking;

        beforeEach('replace dependencies with test doubles', () => {
            Locking = td.replace('../../../lib/DevAPI/Locking');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
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

            expect(CollectionFind({ connection }).lockExclusive(lockContention)).to.equal(expected);
        });
    });

    context('lockShared()', () => {
        let Locking;

        beforeEach('replace dependencies with test doubles', () => {
            Locking = td.replace('../../../lib/DevAPI/Locking');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
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

            expect(CollectionFind({ connection }).lockShared(lockContention)).to.equal(expected);
        });
    });

    context('offset()', () => {
        let Skipping;

        beforeEach('replace dependencies with test doubles', () => {
            Skipping = td.replace('../../../lib/DevAPI/Skipping');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
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

            expect(CollectionFind({ connection }).offset(size)).to.equal(expected);
        });
    });

    context('sort()', () => {
        let Ordering;

        beforeEach('replace dependencies with test doubles', () => {
            Ordering = td.replace('../../../lib/DevAPI/CollectionOrdering');
            // reload module with the replacements
            CollectionFind = require('../../../lib/DevAPI/CollectionFind');
        });

        it('calls the sort() method provided by the CollectionOrdering mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const preparable = 'baz';
            const sort = td.function();
            const sortExpr = 'qux';

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Ordering({ preparable })).thenReturn({ sort });
            td.when(sort(sortExpr)).thenReturn(expected);

            expect(CollectionFind({ connection }).sort(sortExpr)).to.equal(expected);
        });
    });
});
