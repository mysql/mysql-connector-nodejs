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
let ProjectedDocumentExprStr = require('../../../lib/DevAPI/ProjectedDocumentExprStr');

describe('ProjectedDocumentExprStr informal type', () => {
    let Expr, ExprParser, parse;

    beforeEach('replace dependencies with test doubles', () => {
        Expr = td.replace('../../../lib/DevAPI/Expr');
        ExprParser = td.replace('../../../lib/ExprParser');
        parse = td.function();

        td.when(ExprParser({ type: ExprParser.Type.PROJECTED_SEARCH_EXPR })).thenReturn({ parse });

        // reload module with the replacements
        ProjectedDocumentExprStr = require('../../../lib/DevAPI/ProjectedDocumentExprStr');
    });

    context('getValue()', () => {
        it('returns a parsed version of a projection expression using the default alias if one is not provided', () => {
            const projectedDocumentExpr = 'foo';
            const getExpressionString = () => projectedDocumentExpr;
            const source = { type: 'bar' };
            const expected = { source, alias: projectedDocumentExpr };

            td.when(Expr({ value: projectedDocumentExpr })).thenReturn({ getExpressionString });
            td.when(parse(projectedDocumentExpr)).thenReturn({ source });

            expect(ProjectedDocumentExprStr(projectedDocumentExpr).getValue()).to.deep.equal(expected);
        });

        it('returns a parsed version of a projection expression using a custom alias', () => {
            const alias = 'foo';
            const projectedDocumentExpr = 'bar';
            const getExpressionString = () => projectedDocumentExpr;
            const source = { type: 'baz' };
            const expected = { source, alias };

            td.when(Expr({ value: projectedDocumentExpr })).thenReturn({ getExpressionString });
            td.when(parse(projectedDocumentExpr)).thenReturn({ source, alias });

            expect(ProjectedDocumentExprStr(projectedDocumentExpr).getValue()).to.deep.equal(expected);
        });

        it('returns a parsed version of computed projection expression without any alias', () => {
            const projectedDocumentExpr = 'foo';
            const getExpressionString = () => projectedDocumentExpr;
            const source = { type: 'jsonDoc' };
            const expected = { source };

            td.when(Expr({ value: projectedDocumentExpr })).thenReturn({ getExpressionString });
            td.when(parse(projectedDocumentExpr)).thenReturn({ source });

            expect(ProjectedDocumentExprStr(projectedDocumentExpr).getValue()).to.deep.equal(expected);
        });
    });
});
