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
let DocumentOrJSON = require('../../../lib/DevAPI/DocumentOrJSON');

describe('DocumentOrJSON informal type', () => {
    let Expr, ExprParser, parse;

    beforeEach('replace dependencies with test doubles', () => {
        Expr = td.replace('../../../lib/DevAPI/Expr');
        ExprParser = td.replace('../../../lib/ExprParser');
        parse = td.function();

        td.when(ExprParser({ type: ExprParser.Type.JSON_DOC })).thenReturn({ parse });

        // reload module with the replacements
        DocumentOrJSON = require('../../../lib/DevAPI/DocumentOrJSON');
    });

    context('getValue()', () => {
        it('converts the value to a JavaScript object literal when it is a JSON string', () => {
            const expected = { name: 'foo', signedBigInt: '-9223372036854775808', unsafeDecimal: '9.9999999999999999', unsignedBigInt: '18446744073709551615' };
            const jsonString = `{ "name": "${expected.name}", "signedBigInt": ${expected.signedBigInt}, "unsafeDecimal": ${expected.unsafeDecimal}, "unsignedBigInt": ${expected.unsignedBigInt} }`;

            expect(DocumentOrJSON(jsonString).getValue()).to.deep.equal(expected);
        });

        it('parses the value when it is an X DevAPI expression instance', () => {
            const expected = 'foo';
            const exprString = 'bar';
            const exprInstance = { getExpressionString: () => exprString };

            const instance = DocumentOrJSON(exprInstance);
            const isLiteral = td.replace(instance, 'isLiteral');

            td.when(isLiteral()).thenReturn(false);
            td.when(Expr({ value: exprInstance })).thenReturn(exprInstance);
            td.when(parse(exprString)).thenReturn(expected);

            expect(instance.getValue()).to.equal(expected);
        });

        it('returns the value itself when it is already a JavaScript object literal', () => {
            const expected = { name: 'foo' };

            const instance = DocumentOrJSON(expected);
            const isLiteral = td.replace(instance, 'isLiteral');

            td.when(isLiteral()).thenReturn(true);

            expect(instance.getValue()).to.deep.equal(expected);
        });
    });

    context('isLiteral()', () => {
        it('checks if the value is a literal from the expression standpoint', () => {
            const value = 'foo';
            const isLiteral = td.function();

            td.when(Expr({ value })).thenReturn({ isLiteral });
            td.when(isLiteral()).thenReturn(true);

            // eslint-disable-next-line no-unused-expressions
            expect(DocumentOrJSON(value).isLiteral()).to.be.true;

            td.when(isLiteral()).thenReturn(false);
            return expect(DocumentOrJSON(value).isLiteral()).to.be.false;
        });
    });
});
