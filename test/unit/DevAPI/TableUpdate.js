'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');
const updating = require('../../../lib/DevAPI/Updating');

describe('TableUpdate', () => {
    let tableUpdate, preparing;

    beforeEach('create fakes', () => {
        preparing = td.function();

        td.replace('../../../lib/DevAPI/Preparing', preparing);
        tableUpdate = require('../../../lib/DevAPI/TableUpdate');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        it('fails if a filtering criteria expression is not provided', () => {
            return tableUpdate().execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
        });

        it('fails if the filtering criteria expression is empty', () => {
            return tableUpdate(null, null, null, '').execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
        });

        it('fails if the filtering criteria expression is not valid', () => {
            tableUpdate(null, null, null, ' ').execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
        });

        it('fails if the filtering criteria expression is undefined', () => {
            const session = 'foo';
            const forceRestart = td.function();

            td.when(preparing({ session })).thenReturn({ forceRestart });

            return tableUpdate(session).where().execute()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('An explicit criteria needs to be provided using where().'));
        });

        it('wraps the operation in a preparable instance', () => {
            const execute = td.function();
            const session = 'foo';
            const expected = ['bar'];
            const state = { warnings: expected };

            td.when(execute(td.matchers.isA(Function))).thenResolve(state);
            td.when(preparing({ session })).thenReturn({ execute });

            return tableUpdate(session, null, null, 'true').execute()
                .then(actual => expect(actual.getWarnings()).to.deep.equal(expected));
        });
    });

    context('getClassName()', () => {
        it('returns the correct class name (to avoid duck typing)', () => {
            expect(tableUpdate().getClassName()).to.equal('TableUpdate');
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

            tableUpdate(session).limit(1);

            return expect(td.explain(forceReprepare).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            const query = tableUpdate(session).limit(1);

            return expect(query.limit).to.be.a('function');
        });

        it('does not set a default offset implicitely', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            const query = tableUpdate(session).limit(1);

            return expect(query.getOffset()).to.not.exist;
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

            tableUpdate(session).orderBy();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = tableUpdate(session).orderBy();

            expect(query.orderBy).to.be.a('function');
        });

        it('sets the order parameters provided as an array', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = tableUpdate(session).orderBy(parameters);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });

        it('sets the order parameters provided as multiple arguments', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = tableUpdate(session).orderBy(parameters[0], parameters[1]);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });
    });

    context('set()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('forces the statement to be reprepared', () => {
            const session = 'foo';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            tableUpdate(session).set('bar', 'baz');

            return expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('updates the operation list with the correct operation', () => {
            const session = 'foo';
            const expected = [{ source: 'bar', type: updating.Operation.SET, value: 'baz' }];

            td.when(preparing({ session })).thenReturn({ forceRestart });

            return expect(tableUpdate(session).set('bar', 'baz').getOperations()).to.deep.equal(expected);
        });

        it('does not delete any previously added operation', () => {
            const session = 'foo';
            const existing = [{ foo: 'bar' }];
            const expected = existing.concat([{ source: 'bar', type: updating.Operation.SET, value: 'baz' }]);

            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = tableUpdate(session);

            return expect(query.setOperations(existing).set('bar', 'baz').getOperations()).to.deep.equal(expected);
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

            tableUpdate(session).where();

            expect(td.explain(forceRestart).callCount).to.equal(1);
        });

        it('sets the query criteria', () => {
            const session = 'foo';
            const criteria = 'bar';

            td.when(preparing({ session })).thenReturn({ forceRestart });

            expect(tableUpdate(session).where(criteria).getCriteria()).to.equal(criteria);
        });

        it('resets any existing query criteria expression', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const stmt = tableUpdate(session);
            const setCriteriaExpr = td.replace(stmt, 'setCriteriaExpr');

            stmt.where();

            expect(td.explain(setCriteriaExpr).callCount).to.equal(1);
            return expect(td.explain(setCriteriaExpr).calls[0].args).to.be.empty;
        });
    });
});
