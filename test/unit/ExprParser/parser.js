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

// subject under test needs to be reloaded with replacement test doubles
let ExprParser = require('../../../lib/ExprParser');

describe('ExprParser', () => {
    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('parse()', () => {
        it('does nothing if the input string is not defined', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(ExprParser().parse()).to.not.exist;
        });

        it('does nothing if the input string is empty', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(ExprParser().parse('')).to.not.exist;
        });

        it('does nothing if the input string consists only of whitespace', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(ExprParser().parse(' '.repeat(Math.floor(Math.random() * 10 + 1)))).to.not.exist;
        });

        context('when the string contains non-whitespace characters', () => {
            let Parser, parserOptions, tryParse;

            beforeEach('replace dependencies with test doubles', () => {
                Parser = td.replace('../../../lib/ExprParser/lib');
                parserOptions = 'foo';
                tryParse = td.function();

                td.when(Parser(parserOptions)).thenReturn({ tryParse });

                // reload module with the replacements
                ExprParser = require('../../../lib/ExprParser');
            });

            it('trims heading and leading whitespaces before parsing a non-empty string', () => {
                const value = '  bar ';
                const expected = 'bar';

                td.when(tryParse(value.trim())).thenReturn(expected);

                expect(ExprParser(parserOptions).parse(value)).to.equal(expected);
            });
        });
    });
});
