'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('CollectionRemove', () => {
    let collectionRemove, preparing;

    beforeEach('create fakes', () => {
        preparing = td.function();

        td.replace('../../../lib/DevAPI/Preparing', preparing);
        collectionRemove = require('lib/DevAPI/CollectionRemove');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('execute()', () => {
        it('fails if a criteria is not provided', () => {
            const query = collectionRemove();

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `remove()`');
        });

        it('fails if a condition query is empty', () => {
            const query = collectionRemove(null, null, null, '');

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `remove()`');
        });

        it('fails if the condition is not valid', () => {
            const query = collectionRemove(null, null, null, ' ');

            return expect(query.execute()).to.eventually.be.rejectedWith('A valid condition needs to be provided with `remove()`');
        });

        it('wraps the operation in a preparable instance', () => {
            const execute = td.function();
            const session = 'foo';

            td.when(execute(td.matchers.isA(Function))).thenReturn('bar');
            td.when(preparing({ session })).thenReturn({ execute });

            return expect(collectionRemove(session, null, null, 'true').execute()).to.equal('bar');
        });
    });

    context('getClassName()', () => {
        it('returns the correct class name (to avoid duck typing)', () => {
            expect(collectionRemove().getClassName()).to.equal('CollectionRemove');
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

            collectionRemove(session).limit(1);

            return expect(td.explain(forceReprepare).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            const query = collectionRemove(session).limit(1);

            return expect(query.limit).to.be.a('function');
        });

        it('does not set a default offset implicitely', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceReprepare });

            const query = collectionRemove(session).limit(1);

            return expect(query.getOffset()).to.not.exist;
        });
    });

    context('sort()', () => {
        let forceRestart;

        beforeEach('create fakes', () => {
            forceRestart = td.function();
        });

        it('mixes in CollectionOrdering with the proper state', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            collectionRemove(session).sort();

            return expect(td.explain(forceRestart).callCount).equal(1);
        });

        it('is fluent', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const query = collectionRemove(session).sort();

            expect(query.sort).to.be.a('function');
        });

        it('sets the order parameters provided as an array', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = collectionRemove(session).sort(parameters);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });

        it('sets the order parameters provided as multiple arguments', () => {
            const session = 'foo';
            td.when(preparing({ session })).thenReturn({ forceRestart });

            const parameters = ['foo desc', 'bar desc'];
            const query = collectionRemove(session).sort(parameters[0], parameters[1]);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });
    });
});
