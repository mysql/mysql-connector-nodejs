/*
 * Copyright (c) 2018, 2022, Oracle and/or its affiliates.
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

// subject under test needs to be reloaded with test doubles
let Grouping = require('../../../lib/DevAPI/Grouping');

describe('Grouping mixin', () => {
    let Expr;

    beforeEach('replace dependencies with test doubles', () => {
        Expr = td.replace('../../../lib/DevAPI/Expr');
        // reload module with the replacements
        Grouping = require('../../../lib/DevAPI/Grouping');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('groupBy()', () => {
        it('appends parsed order expressions provided as multiple arguments to the statement aggregation list', () => {
            const dataModel = 'foo';
            const forceRestart = td.function();
            const getValue = td.function();
            const groupingList = ['bar'];
            const searchExprStrList = ['baz', 'qux'];
            const searchExprList = ['quux', 'quuz'];
            const expected = [...groupingList, ...searchExprList];
            // Adds order expressions beforehand to ensure those are not removed.
            const statement = Grouping({ dataModel, groupingList, preparable: { forceRestart } });

            td.when(Expr({ dataModel, value: searchExprStrList[0] })).thenReturn({ getValue });
            td.when(Expr({ dataModel, value: searchExprStrList[1] })).thenReturn({ getValue });
            td.when(getValue()).thenReturn(searchExprList[1]);
            td.when(getValue(), { times: 1 }).thenReturn(searchExprList[0]);

            statement.groupBy(searchExprStrList[0], searchExprStrList[1]);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(groupingList).to.deep.equal(expected);
        });

        it('appends parsed order expressions provided as an array to the statement aggregation list', () => {
            const dataModel = 'foo';
            const forceRestart = td.function();
            const getValue = td.function();
            const groupingList = ['bar'];
            const searchExprStrList = ['baz', 'qux'];
            const searchExprList = ['quux', 'quuz'];
            const expected = [...groupingList, ...searchExprList];
            // Adds order expressions beforehand to ensure those are not removed.
            const statement = Grouping({ dataModel, groupingList, preparable: { forceRestart } });

            td.when(Expr({ dataModel, value: searchExprStrList[0] })).thenReturn({ getValue });
            td.when(Expr({ dataModel, value: searchExprStrList[1] })).thenReturn({ getValue });
            td.when(getValue()).thenReturn(searchExprList[1]);
            td.when(getValue(), { times: 1 }).thenReturn(searchExprList[0]);

            statement.groupBy(searchExprStrList[0], searchExprStrList[1]);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(groupingList).to.deep.equal(expected);
        });
    });

    context('having()', () => {
        it('sets the statement aggregation criteria', () => {
            const dataModel = 'foo';
            const forceRestart = td.function();
            const getValue = td.function();
            const constraints = { criteria: 'bar' };
            const criteria = 'baz';
            const expected = { criteria };
            const searchConditionStr = 'qux';
            // Set an existing criteria to ensure it is replaced.
            const statement = Grouping({ constraints, dataModel, preparable: { forceRestart } });

            td.when(Expr({ dataModel, value: searchConditionStr })).thenReturn({ getValue });
            td.when(getValue()).thenReturn(criteria);

            statement.having(searchConditionStr);

            // If it is a prepared statement, it needs to be prepared again
            // because the boundaries have changed.
            expect(td.explain(forceRestart).callCount).to.equal(1);

            expect(constraints).to.deep.equal(expected);
        });
    });
});
