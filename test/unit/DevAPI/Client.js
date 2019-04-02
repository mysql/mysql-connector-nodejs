'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const client = require('../../../lib/DevAPI/Client');
const td = require('testdouble');

describe('DevAPI Client', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('factory', () => {
        it('throws an error when unknown options are provided', () => {
            expect(() => client({ foo: 'bar' })).to.throw(`Client option 'foo' is not recognized as valid.`);
        });

        it('throws an error when invalid option values are provided', () => {
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

        it('retrieves a connection from the pool', () => {
            const options = { pool: { acquire, start }, uri: { name: 'foo' } };
            const cli = client(options);

            td.when(start(options.uri)).thenReturn();
            td.when(acquire()).thenResolve('bar');

            return cli.getSession()
                .then(actual => {
                    expect(actual).to.equal('bar');
                    expect(td.explain(start).callCount).to.equal(1);
                    expect(td.explain(start).calls[0].args).to.deep.equal([options.uri]);
                });
        });

        it('fails if the pool has been destroyed', () => {
            const pool = { destroy };
            const cli = client({ pool });
            const error = 'Cannot retrieve a connection from the pool. Maybe it has been destroyed already.';

            td.when(destroy()).thenResolve();

            return cli.close()
                .then(() => cli.getSession())
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.deep.equal(error));
        });
    });

    context('close()', () => {
        let destroy;

        beforeEach('create fakes', () => {
            destroy = td.function();
        });

        it('destroys the existing pool reference', () => {
            const pool = { destroy };
            const cli = client({ pool });

            td.when(destroy()).thenResolve();

            return cli.close()
                .then(() => expect(td.explain(destroy).callCount).to.equal(1));
        });

        it('fails if the pool has been destroyed', () => {
            const pool = { destroy };
            const cli = client({ pool });
            const error = 'Cannot close the pool. Maybe it has been destroyed already.';

            td.when(destroy()).thenResolve();

            return cli.close()
                .then(() => cli.close())
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.deep.equal(error));
        });
    });
});
