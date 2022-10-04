/*
 * Copyright (c) 2022, Oracle and/or its affiliates.
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
let SortExprStr = require('../../../lib/DevAPI/SortExprStr');

describe('SortExprStr informal type', () => {
    let ExprParser, parseInDocumentMode, parseInTableMode;

    beforeEach('replace dependencies with test doubles', () => {
        ExprParser = td.replace('../../../lib/ExprParser');

        parseInDocumentMode = td.function();
        parseInTableMode = td.function();

        td.when(ExprParser({ type: ExprParser.Type.SORT_EXPR })).thenReturn({ parse: parseInDocumentMode });
        td.when(ExprParser({ mode: ExprParser.Mode.TABLE, type: ExprParser.Type.SORT_EXPR })).thenReturn({ parse: parseInTableMode });

        // reload module with the replacements
        SortExprStr = require('../../../lib/DevAPI/SortExprStr');
    });

    context('getValue()', () => {
        it('parses the value using the SorExpr parser in document mode by default', () => {
            const sortExpr = 'foo';
            const expected = 'bar';

            td.when(parseInDocumentMode(sortExpr)).thenReturn(expected);

            expect(SortExprStr({ value: sortExpr }).getValue()).to.equal(expected);
            expect(td.explain(parseInTableMode).callCount).to.equal(0);
        });

        it('parses the value using the SorExpr parser in table mode when specified', () => {
            const dataModel = ExprParser.Mode.TABLE;
            const sortExpr = 'bar';
            const expected = 'baz';

            td.when(parseInTableMode(sortExpr)).thenReturn(expected);

            expect(SortExprStr({ dataModel, value: sortExpr }).getValue()).to.equal(expected);
            expect(td.explain(parseInDocumentMode).callCount).to.equal(0);
        });
    });
});
