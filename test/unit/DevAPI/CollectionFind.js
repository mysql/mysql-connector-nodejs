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

// subject under test needs to be reloaded with replacement fakes
let collectionFind = require('../../../lib/DevAPI/CollectionFind');

describe('CollectionFind', () => {
    let preparing, toArray;

    beforeEach('create fakes', () => {
        preparing = td.function();
        toArray = td.function();

        td.replace('../../../lib/DevAPI/Preparing', preparing);
        collectionFind = require('../../../lib/DevAPI/CollectionFind');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        it('fails if the connection is not open', () => {
            const getError = td.function();
            const isOpen = td.function();
            const connection = { getError, isOpen };
            const error = new Error('foobar');

            td.when(isOpen()).thenReturn(false);
            td.when(getError()).thenReturn(error);

            return collectionFind(connection).execute()
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

            return collectionFind(connection).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('wraps an operation without a cursor in a preparable instance', () => {
            const execute = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { isIdle, isOpen };
            const row = { toArray };
            const state = { results: [[row]] };

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(false);
            td.when(toArray()).thenReturn(['foo']);
            td.when(execute(td.matchers.isA(Function), undefined)).thenResolve(state);
            td.when(preparing({ connection })).thenReturn({ execute });

            return collectionFind(connection).execute()
                .then(actual => {
                    return expect(actual.fetchOne()).to.equal('foo');
                });
        });

        it('wraps an operation with a cursor in a preparable instance', () => {
            const execute = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { isIdle, isOpen };
            const expected = ['foo'];
            const state = { warnings: expected };

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(false);
            td.when(execute(td.matchers.isA(Function), td.matchers.isA(Function))).thenResolve(state);
            td.when(preparing({ connection })).thenReturn({ execute });

            return collectionFind(connection).execute(td.callback())
                .then(actual => {
                    return expect(actual.getWarnings()).to.deep.equal(expected);
                });
        });
    });

    context('fields()', () => {
        let parseFlexibleParamList, projecting, forceRestart, setProjections;

        beforeEach('create fakes', () => {
            parseFlexibleParamList = td.function();
            projecting = td.function();
            forceRestart = td.function();
            setProjections = td.function();

            td.replace('../../../lib/DevAPI/Projecting', projecting);
            td.replace('../../../lib/DevAPI/Util/parseFlexibleParamList', parseFlexibleParamList);

            collectionFind = require('../../../lib/DevAPI/CollectionFind');
        });

        it('sets projections provided as an array', () => {
            const connection = 'foo';

            td.when(preparing({ connection })).thenReturn({ forceRestart });
            td.when(projecting()).thenReturn({ setProjections });
            td.when(parseFlexibleParamList([['foo', 'bar']])).thenReturn(['baz', 'qux']);

            collectionFind(connection).fields(['foo', 'bar']);

            expect(td.explain(setProjections).callCount).to.equal(1);
            return expect(td.explain(setProjections).calls[0].args[0]).to.deep.equal(['baz', 'qux']);
        });

        it('sets projections provided as multiple arguments', () => {
            const connection = 'foo';

            td.when(preparing({ connection })).thenReturn({ forceRestart });
            td.when(projecting()).thenReturn({ setProjections });
            td.when(parseFlexibleParamList(['foo', 'bar'])).thenReturn(['baz', 'qux']);

            collectionFind(connection).fields('foo', 'bar');

            expect(td.explain(setProjections).callCount).to.equal(1);
            return expect(td.explain(setProjections).calls[0].args[0]).to.deep.equal(['baz', 'qux']);
        });
    });

    context('groupBy()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in Grouping with the proper state', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            collectionFind(connection).groupBy('foo');

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const query = collectionFind(connection).groupBy();

            expect(query.groupBy).to.be.a('function');
        });

        it('sets the grouping columns provided as an array', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const grouping = ['foo', 'bar'];
            const query = collectionFind(connection).groupBy(grouping);

            expect(query.getGroupings()).to.deep.equal(grouping);
        });

        it('sets the grouping columns provided as an array', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const grouping = ['foo', 'bar'];
            const query = collectionFind(connection).groupBy(grouping[0], grouping[1]);

            expect(query.getGroupings()).to.deep.equal(grouping);
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

            collectionFind(connection).limit(1);

            return expect(td.explain(forceReprepare).callCount).equal(1);
        });

        it('is fluent', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceReprepare });

            const query = collectionFind(connection).limit(1);

            return expect(query.limit).to.be.a('function');
        });

        it('sets a default offset implicitely', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceReprepare });

            const query = collectionFind(connection).limit(1);

            return expect(query.getOffset()).to.equal(0);
        });
    });

    context('lockShared()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in Locking with the proper state', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            collectionFind(connection).lockShared();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const query = collectionFind(connection).groupBy();

            expect(query.lockShared).to.be.a('function');
        });
    });

    context('lockExclusive()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in Locking with the proper state', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            collectionFind(connection).lockExclusive();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const query = collectionFind(connection).groupBy();

            expect(query.lockExclusive).to.be.a('function');
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

            collectionFind(connection).sort();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const query = collectionFind(connection).sort();

            return expect(query.sort).to.be.a('function');
        });

        it('sets the order parameters provided as an array', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = collectionFind(connection).sort(parameters);

            return expect(query.getOrderings()).to.deep.equal(parameters);
        });

        it('sets the order parameters provided as multiple arguments', () => {
            const connection = 'foo';
            td.when(preparing({ connection })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = collectionFind(connection).sort(parameters[0], parameters[1]);

            return expect(query.getOrderings()).to.deep.equal(parameters);
        });
    });
});
