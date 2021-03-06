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

describe('TableDelete', () => {
    let tableDelete, preparing;

    beforeEach('create fakes', () => {
        preparing = td.function();

        td.replace('../../../lib/DevAPI/Preparing', preparing);
        tableDelete = require('../../../lib/DevAPI/TableDelete');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        it('fails if a filtering criteria expression is not provided', () => {
            return tableDelete().execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
        });

        it('fails if the filtering criteria expression is empty', () => {
            return tableDelete(null, null, null, '').execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
        });

        it('fails if the filtering criteria expression is not valid', () => {
            return tableDelete(null, null, null, ' ').execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
        });

        it('fails if the filtering criteria expression is undefined', () => {
            const session = 'foo';
            const forceRestart = td.function();

            td.when(preparing({ session })).thenReturn({ forceRestart });

            return tableDelete(session).where().execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
        });

        it('wraps the operation in a preparable instance', () => {
            const execute = td.function();
            const session = 'foo';
            const expected = ['bar'];
            const state = { warnings: expected };

            td.when(execute(td.matchers.isA(Function))).thenResolve(state);
            td.when(preparing({ session })).thenReturn({ execute });

            return tableDelete(session, null, null, 'true').execute()
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

            tableDelete(session).limit(1);

            return expect(td.explain(forceReprepare).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            const query = tableDelete(session).limit(1);

            return expect(query.limit).to.be.a('function');
        });
    });

    context('orderBy()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in TableOrdering with the proper state', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            tableDelete(session).orderBy();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = tableDelete(session).orderBy();

            expect(query.orderBy).to.be.a('function');
        });

        it('sets the order parameters provided as an array', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = tableDelete(session).orderBy(parameters);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });

        it('sets the order parameters provided as multiple arguments', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = tableDelete(session).orderBy(parameters[0], parameters[1]);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });
    });

    context('where()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in TableFiltering with the proper state', () => {
            const session = 'foo';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            tableDelete(session).where();

            expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('sets the query criteria', () => {
            const session = 'foo';
            const criteria = 'bar';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            expect(tableDelete(session).where(criteria).getCriteria()).to.equal(criteria);
        });
    });
});
