/*
 * Copyright (c) 2018, 2021, Oracle and/or its affiliates.
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
let sqlExecute = require('../../../lib/DevAPI/SqlExecute');

describe('SqlExecute', () => {
    let deprecated, getAlias, result, sqlStmtExecute;

    beforeEach('create fakes', () => {
        deprecated = td.function();
        getAlias = td.function();
        result = td.function();
        sqlStmtExecute = td.function();

        td.replace('../../../lib/DevAPI/Util/deprecated', deprecated);
        td.replace('../../../lib/DevAPI/SqlResult', result);
        sqlExecute = require('../../../lib/DevAPI/SqlExecute');
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

            return sqlExecute(connection).execute()
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

            return sqlExecute(connection).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err).to.deep.equal(error);
                });
        });

        it('returns a SqlResult instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const getClient = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { getClient, isIdle, isOpen };
            const query = sqlExecute(connection, 'foo', 'bar', 'baz');

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(false);
            td.when(getClient()).thenReturn({ sqlStmtExecute });
            td.when(result(state)).thenReturn(expected);
            td.when(sqlStmtExecute(query), { ignoreExtraArgs: true }).thenResolve(state);

            return query.execute()
                .then(actual => {
                    return expect(actual).to.deep.equal(expected);
                });
        });

        it('calls a result handler provided as an `execute` argument', () => {
            const getClient = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { getClient, isIdle, isOpen };
            const query = sqlExecute(connection);

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(false);
            td.when(getClient()).thenReturn({ sqlStmtExecute });
            td.when(sqlStmtExecute(td.matchers.anything(), td.callback('foo')), { ignoreExtraArgs: true }).thenResolve();

            return query.execute(actual => {
                return expect(actual).to.equal('foo');
            });
        });

        it('calls a metadata handler provided as an `execute` argument', () => {
            const getClient = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { getClient, isIdle, isOpen };
            const query = sqlExecute(connection);
            const meta = [{ getAlias }];

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(false);
            td.when(getClient()).thenReturn({ sqlStmtExecute });
            td.when(getAlias()).thenReturn('foo');
            td.when(sqlStmtExecute(td.matchers.anything(), td.matchers.anything(), td.callback(meta))).thenResolve();

            return query.execute(td.function(), actual => {
                expect(actual).to.have.lengthOf(1);
                expect(actual[0].getColumnLabel()).to.equal('foo');
            });
        });

        // Deprecated since release 8.0.22
        it('calls a handlers provided as an `execute` object argument', () => {
            const getClient = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { getClient, isIdle, isOpen };
            const query = sqlExecute(connection);
            const meta = [{ getAlias }];

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(false);
            td.when(getClient()).thenReturn({ sqlStmtExecute });
            td.when(getAlias()).thenReturn('bar');
            td.when(sqlStmtExecute(td.matchers.anything(), td.callback('foo'), td.callback(meta))).thenResolve();

            return query.execute({
                row (actual) {
                    expect(actual).to.equal('foo');
                },
                meta (actual) {
                    expect(actual).to.have.lengthOf(1);
                    expect(actual[0].getColumnLabel()).to.equal('bar');
                }
            }).then(() => {
                return expect(td.explain(deprecated).callCount).to.equal(1);
            });
        });

        it('freezes the statement after returning a result', () => {
            const getClient = td.function();
            const isIdle = td.function();
            const isOpen = td.function();
            const connection = { getClient, isIdle, isOpen };
            const statement = sqlExecute(connection);
            const freeze = td.replace(statement, 'freeze');

            td.when(isOpen()).thenReturn(true);
            td.when(isIdle()).thenReturn(false);
            td.when(getClient()).thenReturn({ sqlStmtExecute });
            td.when(sqlStmtExecute(statement), { ignoreExtraArgs: true }).thenResolve();

            return statement.execute()
                .then(() => {
                    return expect(td.explain(freeze).callCount).to.equal(1);
                });
        });
    });
});
