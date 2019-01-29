'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const td = require('testdouble');
const updating = require('lib/DevAPI/Updating');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('TableUpdate', () => {
    let tableUpdate, preparing;

    beforeEach('create fakes', () => {
        preparing = td.function();

        td.replace('../../../lib/DevAPI/Preparing', preparing);
        tableUpdate = require('lib/DevAPI/TableUpdate');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        it('fails if a condition query is not provided', () => {
            const query = tableUpdate();

            return expect(query.execute()).to.eventually.be.rejectedWith('An explicit criteria needs to be provided using where().');
        });

        it('fails if a condition query is empty', () => {
            const query = tableUpdate(null, null, null, '');

            return expect(query.execute()).to.eventually.be.rejectedWith('An explicit criteria needs to be provided using where().');
        });

        it('fails if a condition query is not valid', () => {
            const query = tableUpdate(null, null, null, ' ');

            return expect(query.execute()).to.eventually.be.rejectedWith('An explicit criteria needs to be provided using where().');
        });

        it('wraps the operation in a preparable instance', () => {
            const execute = td.function();
            const session = 'foo';

            td.when(execute(td.matchers.isA(Function))).thenReturn('bar');
            td.when(preparing({ session })).thenReturn({ execute });

            return expect(tableUpdate(session, null, null, 'true').execute()).to.equal('bar');
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
