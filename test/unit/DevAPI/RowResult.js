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

            td.when(toArray()).thenReturn(rows[1]);
            td.when(toArray(), { times: 1 }).thenReturn(rows[0]);

            expect(rowResult({ results: [[row, row]] }).fetchAll()).to.deep.equal(rows);
        });

        it('is aware that fetchOne() might have been used before', () => {
            const row = { toArray };
            const rows = ['foo', 'bar'];

            td.when(toArray()).thenReturn(rows[1]);
            td.when(toArray(), { times: 1 }).thenReturn(rows[0]);

            const results = [[null, null, row, row]];

            expect(rowResult({ results }).fetchAll()).to.deep.equal(rows);
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

            td.when(toArray()).thenReturn(rows[0]);

            expect(rowResult({ results: [[row]] }).fetchOne()).to.equal(rows[0]);
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

    context('getAffectedItemsCount()', () => {
        it('returns the same result as getAffectedRowsCount()', () => {
            expect(rowResult({ rowsAffected: 3 }).getAffectedItemsCount()).to.equal(3);
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
            const res = rowResult({ results: [[{ toArray: fstCall }], [{ toArray: sndCall }]] });

            td.when(fstCall()).thenReturn(['foo']);
            td.when(sndCall()).thenReturn(['bar']);

            // eslint-disable-next-line no-unused-expressions
            expect(res.nextResult()).to.be.true;
            expect(res.fetchOne()).to.deep.equal(['bar']);
        });
    });
});
