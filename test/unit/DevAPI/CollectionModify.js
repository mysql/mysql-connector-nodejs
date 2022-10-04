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

const { UpdateType } = require('../../../lib/Protocol/Stubs/mysqlx_crud_pb').UpdateOperation;
const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const td = require('testdouble');
const warnings = require('../../../lib/constants/warnings');
const util = require('util');

// subject under test needs to be reloaded with test doubles
let CollectionModify = require('../../../lib/DevAPI/CollectionModify');

describe('CollectionModify', () => {
    let Preparing;

    beforeEach('replace dependencies with test doubles', () => {
        Preparing = td.replace('../../../lib/DevAPI/Preparing');
        // reload module with the replacements
        CollectionModify = require('../../../lib/DevAPI/CollectionModify');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('arrayAppend()', () => {
        let DocPath, ExprOrLiteral;

        beforeEach('replace dependencies with test doubles', () => {
            DocPath = td.replace('../../../lib/DevAPI/DocPath');
            ExprOrLiteral = td.replace('../../../lib/DevAPI/ExprOrLiteral');
            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
        });

        it('adds the appropriate ARRAY_APPEND operation to the list of update operations that need to be executed', () => {
            const connection = 'foo';
            const docPath = 'bar';
            const exprOrLiteral = 'baz';
            const forceRestart = td.function();
            const getValue = td.function();
            const isLiteral = () => true;
            const operationList = ['qux'];
            const source = 'quux';
            const value = 'quuz';
            const expected = operationList.concat([{ source: source, type: UpdateType.ARRAY_APPEND, value, isLiteral: true }]);

            td.when(Preparing({ connection })).thenReturn({ forceRestart });
            td.when(ExprOrLiteral({ value: exprOrLiteral })).thenReturn({ getValue, isLiteral });
            td.when(DocPath(docPath)).thenReturn({ getValue });
            td.when(getValue()).thenReturn(value);
            td.when(getValue(), { times: 1 }).thenReturn(source);

            // Adds some operations beforehand to ensure those are not removed.
            CollectionModify({ connection, operationList }).arrayAppend(docPath, exprOrLiteral);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(operationList).to.deep.equal(expected);
        });
    });

    context('arrayDelete()', () => {
        let warning;

        beforeEach('replace dependencies with test doubles', () => {
            warning = td.function();

            const logger = td.replace('../../../lib/logger');
            td.when(logger('api:collection:modify')).thenReturn({ warning });

            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
        });

        it('calls the unset() method provided by the same module', () => {
            const statement = CollectionModify();
            const unset = td.replace(statement, 'unset');

            statement.arrayDelete('foo');

            expect(td.explain(unset).callCount).to.equal(1);
            return expect(td.explain(unset).calls[0].args).to.deep.equal(['foo']);
        });

        it('generates a deprecation warning', () => {
            const statement = CollectionModify();
            td.replace(statement, 'unset');

            statement.arrayDelete('foo');

            expect(td.explain(warning).callCount).to.equal(1);
            return expect(td.explain(warning).calls[0].args).to.deep.equal(['arrayDelete', warnings.MESSAGES.WARN_DEPRECATED_ARRAY_DELETE, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
        });
    });

    context('arrayInsert()', () => {
        let DocPath, ExprOrLiteral;

        beforeEach('replace dependencies with test doubles', () => {
            DocPath = td.replace('../../../lib/DevAPI/DocPath');
            ExprOrLiteral = td.replace('../../../lib/DevAPI/ExprOrLiteral');
            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
        });

        it('adds the appropriate ARRAY_INSERT operation to the list of update operations that need to be executed', () => {
            const connection = 'foo';
            const docPath = 'bar';
            const exprOrLiteral = 'baz';
            const forceRestart = td.function();
            const getValue = td.function();
            const isLiteral = () => true;
            const operationList = ['qux'];
            const source = 'quux';
            const value = 'quuz';
            const expected = operationList.concat([{ source: source, type: UpdateType.ARRAY_INSERT, value, isLiteral: true }]);

            td.when(Preparing({ connection })).thenReturn({ forceRestart });
            td.when(ExprOrLiteral({ value: exprOrLiteral })).thenReturn({ getValue, isLiteral });
            td.when(DocPath(docPath)).thenReturn({ getValue });
            td.when(getValue()).thenReturn(value);
            td.when(getValue(), { times: 1 }).thenReturn(source);

            // Adds some operations beforehand to ensure those are not removed.
            CollectionModify({ connection, operationList }).arrayInsert(docPath, exprOrLiteral);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(operationList).to.deep.equal(expected);
        });
    });

    context('bind()', () => {
        let Binding;

        beforeEach('replace dependencies with test doubles', () => {
            Binding = td.replace('../../../lib/DevAPI/Binding');
            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
        });

        it('calls the bind() method provided by the Binding mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const bind = td.function();
            const placeholder = 'baz';
            const value = 'qux';

            td.when(Binding()).thenReturn({ bind });
            td.when(bind(placeholder, value)).thenReturn(expected);

            expect(CollectionModify({ connection }).bind(placeholder, value)).to.equal(expected);
        });
    });

    context('execute()', () => {
        let Result;

        beforeEach('replace dependencies with test doubles', () => {
            Result = td.replace('../../../lib/DevAPI/Result');
            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
        });

        it('executes a CollectionModify statement and returns a Result instance with the details provided by the server', () => {
            const context = 'foo';
            const crudModify = td.function();
            const connection = { getClient: () => ({ crudModify }), isIdle: () => false, isOpen: () => true };
            const criteria = 'bar';
            const details = 'baz';
            const execute = td.function();
            const expected = 'qux';

            td.when(Preparing({ connection })).thenReturn({ execute });

            const statement = CollectionModify({ criteria, connection });

            td.when(crudModify(statement)).thenReturn(context);
            td.when(execute(td.matchers.argThat(fn => fn() === context))).thenResolve(details);
            td.when(Result(details)).thenReturn(expected);

            return statement.execute()
                .then(got => expect(got).to.equal(expected));
        });

        it('fails to execute the statement when the filtering criteria is not defined', () => {
            return CollectionModify().execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_MISSING_DOCUMENT_CRITERIA, 'modify()'));
                });
        });

        it('fails to execute the CollectionModify statement when the connection is not open', () => {
            const criteria = 'foo';
            const error = new Error('bar');
            const connection = { getError: () => error, isOpen: () => false };

            return CollectionModify({ criteria, connection }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('fails to execute the CollectionModify statement when the connection has expired', () => {
            const criteria = 'foo';
            const error = new Error('bar');
            const connection = { getError: () => error, isIdle: () => true, isOpen: () => true };

            return CollectionModify({ criteria, connection }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });
    });

    context('limit()', () => {
        let Limiting;

        beforeEach('replace dependencies with test doubles', () => {
            Limiting = td.replace('../../../lib/DevAPI/Limiting');
            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
        });

        it('calls the limit() method provided by the Limiting mixin', () => {
            const connection = 'foo';
            const expected = 'bar';
            const limit = td.function();
            const preparable = 'baz';
            const size = 3;

            td.when(Preparing({ connection })).thenReturn(preparable);
            td.when(Limiting({ preparable })).thenReturn({ limit });
            td.when(limit(size)).thenReturn(expected);

            expect(CollectionModify({ connection }).limit(size)).to.equal(expected);
        });
    });

    context('patch()', () => {
        let DocPath, DocumentOrJSON;

        beforeEach('replace dependencies with test doubles', () => {
            DocPath = td.replace('../../../lib/DevAPI/DocPath');
            DocumentOrJSON = td.replace('../../../lib/DevAPI/DocumentOrJSON');
            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
        });

        it('adds the appropriate MERGE_PATCH operation to the list of update operations that need to be executed', () => {
            const connection = 'foo';
            const doc = 'bar';
            const forceRestart = td.function();
            const getValue = td.function();
            const isLiteral = () => true;
            const operationList = ['baz'];
            const source = 'quux';
            const value = 'quuz';
            const expected = operationList.concat([{ source: source, type: UpdateType.MERGE_PATCH, value, isLiteral: true }]);

            td.when(Preparing({ connection })).thenReturn({ forceRestart });
            td.when(DocumentOrJSON(doc)).thenReturn({ getValue, isLiteral });
            td.when(DocPath('$')).thenReturn({ getValue });
            td.when(getValue()).thenReturn(value);
            td.when(getValue(), { times: 1 }).thenReturn(source);

            // Adds some operations beforehand to ensure those are not removed.
            CollectionModify({ connection, operationList }).patch(doc);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(operationList).to.deep.equal(expected);
        });
    });

    context('set()', () => {
        let DocPath, ExprOrLiteral;

        beforeEach('replace dependencies with test doubles', () => {
            DocPath = td.replace('../../../lib/DevAPI/DocPath');
            ExprOrLiteral = td.replace('../../../lib/DevAPI/ExprOrLiteral');
            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
        });

        it('adds the appropriate ITEM_SET operation to the list of update operations that need to be executed', () => {
            const connection = 'foo';
            const docPath = 'bar';
            const exprOrLiteral = 'baz';
            const forceRestart = td.function();
            const getValue = td.function();
            const isLiteral = () => true;
            const operationList = ['qux'];
            const source = 'quux';
            const value = 'quuz';
            const expected = operationList.concat([{ source: source, type: UpdateType.ITEM_SET, value, isLiteral: true }]);

            td.when(Preparing({ connection })).thenReturn({ forceRestart });
            td.when(ExprOrLiteral({ value: exprOrLiteral })).thenReturn({ getValue, isLiteral });
            td.when(DocPath(docPath)).thenReturn({ getValue });
            td.when(getValue()).thenReturn(value);
            td.when(getValue(), { times: 1 }).thenReturn(source);

            // Adds some operations beforehand to ensure those are not removed.
            CollectionModify({ connection, operationList }).set(docPath, exprOrLiteral);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(operationList).to.deep.equal(expected);
        });
    });

    context('sort()', () => {
        let Ordering;

        beforeEach('replace dependencies with test doubles', () => {
            Ordering = td.replace('../../../lib/DevAPI/CollectionOrdering');
            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
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

            expect(CollectionModify({ connection }).sort(sortExpr)).to.equal(expected);
        });
    });

    context('unset()', () => {
        let DocPath;

        beforeEach('replace dependencies with test doubles', () => {
            DocPath = td.replace('../../../lib/DevAPI/DocPath');
            // reload module with the replacements
            CollectionModify = require('../../../lib/DevAPI/CollectionModify');
        });

        it('adds the appropriate ITEM_REMOVE operation to the list of update operations that need to be executed', () => {
            const connection = 'foo';
            const docPath = 'bar';
            const forceRestart = td.function();
            const getValue = td.function();
            const operationList = ['baz'];
            const source = 'qux';
            const expected = operationList.concat([{ source: source, type: UpdateType.ITEM_REMOVE }]);

            td.when(Preparing({ connection })).thenReturn({ forceRestart });
            td.when(DocPath(docPath)).thenReturn({ getValue });
            td.when(getValue()).thenReturn(source);

            // Adds some operations beforehand to ensure those are not removed.
            CollectionModify({ connection, operationList }).unset(docPath);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(operationList).to.deep.equal(expected);
        });
    });
});
