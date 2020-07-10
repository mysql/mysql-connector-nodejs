'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

describe('TableSelect', () => {
    let preparing, tableSelect, toArray;

    beforeEach('create fakes', () => {
        preparing = td.function();
        toArray = td.function();

        td.replace('../../../lib/DevAPI/Preparing', preparing);
        tableSelect = require('../../../lib/DevAPI/TableSelect');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        let columnWrapper, execute, getAlias;

        beforeEach('create fakes', () => {
            columnWrapper = td.function();
            execute = td.function();
            getAlias = td.function();

            td.replace('../../../lib/DevAPI/Util/columnWrapper', columnWrapper);
            tableSelect = require('../../../lib/DevAPI/TableSelect');
        });

        it('wraps an operation without a cursor in a preparable instance', () => {
            const session = 'foo';
            const row = { toArray };
            const state = { results: [[row]] };

            td.when(toArray()).thenReturn(['bar']);
            td.when(execute(td.matchers.isA(Function), undefined, undefined)).thenResolve(state);
            td.when(preparing({ session })).thenReturn({ execute });

            return tableSelect(session).execute()
                .then(actual => expect(actual.fetchOne()).to.deep.equal(['bar']));
        });

        it('wraps an operation with a data cursor in a preparable instance', () => {
            const session = 'foo';
            const expected = ['bar'];
            const state = { warnings: expected };

            td.when(execute(td.matchers.isA(Function), 'foo', undefined)).thenResolve(state);
            td.when(preparing({ session })).thenReturn({ execute });

            return tableSelect(session).execute('foo')
                .then(actual => expect(actual.getWarnings()).to.deep.equal(expected));
        });

        it('wraps an operation with both a data and metadata cursors in a preparable instance', () => {
            const session = 'foo';
            const expected = { getAlias };
            const state = { metadata: [[expected]] };

            td.when(getAlias()).thenReturn('qux');
            td.when(columnWrapper('bar')).thenReturn('baz');
            td.when(execute(td.matchers.isA(Function), 'foo', 'baz')).thenResolve(state);
            td.when(preparing({ session })).thenReturn({ execute });

            return tableSelect(session).execute('foo', 'bar')
                .then(actual => expect(actual.getColumns()[0].getColumnLabel()).to.equal('qux'));
        });
    });

    context('groupBy()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in Grouping with the proper state', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            tableSelect(session).groupBy();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = tableSelect(session).groupBy();

            expect(query.groupBy).to.be.a('function');
        });

        it('returns a Result instance containing the operation details');

        it('sets the grouping columns provided as an array', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const grouping = ['foo', 'bar'];
            const query = tableSelect(session).groupBy(grouping);

            expect(query.getGroupings()).to.deep.equal(grouping);
        });

        it('sets the grouping columns provided as an array', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const grouping = ['foo', 'bar'];
            const query = tableSelect(session).groupBy(grouping[0], grouping[1]);

            expect(query.getGroupings()).to.deep.equal(grouping);
        });
    });

    context('limit()', () => {
        let forceReprepare;

        beforeEach('create fakes', () => {
            forceReprepare = td.function();
        });

        it('mixes in Limiting with the proper state', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            tableSelect(session).limit(1);

            return expect(td.explain(forceReprepare).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            const query = tableSelect(session).limit(1);

            return expect(query.limit).to.be.a('function');
        });

        it('sets a default offset implicitely', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            const query = tableSelect(session).limit(1);

            return expect(query.getOffset()).to.equal(0);
        });
    });

    context('lockShared()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in Locking with the proper state', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            tableSelect(session).lockShared();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = tableSelect(session).groupBy();

            expect(query.lockShared).to.be.a('function');
        });
    });

    context('lockExclusive()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in Locking with the proper state', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            tableSelect(session).lockExclusive();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = tableSelect(session).groupBy();

            expect(query.lockExclusive).to.be.a('function');
        });
    });

    context('orderBy()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in TableOrdering with the proper state', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            tableSelect(session).orderBy();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = tableSelect(session).orderBy();

            expect(query.orderBy).to.be.a('function');
        });

        it('sets the order parameters provided as an array', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = tableSelect(session).orderBy(parameters);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });

        it('sets the order parameters provided as multiple arguments', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = tableSelect(session).orderBy(parameters[0], parameters[1]);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });
    });

    context('where()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in TableFiltering with the proper state', () => {
            const session = 'foo';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            tableSelect(session).where();

            expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('sets the query criteria', () => {
            const session = 'foo';
            const criteria = 'bar';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            expect(tableSelect(session).where(criteria).getCriteria()).to.equal(criteria);
        });
    });
});
