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

const expect = require('chai').expect;
const td = require('testdouble');
const updating = require('../../../lib/DevAPI/Updating');

describe('CollectionModify', () => {
    let collectionModify, preparing;

    beforeEach('create fakes', () => {
        preparing = td.function();

        td.replace('../../../lib/DevAPI/Preparing', preparing);
        collectionModify = require('../../../lib/DevAPI/CollectionModify');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('arrayAppend()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const session = 'foo';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            collectionModify(session).unset('bar');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const session = 'foo';
            const expected = [{ source: 'bar', type: updating.Operation.ARRAY_APPEND, value: 'baz' }];

            td.when(preparing({ session })).thenReturn({ forceRestart });

            return expect(collectionModify(session).arrayAppend('bar', 'baz').getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const session = 'foo';
            const existing = [{ foo: 'bar' }];
            const expected = existing.concat([{ source: 'bar', type: updating.Operation.ARRAY_APPEND, value: 'baz' }]);

            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = collectionModify(session);

            return expect(query.setOperations(existing).arrayAppend('bar', 'baz').getOperations()).to.deep.equal(expected);
        });
    });

    context('arrayInsert()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const session = 'foo';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            collectionModify(session).unset('bar');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const session = 'foo';
            const expected = [{ source: 'bar', type: updating.Operation.ARRAY_INSERT, value: 'baz' }];

            td.when(preparing({ session })).thenReturn({ forceRestart });

            return expect(collectionModify(session).arrayInsert('bar', 'baz').getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const session = 'foo';
            const existing = [{ foo: 'bar' }];
            const expected = existing.concat([{ source: 'bar', type: updating.Operation.ARRAY_INSERT, value: 'baz' }]);

            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = collectionModify(session);

            return expect(query.setOperations(existing).arrayInsert('bar', 'baz').getOperations()).to.deep.equal(expected);
        });
    });

    context('execute()', () => {
        it('fails if a condition query is not provided', () => {
            const query = collectionModify();

            return query.execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided with modify().'));
        });

        it('fails if a condition query is empty', () => {
            const query = collectionModify(null, null, null, '');

            return query.execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided with modify().'));
        });

        it('fails if the condition is not valid', () => {
            const query = collectionModify(null, null, null, ' ');

            return query.execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided with modify().'));
        });

        it('wraps the operation in a preparable instance', () => {
            const execute = td.function();
            const session = 'foo';
            const expected = ['bar'];
            const state = { warnings: expected };

            td.when(execute(td.matchers.isA(Function))).thenResolve(state);
            td.when(preparing({ session })).thenReturn({ execute });

            return collectionModify(session, null, null, 'true').execute()
                .then(actual => expect(actual.getWarnings()).to.deep.equal(expected));
        });
    });

    context('limit()', () => {
        let forceReprepare;

        beforeEach('create fakes', () => {
            forceReprepare = td.function();
        });

        it('mixes in Limiting with the proper state', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            collectionModify(session).limit(1);

            return expect(td.explain(forceReprepare).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            const query = collectionModify(session).limit(1);

            return expect(query.limit).to.be.a('function');
        });
    });

    context('patch()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const session = 'foo';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            collectionModify(session).patch('bar');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const session = 'foo';
            const doc = { foo: 'bar', baz: { qux: 'quux' } };
            const expected = [{ source: '$', type: updating.Operation.MERGE_PATCH, value: doc }];

            td.when(preparing({ session })).thenReturn({ forceRestart });

            return expect(collectionModify(session).patch(doc).getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const session = 'foo';
            const existing = [{ foo: 'bar' }];
            const doc = { baz: 'qux' };
            const expected = [{ foo: 'bar' }, { source: '$', type: updating.Operation.MERGE_PATCH, value: doc }];

            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = collectionModify(session);

            return expect(query.setOperations(existing).patch(doc).getOperations()).to.deep.equal(expected);
        });
    });

    context('set()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const session = 'foo';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            collectionModify(session).set('bar', 'baz');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const session = 'foo';
            const expected = [{ source: 'bar', type: updating.Operation.ITEM_SET, value: 'baz' }];

            td.when(preparing({ session })).thenReturn({ forceRestart });

            return expect(collectionModify(session).set('bar', 'baz').getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const session = 'foo';
            const existing = [{ foo: 'bar' }];
            const expected = existing.concat([{ source: 'bar', type: updating.Operation.ITEM_SET, value: 'baz' }]);

            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = collectionModify(session);

            return expect(query.setOperations(existing).set('bar', 'baz').getOperations()).to.deep.equal(expected);
        });
    });

    context('sort()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in CollectionOrdering with the proper state', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            collectionModify(session).sort();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const statement = collectionModify(session).sort();

            return expect(statement.sort).to.be.a('function');
        });

        it('sets the order parameters provided as an array', () => {
            const session = 'foo';
            const parameters = ['bar desc', 'baz desc'];

            td.when(preparing({ session })).thenReturn({ forceRestart });

            const statement = collectionModify(session).sort(parameters);

            return expect(statement.getOrderings()).to.deep.equal(parameters);
        });

        it('sets the order parameters provided as multiple arguments', () => {
            const session = 'foo';
            const parameters = ['bar desc', 'baz desc'];

            td.when(preparing({ session })).thenReturn({ forceRestart });

            const statement = collectionModify(session).sort(parameters[0], parameters[1]);

            return expect(statement.getOrderings()).to.deep.equal(parameters);
        });
    });

    context('unset()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const session = 'foo';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            collectionModify(session).unset('bar');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const session = 'foo';
            const expected = [{ source: 'bar', type: updating.Operation.ITEM_REMOVE }];

            td.when(preparing({ session })).thenReturn({ forceRestart });

            return expect(collectionModify(session).unset('bar').getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const session = 'foo';
            const existing = [{ foo: 'bar' }];
            const expected = existing.concat([{ source: 'bar', type: updating.Operation.ITEM_REMOVE }]);

            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = collectionModify(session);

            return expect(query.setOperations(existing).unset('bar').getOperations()).to.deep.equal(expected);
        });
    });
});
