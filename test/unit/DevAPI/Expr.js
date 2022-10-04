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

const { DataModel } = require('../../../lib/Protocol/Stubs/mysqlx_crud_pb');
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with test doubles
let Expr = require('../../../lib/DevAPI/Expr');

describe('Expr informal type', () => {
    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('getExpressionString()', () => {
        it('returns the original string encapsulated by the X DevAPI expression instance', () => {
            const value = 'foo';
            let expr = Expr({ value });
            let isLiteral = td.replace(expr, 'isLiteral');

            td.when(isLiteral()).thenReturn(true);
            expect(expr.getExpressionString()).to.equal(value);

            expr = Expr({ value: expr });
            isLiteral = td.replace(expr, 'isLiteral');

            td.when(isLiteral()).thenReturn(false);
            expect(expr.getExpressionString()).to.equal(value);
        });
    });

    context('getValue()', () => {
        let ExprParser, parseTableModeExpr, parseDocumentModeExpr;

        beforeEach('replace dependencies with test doubles', () => {
            ExprParser = td.replace('../../../lib/ExprParser');
            parseDocumentModeExpr = td.function();
            parseTableModeExpr = td.function();

            td.when(ExprParser()).thenReturn({ parse: parseDocumentModeExpr });
            td.when(ExprParser({ mode: DataModel.TABLE })).thenReturn({ parse: parseTableModeExpr });

            // reload module with the replacements
            Expr = require('../../../lib/DevAPI/Expr');
        });

        it('returns a parsed version of a projection expression string in the DOCUMENT data model by default', () => {
            const value = 'foo';
            const expr = Expr();
            const getExpressionString = td.replace(expr, 'getExpressionString');
            const parsedValue = 'bar';

            td.when(getExpressionString()).thenReturn(value);
            td.when(parseDocumentModeExpr(value)).thenReturn(parsedValue);

            expect(expr.getValue()).to.equal(parsedValue);
        });
    });

    context('isLiteral()', () => {
        it('checks whether the underlying value of the expression instance is a literal or an expression instance itself', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(Expr({ value: 'foo' }).isLiteral()).to.be.true;
            return expect(Expr({ value: Expr({ value: 'foo' }) }).isLiteral()).to.be.false;
        });
    });
});
