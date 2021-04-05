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
const updating = require('../../../lib/DevAPI/Updating');
const warnings = require('../../../lib/constants/warnings');
const util = require('util');

// subject under test needs to be reloaded with replacement fakes
let collectionModify = require('../../../lib/DevAPI/CollectionModify');

describe('CollectionModify', () => {
    let preparing, warning;

    beforeEach('create fakes', () => {
        warning = td.function();

        preparing = td.replace('../../../lib/DevAPI/Preparing');

        const logger = td.replace('../../../lib/logger');
        td.when(logger('api:collection:modify')).thenReturn({ warning });

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
            const connection = 'foo';

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            collectionModify(connection).unset('bar');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const connection = 'foo';
            const expected = [{ source: 'bar', type: updating.Operation.ARRAY_APPEND, value: 'baz' }];

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            return expect(collectionModify(connection).arrayAppend('bar', 'baz').getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const connection = 'foo';
            const existing = [{ foo: 'bar' }];
            const expected = existing.concat([{ source: 'bar', type: updating.Operation.ARRAY_APPEND, value: 'baz' }]);

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const query = collectionModify(connection);

            return expect(query.setOperations(existing).arrayAppend('bar', 'baz').getOperations()).to.deep.equal(expected);
        });
    });

    context('arrayDelete()', () => {
        it('unsets an item from an array', () => {
            const statement = collectionModify();
            const unset = td.replace(statement, 'unset');

            statement.arrayDelete('foo');

            expect(td.explain(unset).callCount).to.equal(1);
            return expect(td.explain(unset).calls[0].args).to.deep.equal(['foo']);
        });

        it('generates a deprecation warning', () => {
            const statement = collectionModify();
            td.replace(statement, 'unset');

            statement.arrayDelete('foo');

            expect(td.explain(warning).callCount).to.equal(1);
            return expect(td.explain(warning).calls[0].args).to.deep.equal(['arrayDelete', warnings.MESSAGES.WARN_DEPRECATED_ARRAY_DELETE, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
        });
    });

    context('arrayInsert()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const connection = 'foo';

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            collectionModify(connection).unset('bar');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const connection = 'foo';
            const expected = [{ source: 'bar', type: updating.Operation.ARRAY_INSERT, value: 'baz' }];

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            return expect(collectionModify(connection).arrayInsert('bar', 'baz').getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const connection = 'foo';
            const existing = [{ foo: 'bar' }];
            const expected = existing.concat([{ source: 'bar', type: updating.Operation.ARRAY_INSERT, value: 'baz' }]);

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const query = collectionModify(connection);

            return expect(query.setOperations(existing).arrayInsert('bar', 'baz').getOperations()).to.deep.equal(expected);
        });
    });

    context('execute()', () => {
        it('fails if a condition query is not provided', () => {
            return collectionModify().execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_MISSING_DOCUMENT_CRITERIA, 'modify()'));
                });
        });

        it('fails if a condition query is empty', () => {
            return collectionModify(null, null, null, '').execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_MISSING_DOCUMENT_CRITERIA, 'modify()'));
                });
        });

        it('fails if the condition is not valid', () => {
            return collectionModify(null, null, null, ' ').execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(util.format(errors.MESSAGES.ER_DEVAPI_MISSING_DOCUMENT_CRITERIA, 'modify()'));
                });
        });

        it('fails if the connection is not open', () => {
            const getError = td.function();
            const isOpen = td.function();
            const connection = { getError, isOpen };
            const error = new Error('foobar');

            td.when(isOpen()).thenReturn(false);
            td.when(getError()).thenReturn(error);

            return collectionModify(connection, null, null, 'true').execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('fails if the connection is expired', () => {
            const getError = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { getError, isIdle, isOpen };
            const error = new Error('foobar');

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(true);
            td.when(getError()).thenReturn(error);

            return collectionModify(connection, null, null, 'true').execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('wraps the operation in a preparable instance', () => {
            const execute = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { isIdle, isOpen };
            const expected = ['foo'];
            const state = { warnings: expected };

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(false);
            td.when(execute(td.matchers.isA(Function))).thenResolve(state);
            td.when(preparing({ connection })).thenReturn({ execute });

            return collectionModify(connection, null, null, 'true').execute()
                .then(actual => {
                    return expect(actual.getWarnings()).to.deep.equal(expected);
                });
        });
    });

    context('limit()', () => {
        let forceReprepare;

        beforeEach('create fakes', () => {
            forceReprepare = td.function();
        });

        it('mixes in Limiting with the proper state', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceReprepare });

            collectionModify(connection).limit(1);

            return expect(td.explain(forceReprepare).callCount).equal(1);
        });

        it('is fluent', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceReprepare });

            const query = collectionModify(connection).limit(1);

            return expect(query.limit).to.be.a('function');
        });
    });

    context('patch()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const connection = 'foo';

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            collectionModify(connection).patch('bar');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const connection = 'foo';
            const doc = { foo: 'bar', baz: { qux: 'quux' } };
            const expected = [{ source: '$', type: updating.Operation.MERGE_PATCH, value: doc }];

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            return expect(collectionModify(connection).patch(doc).getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const connection = 'foo';
            const existing = [{ foo: 'bar' }];
            const doc = { baz: 'qux' };
            const expected = [{ foo: 'bar' }, { source: '$', type: updating.Operation.MERGE_PATCH, value: doc }];

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const query = collectionModify(connection);

            return expect(query.setOperations(existing).patch(doc).getOperations()).to.deep.equal(expected);
        });
    });

    context('set()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const connection = 'foo';

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            collectionModify(connection).set('bar', 'baz');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const connection = 'foo';
            const expected = [{ source: 'bar', type: updating.Operation.ITEM_SET, value: 'baz' }];

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            return expect(collectionModify(connection).set('bar', 'baz').getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const connection = 'foo';
            const existing = [{ foo: 'bar' }];
            const expected = existing.concat([{ source: 'bar', type: updating.Operation.ITEM_SET, value: 'baz' }]);

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const query = collectionModify(connection);

            return expect(query.setOperations(existing).set('bar', 'baz').getOperations()).to.deep.equal(expected);
        });
    });

    context('sort()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in CollectionOrdering with the proper state', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            collectionModify(connection).sort();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const statement = collectionModify(connection).sort();

            return expect(statement.sort).to.be.a('function');
        });

        it('sets the order parameters provided as an array', () => {
            const connection = 'foo';
            const parameters = ['bar desc', 'baz desc'];

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const statement = collectionModify(connection).sort(parameters);

            return expect(statement.getOrderings()).to.deep.equal(parameters);
        });

        it('sets the order parameters provided as multiple arguments', () => {
            const connection = 'foo';
            const parameters = ['bar desc', 'baz desc'];

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const statement = collectionModify(connection).sort(parameters[0], parameters[1]);

            return expect(statement.getOrderings()).to.deep.equal(parameters);
        });
    });

    context('unset()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const connection = 'foo';

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            collectionModify(connection).unset('bar');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const connection = 'foo';
            const expected = [{ source: 'bar', type: updating.Operation.ITEM_REMOVE }];

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            return expect(collectionModify(connection).unset('bar').getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const connection = 'foo';
            const existing = [{ foo: 'bar' }];
            const expected = existing.concat([{ source: 'bar', type: updating.Operation.ITEM_REMOVE }]);

            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const query = collectionModify(connection);

            return expect(query.setOperations(existing).unset('bar').getOperations()).to.deep.equal(expected);
        });
    });
});
