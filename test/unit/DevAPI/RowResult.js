/*
 * Copyright (c) 2018, 2023, Oracle and/or its affiliates.
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
const rowResult = require('../../../lib/DevAPI/RowResult');
const td = require('testdouble');

describe('RowResult', () => {
    let toArray;

    beforeEach('create fakes', () => {
        toArray = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('fetchAll()', () => {
        it('returns an empty array when there are no items in the result set', () => {
            expect(rowResult().fetchAll()).to.deep.equal([]);
            expect(rowResult({ results: undefined }).fetchAll()).to.deep.equal([]);
            expect(rowResult({ results: [] }).fetchAll()).to.deep.equal([]);
            expect(rowResult({ results: [[]] }).fetchAll()).to.deep.equal([]);
            expect(rowResult({ results: [null] }).fetchAll()).to.deep.equal([]);
            expect(rowResult({ results: [[null]] }).fetchAll()).to.deep.equal([]);
        });

        it('returns an array containing the data counterpart of each item in the result set', () => {
            const row = { toArray };
            const rows = ['foo', 'bar'];
            const integerType = 'baz';

            td.when(toArray({ integerType })).thenReturn(rows[1]);
            td.when(toArray({ integerType }), { times: 1 }).thenReturn(rows[0]);

            expect(rowResult({ results: [[row, row]], integerType }).fetchAll()).to.deep.equal(rows);
        });

        it('is aware that fetchOne() might have been used before', () => {
            const row = { toArray };
            const rows = ['foo', 'bar'];
            const integerType = 'baz';

            td.when(toArray({ integerType })).thenReturn(rows[1]);
            td.when(toArray({ integerType }), { times: 1 }).thenReturn(rows[0]);

            const results = [[null, null, row, row]];

            expect(rowResult({ results, integerType }).fetchAll()).to.deep.equal(rows);
        });
    });

    context('fetchOne()', () => {
        it('returns undefined when there are no items in the result set', () => {
            /* eslint-disable no-unused-expressions */
            expect(rowResult().fetchOne()).to.not.exist;
            expect(rowResult({ results: undefined }).fetchOne()).to.not.exist;
            expect(rowResult({ results: [] }).fetchOne()).to.not.exist;
            expect(rowResult({ results: [[]] }).fetchOne()).to.not.exist;
            expect(rowResult({ results: [null] }).fetchOne()).to.not.exist;
            /* eslint-enable no-unused-expressions */
            return expect(rowResult({ results: [[null]] }).fetchOne()).to.not.exist;
        });

        it('returns the next available item in the result set', () => {
            const row = { toArray };
            const rows = [['foo']];
            const integerType = 'bar';

            td.when(toArray({ integerType })).thenReturn(rows[0]);

            expect(rowResult({ results: [[row]], integerType }).fetchOne()).to.equal(rows[0]);
        });

        it('deallocates the memory when a result set item has been consumed', () => {
            const row = { toArray };
            const res = rowResult({ results: [[row, row]] });

            td.when(toArray()).thenReturn(['bar']);
            td.when(toArray(), { times: 1 }).thenReturn(['foo']);

            res.fetchOne();

            const state = res.getResults();
            expect(state).to.be.an('array').and.have.lengthOf(1);
            expect(state[0]).to.be.an('array').and.have.lengthOf(2);
            // eslint-disable-next-line no-unused-expressions
            expect(state[0][0]).to.be.null;
            expect(state[0][1]).to.equal(row);
        });

        it('deallocates the memory when the entire result set has been consumed', () => {
            const row = { toArray };
            const res = rowResult({ results: [[row]] });

            res.fetchOne();

            const state = res.getResults();
            expect(state).to.be.an('array').and.have.lengthOf(1);
            return expect(state[0]).to.be.null;
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
            const res = rowResult({ metadata: [[{ getAlias }, { getAlias }]] });
            const columns = res.getColumns();

            td.when(getAlias()).thenReturn('bar');
            td.when(getAlias(), { times: 1 }).thenReturn('foo');

            expect(columns).to.have.lengthOf(2);
            expect(columns[0]).to.contain.keys('getColumnLabel');
            expect(columns[0].getColumnLabel()).to.equal('foo');
            expect(columns[1]).to.contain.keys('getColumnLabel');
            expect(columns[1].getColumnLabel()).to.equal('bar');
        });

        it('returns an empty list if there is no metadata available in the result set', () => {
            expect(rowResult({ results: undefined }).getColumns()).to.deep.equal([]);
            expect(rowResult({ results: [] }).getColumns()).to.deep.equal([]);
        });
    });

    context('getWarnings()', () => {
        it('returns the list of warnings generated by the server for a given operation', () => {
            const warnings = ['foo', 'bar'];

            expect(rowResult({ warnings }).getWarnings()).to.deep.equal(warnings);
        });
    });

    context('getWarningsCount()', () => {
        it('returns the number of warnings generated by the server for a given operation', () => {
            const warnings = ['foo', 'bar', 'baz'];

            expect(rowResult({ warnings }).getWarningsCount()).to.deep.equal(3);
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
            expect(rowResult().nextResult()).to.be.false;
            expect(rowResult({ results: undefined }).nextResult()).to.be.false;
            expect(rowResult({ results: [] }).nextResult()).to.be.false;
            /* eslint-enable no-unused-expressions */
            return expect(rowResult({ results: [['foo']] }).nextResult()).to.be.false;
        });

        it('returns true if the subsequent result set is empty', () => {
            return expect(rowResult({ results: [['foo'], []] }).nextResult()).to.be.true;
        });

        it('moves the cursor to the next available result set', () => {
            const integerType = 'foo';
            const res = rowResult({ results: [[{ toArray: fstCall }], [{ toArray: sndCall }]], integerType });

            td.when(fstCall({ integerType })).thenReturn(['bar']);
            td.when(sndCall({ integerType })).thenReturn(['baz']);

            // eslint-disable-next-line no-unused-expressions
            expect(res.nextResult()).to.be.true;
            expect(res.fetchOne()).to.deep.equal(['baz']);
        });
    });
});
