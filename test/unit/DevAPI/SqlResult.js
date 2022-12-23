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
const sqlResult = require('../../../lib/DevAPI/SqlResult');
const td = require('testdouble');

describe('SqlResult', () => {
    let toArray;

    beforeEach('create fakes', () => {
        toArray = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('fetchAll()', () => {
        it('returns an empty array when there are no items in the result set', () => {
            expect(sqlResult().fetchAll()).to.deep.equal([]);
            expect(sqlResult({ results: undefined }).fetchAll()).to.deep.equal([]);
            expect(sqlResult({ results: [] }).fetchAll()).to.deep.equal([]);
            expect(sqlResult({ results: [[]] }).fetchAll()).to.deep.equal([]);
        });

        it('returns an array containing the data counterpart of each item in the result set', () => {
            const integerType = 'foo';
            const row = { toArray };
            const rows = ['bar', 'baz'];

            td.when(toArray({ integerType })).thenReturn(rows[1]);
            td.when(toArray({ integerType }), { times: 1 }).thenReturn(rows[0]);

            expect(sqlResult({ results: [[row, row]], integerType }).fetchAll()).to.deep.equal(rows);
        });
    });

    context('fetchOne()', () => {
        it('returns undefined when there are no items in the result set', () => {
            /* eslint-disable no-unused-expressions */
            expect(sqlResult().fetchOne()).to.not.exist;
            expect(sqlResult({ results: undefined }).fetchOne()).to.not.exist;
            expect(sqlResult({ results: [] }).fetchOne()).to.not.exist;
            /* eslint-enable no-unused-expressions */
            return expect(sqlResult({ results: [[]] }).fetchOne()).to.not.exist;
        });

        it('returns the next available item in the result set', () => {
            const integerType = 'foo';
            const row = { toArray };
            const rows = [['bar']];

            td.when(toArray({ integerType })).thenReturn(rows[0]);

            expect(sqlResult({ results: [[row]], integerType }).fetchOne()).to.equal(rows[0]);
        });
    });

    context('getAffectedItemsCount()', () => {
        context('when the number of affected items by the statement is below Number.MAX_SAFE_INTEGER', () => {
            it('returns the value as a JavaScript number by default', () => {
                expect(sqlResult({ rowsAffected: 3n }).getAffectedItemsCount()).to.equal(3);
            });

            it('can return the value as a JavaScript string', () => {
                expect(sqlResult({ rowsAffected: 3n, integerType: IntegerType.STRING }).getAffectedItemsCount()).to.equal('3');
            });

            it('can return the value as a JavaScript BigInt', () => {
                expect(sqlResult({ rowsAffected: 3n, integerType: IntegerType.BIGINT }).getAffectedItemsCount()).to.equal(3n);
            });

            it('ignores a specific return type for unsafe integers', () => {
                expect(sqlResult({ rowsAffected: 3n, integerType: IntegerType.UNSAFE_BIGINT }).getAffectedItemsCount()).to.equal(3);
                expect(sqlResult({ rowsAffected: 3n, integerType: IntegerType.UNSAFE_STRING }).getAffectedItemsCount()).to.equal(3);
            });
        });

        context('when the number of affected items by the statement is above Number.MAX_SAFE_INTEGER', () => {
            it('returns the value as a JavaScript string by default', () => {
                expect(sqlResult({ rowsAffected: 18446744073709551615n }).getAffectedItemsCount()).to.equal('18446744073709551615');
            });

            it('returns the value as a JavaScript string if explicitly specified', () => {
                expect(sqlResult({ rowsAffected: 18446744073709551615n, integerType: IntegerType.UNSAFE_STRING }).getAffectedItemsCount()).to.equal('18446744073709551615');
            });

            it('can return the value as a JavaScript BigInt', () => {
                expect(sqlResult({ rowsAffected: 18446744073709551615n, integerType: IntegerType.BIGINT }).getAffectedItemsCount()).to.equal(18446744073709551615n);
                expect(sqlResult({ rowsAffected: 18446744073709551615n, integerType: IntegerType.UNSAFE_BIGINT }).getAffectedItemsCount()).to.equal(18446744073709551615n);
            });
        });
    });

    context('getAutoIncrementValue()', () => {
        context('when the the first value generated by "AUTO INCREMENT" is below Number.MAX_SAFE_INTEGER', () => {
            it('returns the value as a JavaScript number by default', () => {
                expect(sqlResult({ generatedInsertId: 1n }).getAutoIncrementValue()).to.equal(1);
            });

            it('can return the value as a JavaScript string', () => {
                expect(sqlResult({ generatedInsertId: 1n, integerType: IntegerType.STRING }).getAutoIncrementValue()).to.equal('1');
            });

            it('can return the value as a JavaScript BigInt', () => {
                expect(sqlResult({ generatedInsertId: 1n, integerType: IntegerType.BIGINT }).getAutoIncrementValue()).to.equal(1n);
            });

            it('ignores a specific return type for unsafe integers', () => {
                expect(sqlResult({ generatedInsertId: 1n, integerType: IntegerType.UNSAFE_BIGINT }).getAutoIncrementValue()).to.equal(1);
                expect(sqlResult({ generatedInsertId: 1n, integerType: IntegerType.UNSAFE_STRING }).getAutoIncrementValue()).to.equal(1);
            });
        });

        context('when the the first value generated by "AUTO INCREMENT" is above Number.MAX_SAFE_INTEGER', () => {
            it('returns the value as a JavaScript string by default', () => {
                expect(sqlResult({ generatedInsertId: 18446744073709551615n }).getAutoIncrementValue()).to.equal('18446744073709551615');
            });

            it('returns the value as a JavaScript string if explicitly specified', () => {
                expect(sqlResult({ generatedInsertId: 18446744073709551615n, integerType: IntegerType.UNSAFE_STRING }).getAutoIncrementValue()).to.equal('18446744073709551615');
            });

            it('can return the value as a JavaScript BigInt', () => {
                expect(sqlResult({ generatedInsertId: 18446744073709551615n, integerType: IntegerType.BIGINT }).getAutoIncrementValue()).to.equal(18446744073709551615n);
                expect(sqlResult({ generatedInsertId: 18446744073709551615n, integerType: IntegerType.UNSAFE_BIGINT }).getAutoIncrementValue()).to.equal(18446744073709551615n);
            });
        });
    });

    context('getColumns()', () => {
        let getAlias;

        beforeEach('create fakes', () => {
            getAlias = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('returns the metadata for each item in the result set wrapped as a Column instance', () => {
            const res = sqlResult({ metadata: [[{ getAlias }, { getAlias }]] });
            const columns = res.getColumns();

            td.when(getAlias()).thenReturn('bar');
            td.when(getAlias(), { times: 1 }).thenReturn('foo');

            expect(columns).to.have.lengthOf(2);
            expect(columns[0]).to.contain.keys('getColumnLabel');
            expect(columns[0].getColumnLabel()).to.equal('foo');
            expect(columns[1]).to.contain.keys('getColumnLabel');
            expect(columns[1].getColumnLabel()).to.equal('bar');
        });
    });

    context('getWarnings()', () => {
        it('returns the list of warnings generated by the server for a given operation', () => {
            const warnings = ['foo', 'bar'];

            expect(sqlResult({ warnings }).getWarnings()).to.deep.equal(warnings);
        });
    });

    context('getWarningsCount()', () => {
        it('returns the number of warnings generated by the server for a given operation', () => {
            const warnings = ['foo', 'bar', 'baz'];

            expect(sqlResult({ warnings }).getWarningsCount()).to.deep.equal(3);
        });
    });

    context('hasData()', () => {
        it('returns false if the result set does not contain any item', () => {
            // eslint-disable-next-line no-unused-expressions
            expect(sqlResult().hasData()).to.be.false;
            return expect(sqlResult({ results: [] }).hasData()).to.be.false;
        });

        it('returns true if the result set contains items', () => {
            return expect(sqlResult({ results: [[{ data: 'foo' }]] }).hasData()).to.be.true;
        });
    });

    context('nextResult()', () => {
        let fstCall, sndCall;

        beforeEach('create fakes', () => {
            fstCall = td.function();
            sndCall = td.function();
        });

        it('returns false if there are no other result sets available', () => {
            /* eslint-disable no-unused-expressions */
            expect(sqlResult().nextResult()).to.be.false;
            expect(sqlResult({ results: undefined }).nextResult()).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(sqlResult({ results: [] }).nextResult()).to.be.false;
        });

        it('moves the cursor to the next available result set', () => {
            const integerType = 'foo';
            const res = sqlResult({ results: [[{ toArray: fstCall }], [{ toArray: sndCall }]], integerType });

            td.when(fstCall({ integerType })).thenReturn(['bar']);
            td.when(sndCall({ integerType })).thenReturn(['baz']);

            // eslint-disable-next-line no-unused-expressions
            expect(res.nextResult()).to.be.true;
            expect(res.fetchOne()).to.deep.equal(['baz']);
        });
    });
});
