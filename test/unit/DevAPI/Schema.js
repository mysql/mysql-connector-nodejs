'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Schema = require('lib/DevAPI/Schema');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Schema', () => {
    let sqlStmtExecute;

    beforeEach('create fakes', () => {
        sqlStmtExecute = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('existsInDatabase()', () => {
        it('should return true if the schema exists in database', () => {
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');

            td.when(sqlStmtExecute('SHOW DATABASES LIKE ?', ['foo'], td.callback(['foo']))).thenResolve();

            return expect(schema.existsInDatabase()).to.eventually.be.true;
        });

        it('should return false if the schema does not exist in database', () => {
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');

            td.when(sqlStmtExecute('SHOW DATABASES LIKE ?', ['foo'], td.callback([]))).thenResolve();

            return expect(schema.existsInDatabase()).to.eventually.be.false;
        });
    });

    context('getCollections()', () => {
        it('should return an empty object if there are no collections', () => {
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback([]), null, 'xplugin')).thenResolve();

            return expect(schema.getCollections()).to.eventually.be.an.instanceof(Object).and.be.empty;
        });

        it('should return an object containing the existing collections', () => {
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback(['foo', 'COLLECTION']), null, 'xplugin')).thenResolve();

            return expect(schema.getCollections()).to.eventually.deep.equal({ foo: schema.getCollection('foo') });
        });
    });

    context('createCollection', () => {
        context('when the collection already exists (error code 1050)', () => {
            it('should return the existing collection if the option to re-use is enabled', () => {
                const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
                const expected = schema.getCollection('bar');
                const error = new Error();
                error.info = { code: 1050 };

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenReject(error);

                return expect(schema.createCollection('bar', { ReuseExistingObject: true })).to.eventually.deep.equal(expected);
            });

            it('should fail if the option to re-use is disabled', () => {
                const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
                const error = new Error();
                error.info = { code: 1050 };

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenReject(error);

                return expect(schema.createCollection('bar')).to.eventually.be.rejectedWith(error);
            });
        });

        context('when the collection does not exist', () => {
            it('should return a newly created collection', () => {
                const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
                const expected = schema.getCollection('bar');

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenResolve();

                return expect(schema.createCollection('bar')).to.eventually.deep.equal(expected);
            });

            it('should fail if some unexpected error is thrown', () => {
                const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
                const error = new Error();
                error.info = {};

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenReject(error);

                return expect(schema.createCollection('bar')).to.eventually.be.rejectedWith(error);
            });

            it('should fail if some unexpected error is thrown even if the option to re-use is enabled', () => {
                const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
                const error = new Error();
                error.info = {};

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenReject(error);

                return expect(schema.createCollection('bar', { ReuseExistingObject: true })).to.eventually.be.rejectedWith(error);
            });
        });
    });

    context('dropCollection()', () => {
        it('should return true if the collection was dropped', () => {
            const name = 'foo';
            const schema = new Schema({ _client: { sqlStmtExecute } }, name);
            const collection = 'bar';

            td.when(sqlStmtExecute('drop_collection', [name, collection], null, null, 'xplugin')).thenResolve();

            return expect(schema.dropCollection(collection)).to.eventually.be.true;
        });

        it('should return true if the collection does not exist', () => {
            const name = 'foo';
            const schema = new Schema({ _client: { sqlStmtExecute } }, name);
            const collection = 'bar';
            const error = new Error();
            error.info = { code: 1051 };

            td.when(sqlStmtExecute('drop_collection', [name, collection], null, null, 'xplugin')).thenReject(error);

            return expect(schema.dropCollection(collection)).to.eventually.be.true;
        });

        it('should fail if an unexpected error was thrown', () => {
            const name = 'foo';
            const schema = new Schema({ _client: { sqlStmtExecute } }, name);
            const collection = 'bar';
            const error = new Error('foobar');

            td.when(sqlStmtExecute('drop_collection', [name, collection], null, null, 'xplugin')).thenReject(error);

            return expect(schema.dropCollection(collection)).to.eventually.be.rejectedWith(error);
        });
    });

    context('getTables()', () => {
        it('should return an empty object if there are no tables', () => {
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback([]), null, 'xplugin')).thenResolve();

            return expect(schema.getTables()).to.eventually.be.an.instanceof(Object).and.be.empty;
        });

        it('should return an object containing the existing tables', () => {
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
            const expected = schema.getTable('bar');

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback(['bar', 'TABLE']), null, 'xplugin')).thenResolve();

            return expect(schema.getTables()).to.eventually.deep.equal({ bar: expected });
        });

        it('should return an object containing the existing views', () => {
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
            const expected = schema.getTable('bar');

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback(['bar', 'VIEW']), null, 'xplugin')).thenResolve();

            return expect(schema.getTables()).to.eventually.deep.equal({ bar: expected });
        });
    });

    context('dropTable()', () => {
        it('should return true if the table was dropped', () => {
            const name = 'foo';
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
            const table = 'bar';

            td.when(sqlStmtExecute(`DROP TABLE \`${name}\`.\`${table}\``)).thenResolve();

            return expect(schema.dropTable(table)).to.eventually.be.true;
        });

        it('should return true if the table does not exist', () => {
            const name = 'foo';
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
            const table = 'bar';
            const error = new Error();
            error.info = { code: 1051 };

            td.when(sqlStmtExecute(`DROP TABLE \`${name}\`.\`${table}\``)).thenReject(error);

            return expect(schema.dropTable(table)).to.eventually.be.true;
        });

        it('should fail if an unexpected error was thrown', () => {
            const name = 'foo';
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
            const table = 'bar';
            const error = new Error('foobar');

            td.when(sqlStmtExecute(`DROP TABLE \`${name}\`.\`${table}\``)).thenReject(error);

            return expect(schema.dropTable(table)).to.eventually.be.rejectedWith(error);
        });
    });

    context('dropView()', () => {
        it('should return true if the view was dropped', () => {
            const name = 'foo';
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
            const view = 'bar';

            td.when(sqlStmtExecute(`DROP VIEW \`${name}\`.\`${view}\``)).thenResolve();

            return expect(schema.dropView(view)).to.eventually.be.true;
        });

        it('should return true if the view does not exist', () => {
            const name = 'foo';
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
            const view = 'bar';
            const error = new Error();
            error.info = { code: 1051 };

            td.when(sqlStmtExecute(`DROP VIEW \`${name}\`.\`${view}\``)).thenReject(error);

            return expect(schema.dropView(view)).to.eventually.be.true;
        });

        it('should fail if an unexpected error was thrown', () => {
            const name = 'foo';
            const schema = new Schema({ _client: { sqlStmtExecute } }, 'foo');
            const view = 'bar';
            const error = new Error('foobar');

            td.when(sqlStmtExecute(`DROP VIEW \`${name}\`.\`${view}\``)).thenReject(error);

            return expect(schema.dropView(view)).to.eventually.be.rejectedWith(error);
        });
    });

    context('inspect()', () => {
        it('should hide internals', () => {
            const schema = new Schema(null, 'foobar');
            const expected = { schema: 'foobar' };

            schema.inspect().should.deep.equal(expected);
        });
    });
});
