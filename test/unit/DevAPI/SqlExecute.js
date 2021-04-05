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
const warnings = require('../../../lib/constants/warnings');

// subject under test needs to be reloaded with replacement fakes
let sqlExecute = require('../../../lib/DevAPI/SqlExecute');

describe('SqlExecute', () => {
    let getAlias, result, sqlStmtExecute, warning;

    beforeEach('create fakes', () => {
        getAlias = td.function();
        sqlStmtExecute = td.function();
        warning = td.function();

        const logger = td.replace('../../../lib/logger');
        td.when(logger('api:session:sql')).thenReturn({ warning });

        result = td.replace('../../../lib/DevAPI/SqlResult');

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

        it('calls a result handler provided as an argument', () => {
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

        it('calls a metadata handler provided as an argument', () => {
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

        it('generates a deprecation warning whilst calling handlers provided as an object argument', () => {
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
                expect(td.explain(warning).callCount).to.equal(1);
                return expect(td.explain(warning).calls[0].args).to.deep.equal(['execute', warnings.MESSAGES.WARN_DEPRECATED_EXECUTE_CURSOR_OBJECT, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
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
