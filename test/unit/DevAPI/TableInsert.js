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
let tableInsert = require('../../../lib/DevAPI/TableInsert');

describe('TableInsert', () => {
    context('execute()', () => {
        let crudInsert, result;

        beforeEach('create fakes', () => {
            crudInsert = td.function();
            result = td.function();

            td.replace('../../../lib/DevAPI/Result', result);
            tableInsert = require('../../../lib/DevAPI/TableInsert');
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('fails if the connection is not open', () => {
            const getError = td.function();
            const isOpen = td.function();
            const connection = { isOpen, getError };
            const error = new Error('foobar');

            td.when(isOpen()).thenReturn(false);
            td.when(getError()).thenReturn(error);

            return tableInsert(connection, null, null, ['foo', 'bar']).execute()
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

            return tableInsert(connection, null, null, ['foo', 'bar']).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('returns a Result instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const getClient = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { getClient, isIdle, isOpen };

            const query = tableInsert(connection, null, null, ['foo', 'bar']);

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(false);
            td.when(getClient()).thenReturn({ crudInsert });
            td.when(result(state)).thenReturn(expected);
            td.when(crudInsert(query)).thenResolve(state);

            return query.execute()
                .then(actual => {
                    return expect(actual).to.deep.equal(expected);
                });
        });
    });

    context('values()', () => {
        it('is fluent', () => {
            const query = tableInsert(null, null, null, ['foo']).values('bar');

            expect(query.values).to.be.a('function');
        });

        it('sets the rows provided as an array', () => {
            const values = ['baz', 'qux'];
            const query = tableInsert(null, null, null, ['foo', 'bar']).values(values);

            expect(query.getItems()).to.deep.equal([values]);
        });

        it('sets the rows provided as arguments', () => {
            const values = ['baz', 'qux'];
            const query = tableInsert(null, null, null, ['foo', 'bar']).values(values[0], values[1]);

            expect(query.getItems()).to.deep.equal([values]);
        });
    });
});
