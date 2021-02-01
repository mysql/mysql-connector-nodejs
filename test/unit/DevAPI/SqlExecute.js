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

describe('SqlExecute', () => {
    let fakeResult, sqlExecute, sqlStmtExecute;

    beforeEach('create fakes', () => {
        fakeResult = td.function();
        sqlStmtExecute = td.function();

        td.replace('../../../lib/DevAPI/SqlResult', fakeResult);
        sqlExecute = require('../../../lib/DevAPI/SqlExecute');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        let deprecated, getAlias;

        beforeEach('create fakes', () => {
            deprecated = td.function();
            getAlias = td.function();

            td.replace('../../../lib/DevAPI/Util/deprecated', deprecated);
            sqlExecute = require('../../../lib/DevAPI/SqlExecute');
        });

        it('executes the context statement', () => {
            const expected = { done: true };
            const state = { ok: true };

            const query = sqlExecute({ _client: { sqlStmtExecute } }, 'foo', 'bar', 'baz');

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(sqlStmtExecute(query), { ignoreExtraArgs: true }).thenResolve(state);

            return query.execute()
                .then(actual => expect(actual).to.deep.equal(expected));
        });

        it('calls a result handler provided as an `execute` argument', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });

            td.when(sqlStmtExecute(td.matchers.anything(), td.callback('foo')), { ignoreExtraArgs: true }).thenResolve();

            return query.execute(actual => expect(actual).to.equal('foo'));
        });

        it('calls a metadata handler provided as an `execute` argument', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });
            const meta = [{ getAlias }];

            td.when(getAlias()).thenReturn('foo');
            td.when(sqlStmtExecute(td.matchers.anything(), td.matchers.anything(), td.callback(meta))).thenResolve();

            return query.execute(td.function(), actual => {
                expect(actual).to.have.lengthOf(1);
                expect(actual[0].getColumnLabel()).to.equal('foo');
            });
        });

        // Deprecated since release 8.0.22
        it('calls a handlers provided as an `execute` object argument', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });
            const meta = [{ getAlias }];

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
                expect(td.explain(deprecated).callCount).to.equal(1);
            });
        });

        it('fails if an unexpected error is thrown', () => {
            const query = sqlExecute({ _client: { sqlStmtExecute } });
            const error = new Error('foobar');

            td.when(sqlStmtExecute(), { ignoreExtraArgs: true }).thenReject(error);

            return query.execute().catch(err => expect(err).to.deep.equal(error));
        });
    });
});
