'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const expect = require('chai').expect;
const tableSelect = require('lib/DevAPI/TableSelect');
const td = require('testdouble');
const proxyquire = require('proxyquire');

describe('TableSelect', () => {
    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(tableSelect().getClassName()).to.equal('TableSelect');
        });
    });

    context('lockShared()', () => {
        it('should include the method', () => {
            expect(tableSelect().lockShared).to.be.a('function');
        });
    });

    context('lockExclusive()', () => {
        it('should include the method', () => {
            expect(tableSelect().lockExclusive).to.be.a('function');
        });
    });

    context('execute()', () => {
        let crudFind;

        beforeEach('create fakes', () => {
            crudFind = td.function();
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        it('should pass itself to the client implementation', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = tableSelect({ _client: { crudFind } });

            td.when(crudFind(query, undefined, undefined)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should use a custom cursor to handle result set data', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = tableSelect({ _client: { crudFind } });
            const sideEffects = [];
            const callback = value => sideEffects.push(value);

            td.when(crudFind(query, td.callback('foo'), undefined)).thenResolve(state);

            return expect(query.execute(callback)).to.eventually.deep.equal(expected).then(() => {
                return expect(sideEffects).to.deep.equal(['foo']);
            });
        });

        it('should use a custom cursor to handle operation metadata', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const metaCB = td.function();
            const tableSelectDouble = proxyquire('lib/DevAPI/TableSelect', { './Column': { metaCB } });
            const query = tableSelectDouble({ _client: { crudFind } });
            const callback = 'foo';

            td.when(metaCB(callback)).thenReturn('bar');
            td.when(crudFind(query, null, 'bar')).thenResolve(state);

            return expect(query.execute(null, callback)).to.eventually.deep.equal(expected);
        });

        it('should fail if an unexpected error occurs', () => {
            const error = new Error('foobar');
            const query = tableSelect({ _client: { crudFind } });

            td.when(crudFind(query), { ignoreExtraArgs: true }).thenReject(error);

            return expect(query.execute()).to.eventually.be.rejectedWith(error);
        });
    });

    context('getViewDefinition()', () => {
        it('should generate a simple projection table view query', () => {
            const expected = 'SELECT foo, bar FROM baz.qux';
            const query = tableSelect(null, 'baz', 'qux', ['foo', 'bar']);

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a filtered table view query', () => {
            const expected = 'SELECT * FROM foo.bar WHERE baz == "qux"';
            const query = tableSelect(null, 'foo', 'bar', ['*']).where('baz == "qux"');

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a ordered table view query', () => {
            const expected = 'SELECT baz FROM foo.bar ORDER BY qux';
            const query = tableSelect(null, 'foo', 'bar', ['baz']).orderBy(['qux']);

            expect(query.getViewDefinition()).to.equal(expected);
        });
    });

    context('orderBy()', () => {
        it('should be fluent', () => {
            const query = tableSelect().orderBy();

            expect(query.orderBy).to.be.a('function');
        });

        it('should set the order parameters provided as an array', () => {
            const parameters = ['foo desc', 'bar desc'];
            const query = tableSelect().orderBy(parameters);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });

        it('should set the order parameters provided as multiple arguments', () => {
            const parameters = ['foo desc', 'bar desc'];
            const query = tableSelect().orderBy(parameters[0], parameters[1]);

            expect(query.getOrderings()).to.deep.equal(parameters);
        });
    });

    context('groupBy()', () => {
        it('should be fluent', () => {
            const query = tableSelect().groupBy();

            expect(query.groupBy).to.be.a('function');
        });

        it('should set the grouping columns provided as an array', () => {
            const grouping = ['foo', 'bar'];
            const query = tableSelect().groupBy(grouping);

            expect(query.getGroupings()).to.deep.equal(grouping);
        });

        it('should set the grouping columns provided as an array', () => {
            const grouping = ['foo', 'bar'];
            const query = tableSelect().groupBy(grouping[0], grouping[1]);

            expect(query.getGroupings()).to.deep.equal(grouping);
        });
    });
});
