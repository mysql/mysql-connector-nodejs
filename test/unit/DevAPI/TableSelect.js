'use strict';

/* eslint-env node, mocha */
/* global Client */

// npm `test` script was updated to use NODE_PATH=.
const Result = require('lib/DevAPI/Result');
const expect = require('chai').expect;
const parseExpressionInputs = require('lib/DevAPI/Util/parseExpressionInputs');
const tableSelect = require('lib/DevAPI/TableSelect');
const td = require('testdouble');

describe('TableSelect', () => {
    let crudFind, getName, fakeSchema, fakeSession;

    beforeEach('create fake session', () => {
        crudFind = td.function();
        fakeSession = { _client: { crudFind } };
    });

    beforeEach('create fake schema', () => {
        getName = td.function();
        fakeSchema = { getName };

        td.when(getName()).thenReturn('schema');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getClassName()', () => {
        it('should return the correct class name (to avoid duck typing)', () => {
            expect(tableSelect().getClassName()).to.equal('TableSelect');
        });
    });

    context('lockShared()', () => {
        it('should set the correct locking mode', () => {
            const query = tableSelect().lockShared();

            expect(query.getLockingMode()).to.equal(1);
        });
    });

    context('lockExclusive()', () => {
        it('should set the correct locking mode', () => {
            const query = tableSelect().lockExclusive();

            expect(query.getLockingMode()).to.equal(2);
        });
    });

    context('execute()', () => {
        it('should acknowledge the projection values', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = tableSelect(fakeSession, fakeSchema, 'table', ['foo', 'bar']);

            const call = crudFind(fakeSession, 'schema', 'table', Client.dataModel.TABLE, parseExpressionInputs(['foo', 'bar']));
            td.when(call, { ignoreExtraArgs: true }).thenResolve(state);

            return query.execute().should.eventually.deep.equal(expected);
        });

        it('should set the correct default locking mode', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = tableSelect(fakeSession, fakeSchema);
            // default locking mode
            const mode = 0;
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, any, any, any, any, any, any, any, any, any, mode);

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).eventually.deep.equal(expected);
        });

        it('should include the latest specified locking mode', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = tableSelect(fakeSession, fakeSchema).lockShared().lockExclusive();
            const mode = 2;
            const any = td.matchers.anything();
            const execute = fakeSession._client.crudFind(any, any, any, any, any, any, any, any, any, any, any, any, any, any, mode);

            td.when(execute, { ignoreExtraArgs: true }).thenResolve(state);

            return expect(query.execute()).eventually.deep.equal(expected);
        });
    });

    context('getViewDefinition()', () => {
        it('should generate a simple projection table view query', () => {
            const expected = 'SELECT foo, bar FROM schema.table';
            const query = tableSelect(fakeSession, fakeSchema, 'table', ['foo', 'bar']);

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a filtered table view query', () => {
            const expected = 'SELECT * FROM schema.table WHERE foo = "baz"';
            const query = tableSelect(fakeSession, fakeSchema, 'table', ['*']).where('foo = "baz"');

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a ordered table view query', () => {
            const expected = 'SELECT foo FROM schema.table ORDER BY bar';
            const query = tableSelect(fakeSession, fakeSchema, 'table', ['foo']).orderBy(['bar']);

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

            expect(query.getOrderBy()).to.deep.equal(parameters);
        });

        it('should set the order parameters provided as multiple arguments', () => {
            const parameters = ['foo desc', 'bar desc'];
            const query = tableSelect().orderBy(parameters[0], parameters[1]);

            expect(query.getOrderBy()).to.deep.equal(parameters);
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

            expect(query.getGroupBy()).to.deep.equal(grouping);
        });

        it('should set the grouping columns provided as an array', () => {
            const grouping = ['foo', 'bar'];
            const query = tableSelect().groupBy(grouping[0], grouping[1]);

            expect(query.getGroupBy()).to.deep.equal(grouping);
        });
    });
});
