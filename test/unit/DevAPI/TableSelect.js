'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const tableSelect = require('lib/DevAPI/TableSelect');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

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

        it('should return a Result instance containing the operation details', () => {
            const expected = { done: true };
            const state = { ok: true };
            const fakeResult = td.function();
            const fakeTableSelect = proxyquire('lib/DevAPI/TableSelect', { './Result': fakeResult });

            const query = fakeTableSelect({ _client: { crudFind } });

            td.when(fakeResult(state)).thenReturn(expected);
            td.when(crudFind(query, undefined, undefined)).thenResolve(state);

            return expect(query.execute()).to.eventually.deep.equal(expected);
        });

        it('should use a custom cursor to handle result set data', () => {
            const query = tableSelect({ _client: { crudFind } });
            const sideEffects = [];
            const callback = value => sideEffects.push(value);

            td.when(crudFind(query, td.callback('foo'), undefined)).thenResolve({});

            return expect(query.execute(callback)).to.eventually.be.fulfilled.then(() => {
                return expect(sideEffects).to.deep.equal(['foo']);
            });
        });

        it('should use a custom cursor to handle operation metadata', () => {
            const metaCB = td.function();
            const fakeTableSelect = proxyquire('lib/DevAPI/TableSelect', { './Column': { metaCB } });
            const query = fakeTableSelect({ _client: { crudFind } });
            const sideEffects = [];
            const callback = 'foo';
            const wrappedCallback = value => sideEffects.push(value);

            td.when(metaCB(callback)).thenReturn(wrappedCallback);
            td.when(crudFind(query, null, td.callback('bar'))).thenResolve({});

            return expect(query.execute(null, callback)).to.eventually.be.fulfilled.then(() => {
                return expect(sideEffects).to.deep.equal(['bar']);
            });
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
            const getName = td.function();
            const schema = { getName };
            const expected = 'SELECT foo, bar FROM baz.qux';
            const query = tableSelect(null, schema, 'qux', ['foo', 'bar']);

            td.when(getName()).thenReturn('baz');

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a filtered table view query', () => {
            const getName = td.function();
            const schema = { getName };
            const expected = 'SELECT * FROM foo.bar WHERE baz == "qux"';
            const query = tableSelect(null, schema, 'bar', ['*']).where('baz == "qux"');

            td.when(getName()).thenReturn('foo');

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a ordered table view query', () => {
            const getName = td.function();
            const schema = { getName };
            const expected = 'SELECT baz FROM foo.bar ORDER BY qux';
            const query = tableSelect(null, schema, 'bar', ['baz']).orderBy(['qux']);

            td.when(getName()).thenReturn('foo');

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
