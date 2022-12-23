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

const IntegerType = require('../../../lib/Protocol/Wrappers/ScalarValues/int64').Type;
const expect = require('chai').expect;
const td = require('testdouble');
const warnings = require('../../../lib/constants/warnings');

// subject under test needs to be reloaded with replacement fakes
let result = require('../../../lib/DevAPI/Result');

describe('Result', () => {
    let warning;

    beforeEach('create fakes', () => {
        warning = td.function();

        const logger = td.replace('../../../lib/logger');
        td.when(logger('api:result')).thenReturn({ warning });

        result = require('../../../lib/DevAPI/Result');
    });

    context('getAffectedItemsCount()', () => {
        context('when the number of affected items by the statement is below Number.MAX_SAFE_INTEGER', () => {
            it('returns the value as a JavaScript number by default', () => {
                expect(result({ rowsAffected: 3n }).getAffectedItemsCount()).to.equal(3);
            });

            it('can return the value as a JavaScript string', () => {
                expect(result({ rowsAffected: 3n, integerType: IntegerType.STRING }).getAffectedItemsCount()).to.equal('3');
            });

            it('can return the value as a JavaScript BigInt', () => {
                expect(result({ rowsAffected: 3n, integerType: IntegerType.BIGINT }).getAffectedItemsCount()).to.equal(3n);
            });

            it('ignores a specific return type for unsafe integers', () => {
                expect(result({ rowsAffected: 3n, integerType: IntegerType.UNSAFE_BIGINT }).getAffectedItemsCount()).to.equal(3);
                expect(result({ rowsAffected: 3n, integerType: IntegerType.UNSAFE_STRING }).getAffectedItemsCount()).to.equal(3);
            });
        });

        context('when the number of affected items by the statement is above Number.MAX_SAFE_INTEGER', () => {
            it('returns the value as a JavaScript string by default', () => {
                expect(result({ rowsAffected: 18446744073709551615n }).getAffectedItemsCount()).to.equal('18446744073709551615');
            });

            it('returns the value as a JavaScript string if explicitly specified', () => {
                expect(result({ rowsAffected: 18446744073709551615n, integerType: IntegerType.UNSAFE_STRING }).getAffectedItemsCount()).to.equal('18446744073709551615');
            });

            it('can return the value as a JavaScript BigInt', () => {
                expect(result({ rowsAffected: 18446744073709551615n, integerType: IntegerType.BIGINT }).getAffectedItemsCount()).to.equal(18446744073709551615n);
                expect(result({ rowsAffected: 18446744073709551615n, integerType: IntegerType.UNSAFE_BIGINT }).getAffectedItemsCount()).to.equal(18446744073709551615n);
            });
        });
    });

    context('getAffectedRowsCount()', () => {
        it('returns the number of rows affected by the operation', () => {
            expect(result({ rowsAffected: 3n }).getAffectedRowsCount()).to.equal(3);
        });

        it('generates a warning message', () => {
            result().getAffectedRowsCount();

            expect(td.explain(warning).callCount).to.equal(1);
            return expect(td.explain(warning).calls[0].args).to.deep.equal(['getAffectedRowsCount', warnings.MESSAGES.WARN_DEPRECATED_RESULT_GET_AFFECTED_ROWS_COUNT, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
        });
    });

    context('getAutoIncrementValue()', () => {
        context('when the the first value generated by "AUTO INCREMENT" is below Number.MAX_SAFE_INTEGER', () => {
            it('returns the value as a JavaScript number by default', () => {
                expect(result({ generatedInsertId: 1n }).getAutoIncrementValue()).to.equal(1);
            });

            it('can return the value as a JavaScript string', () => {
                expect(result({ generatedInsertId: 1n, integerType: IntegerType.STRING }).getAutoIncrementValue()).to.equal('1');
            });

            it('can return the value as a JavaScript BigInt', () => {
                expect(result({ generatedInsertId: 1n, integerType: IntegerType.BIGINT }).getAutoIncrementValue()).to.equal(1n);
            });

            it('ignores a specific return type for unsafe integers', () => {
                expect(result({ generatedInsertId: 1n, integerType: IntegerType.UNSAFE_BIGINT }).getAutoIncrementValue()).to.equal(1);
                expect(result({ generatedInsertId: 1n, integerType: IntegerType.UNSAFE_STRING }).getAutoIncrementValue()).to.equal(1);
            });
        });

        context('when the the first value generated by "AUTO INCREMENT" is above Number.MAX_SAFE_INTEGER', () => {
            it('returns the value as a JavaScript string by default', () => {
                expect(result({ generatedInsertId: 18446744073709551615n }).getAutoIncrementValue()).to.equal('18446744073709551615');
            });

            it('returns the value as a JavaScript string if explicitly specified', () => {
                expect(result({ generatedInsertId: 18446744073709551615n, integerType: IntegerType.UNSAFE_STRING }).getAutoIncrementValue()).to.equal('18446744073709551615');
            });

            it('can return the value as a JavaScript BigInt', () => {
                expect(result({ generatedInsertId: 18446744073709551615n, integerType: IntegerType.BIGINT }).getAutoIncrementValue()).to.equal(18446744073709551615n);
                expect(result({ generatedInsertId: 18446744073709551615n, integerType: IntegerType.UNSAFE_BIGINT }).getAutoIncrementValue()).to.equal(18446744073709551615n);
            });
        });
    });

    context('getGeneratedIds()', () => {
        it('returns the list of document ids generated by the server for a given operation', () => {
            const generatedDocumentIds = ['foo', 'bar'];

            expect(result({ generatedDocumentIds }).getGeneratedIds()).to.deep.equal(generatedDocumentIds);
        });
    });

    context('getWarnings()', () => {
        it('returns the list of warnings generated by the server for a given operation', () => {
            const warnings = ['foo', 'bar'];

            expect(result({ warnings }).getWarnings()).to.deep.equal(warnings);
        });
    });

    context('getWarningsCount()', () => {
        it('returns the number of warnings generated by the server for a given operation', () => {
            const warnings = ['foo', 'bar', 'baz'];

            expect(result({ warnings }).getWarningsCount()).to.deep.equal(3);
        });
    });
});
