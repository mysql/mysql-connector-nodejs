'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const client = require('lib/DevAPI/Client');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('DevAPI Client', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('factory', () => {
        it('should throw an error when unknown options are provided', () => {
            expect(() => client({ foo: 'bar' })).to.throw(`Client option 'foo' is not recognized as valid.`);
        });

        it('should throw an error when invalid option values are provided', () => {
            const nonObjects = [undefined, true, false, 1, 2.2, 'foo', [], () => {}];

            nonObjects.forEach(invalid => {
                expect(() => client({ pooling: invalid })).to.throw(`Client option 'pooling' does not support value '${invalid}'.`);
            });
        });
    });

    context('getSession()', () => {
        let acquire, destroy, start;

        beforeEach('create fakes', () => {
            acquire = td.function();
            destroy = td.function();
            start = td.function();
        });

        it('should retrieve a connection from the pool', () => {
            const options = { pool: { acquire, start }, uri: { name: 'foo' } };
            const cli = client(options);

            td.when(start(options.uri)).thenReturn();
            td.when(acquire()).thenResolve('bar');

            return expect(cli.getSession()).to.eventually.equal('bar')
                .then(() => {
                    expect(td.explain(start).callCount).to.equal(1);
                    expect(td.explain(start).calls[0].args).to.deep.equal([options.uri]);
                });
        });

        it('should fail if the pool has been destroyed', () => {
            const pool = { destroy };
            const cli = client({ pool });
            const error = 'Cannot retrieve a connection from the pool. Maybe it has been destroyed already.';

            td.when(destroy()).thenResolve();

            return expect(cli.close()).to.be.fulfilled
                .then(() => {
                    return expect(cli.getSession()).to.be.rejectedWith(error);
                });
        });
    });

    context('close()', () => {
        let destroy;

        beforeEach('create fakes', () => {
            destroy = td.function();
        });

        it('should destroy the existing pool reference', () => {
            const pool = { destroy };
            const cli = client({ pool });

            td.when(destroy()).thenResolve();

            return expect(cli.close()).to.be.fulfilled
                .then(() => {
                    expect(td.explain(destroy).callCount).to.equal(1);
                });
        });

        it('should fail if the pool has been destroyed', () => {
            const pool = { destroy };
            const cli = client({ pool });
            const error = 'Cannot close the pool. Maybe it has been destroyed already.';

            td.when(destroy()).thenResolve();

            return expect(cli.close()).to.be.fulfilled
                .then(() => {
                    return expect(cli.close()).to.be.rejectedWith(error);
                });
        });
    });
});
