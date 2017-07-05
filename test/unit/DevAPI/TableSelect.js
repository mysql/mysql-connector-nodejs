'use strict';

/* eslint-env node, mocha */
/* global Client */

// npm `test` script was updated to use NODE_PATH=.
const BaseQuery = require('lib/DevAPI/BaseQuery');
const Result = require('lib/DevAPI/Result');
const TableSelect = require('lib/DevAPI/TableSelect');
const expect = require('chai').expect;
const parseExpressionInputs = require('lib/DevAPI/Util/parseExpressionInputs');
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

    context('constructor', () => {
        it('should be an instance of BaseQuery', () => {
            expect(new TableSelect()).to.be.an.instanceof(BaseQuery);
        });
    });

    context('lockShared()', () => {
        it('should set the correct locking mode', () => {
            const query = (new TableSelect()).lockShared();

            expect(query._lockingMode).to.equal(1);
        });
    });

    context('lockExclusive()', () => {
        it('should set the correct locking mode', () => {
            const query = (new TableSelect()).lockExclusive();

            expect(query._lockingMode).to.equal(2);
        });
    });

    context('execute()', () => {
        it('should acknowledge the projection values', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = new TableSelect(fakeSession, fakeSchema, 'table', ['foo', 'bar']);

            const call = crudFind(fakeSession, 'schema', 'table', Client.dataModel.TABLE, parseExpressionInputs(['foo', 'bar']));
            td.when(call, { ignoreExtraArgs: true }).thenResolve(state);

            return query.execute().should.eventually.deep.equal(expected);
        });

        it('should set the correct default locking mode', () => {
            const state = { ok: true };
            const expected = new Result(state);
            const query = (new TableSelect(fakeSession, fakeSchema));
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
            const query = (new TableSelect(fakeSession, fakeSchema)).lockShared().lockExclusive();
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
            const query = new TableSelect(fakeSession, fakeSchema, 'table', ['foo', 'bar']);

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a filtered table view query', () => {
            const expected = 'SELECT * FROM schema.table WHERE foo = "baz"';
            const query = (new TableSelect(fakeSession, fakeSchema, 'table', ['*'])).where('foo = "baz"');

            expect(query.getViewDefinition()).to.equal(expected);
        });

        it('should generate a ordered table view query', () => {
            const expected = 'SELECT foo FROM schema.table ORDER BY bar';
            const query = (new TableSelect(fakeSession, fakeSchema, 'table', ['foo'])).orderBy(['bar']);

            expect(query.getViewDefinition()).to.equal(expected);
        });
    });

    context('orderBy()', () => {
        it('should be fluent', () => {
            const query = (new TableSelect()).orderBy();

            expect(query).to.be.an.instanceof(TableSelect);
        });

        it('should set the order parameters provided as an array', () => {
            const parameters = ['foo desc', 'bar desc'];
            const query = (new TableSelect()).orderBy(parameters);

            expect(query._orderby).to.deep.equal(parameters);
        });

        it('should set the order parameters provided as multiple arguments', () => {
            const parameters = ['foo desc', 'bar desc'];
            const query = (new TableSelect()).orderBy(parameters[0], parameters[1]);

            expect(query._orderby).to.deep.equal(parameters);
        });
    });

    context('groupBy()', () => {
        it('should be fluent', () => {
            const query = (new TableSelect()).groupBy();

            expect(query).to.be.an.instanceof(TableSelect);
        });

        it('should set the grouping columns provided as an array', () => {
            const grouping = ['foo', 'bar'];
            const query = (new TableSelect()).groupBy(grouping);

            expect(query._groupby).to.deep.equal(grouping);
        });

        it('should set the grouping columns provided as an array', () => {
            const grouping = ['foo', 'bar'];
            const query = (new TableSelect()).groupBy(grouping[0], grouping[1]);

            expect(query._groupby).to.deep.equal(grouping);
        });
    });
});
