'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const schema = require('lib/DevAPI/Schema');
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
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');

            td.when(sqlStmtExecute('SHOW DATABASES LIKE ?', ['foo'], td.callback(['foo']))).thenResolve();

            return expect(instance.existsInDatabase()).to.eventually.be.true;
        });

        it('should return false if the schema does not exist in database', () => {
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');

            td.when(sqlStmtExecute('SHOW DATABASES LIKE ?', ['foo'], td.callback([]))).thenResolve();

            return expect(instance.existsInDatabase()).to.eventually.be.false;
        });
    });

    context('getCollections()', () => {
        it('should return an empty object if there are no collections', () => {
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback([]), null, 'xplugin')).thenResolve();

            return expect(instance.getCollections()).to.eventually.be.an.instanceof(Object).and.be.empty;
        });

        it('should return an object containing the existing collections', () => {
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
            const expected = instance.getCollection('foo').inspect();

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback(['foo', 'COLLECTION']), null, 'xplugin')).thenResolve();

            return expect(instance.getCollections()).to.eventually.be.fulfilled
                .then(actual => {
                    expect(actual).to.have.all.keys(['foo']);
                    expect(actual.foo.inspect()).to.deep.equal(expected);
                });
        });
    });

    context('createCollection', () => {
        context('when the collection already exists (error code 1050)', () => {
            it('should return the existing collection if the option to re-use is enabled', () => {
                const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
                const expected = instance.getCollection('bar').inspect();
                const error = new Error();
                error.info = { code: 1050 };

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenReject(error);

                return expect(instance.createCollection('bar', { ReuseExistingObject: true })).to.eventually.be.fulfilled
                    .then(actual => {
                        expect(actual.inspect()).deep.equal(expected);
                    });
            });

            it('should fail if the option to re-use is disabled', () => {
                const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
                const error = new Error();
                error.info = { code: 1050 };

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenReject(error);

                return expect(instance.createCollection('bar')).to.eventually.be.rejectedWith(error);
            });
        });

        context('when the collection does not exist', () => {
            it('should return a newly created collection', () => {
                const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
                const expected = instance.getCollection('bar').inspect();

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenResolve();

                return expect(instance.createCollection('bar')).to.eventually.be.fulfilled
                    .then(actual => {
                        expect(actual.inspect()).to.deep.equal(expected);
                    });
            });

            it('should fail if some unexpected error is thrown', () => {
                const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
                const error = new Error();
                error.info = {};

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenReject(error);

                return expect(instance.createCollection('bar')).to.eventually.be.rejectedWith(error);
            });

            it('should fail if some unexpected error is thrown even if the option to re-use is enabled', () => {
                const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
                const error = new Error();
                error.info = {};

                td.when(sqlStmtExecute('create_collection', ['foo', 'bar'], null, null, 'xplugin')).thenReject(error);

                return expect(instance.createCollection('bar', { ReuseExistingObject: true })).to.eventually.be.rejectedWith(error);
            });
        });
    });

    context('dropCollection()', () => {
        it('should return true if the collection was dropped', () => {
            const name = 'foo';
            const instance = schema({ _client: { sqlStmtExecute } }, name);
            const collection = 'bar';

            td.when(sqlStmtExecute('drop_collection', [name, collection], null, null, 'xplugin')).thenResolve();

            return expect(instance.dropCollection(collection)).to.eventually.be.true;
        });

        it('should return true if the collection does not exist', () => {
            const name = 'foo';
            const instance = schema({ _client: { sqlStmtExecute } }, name);
            const collection = 'bar';
            const error = new Error();
            error.info = { code: 1051 };

            td.when(sqlStmtExecute('drop_collection', [name, collection], null, null, 'xplugin')).thenReject(error);

            return expect(instance.dropCollection(collection)).to.eventually.be.true;
        });

        it('should fail if an unexpected error was thrown', () => {
            const name = 'foo';
            const instance = schema({ _client: { sqlStmtExecute } }, name);
            const collection = 'bar';
            const error = new Error('foobar');

            td.when(sqlStmtExecute('drop_collection', [name, collection], null, null, 'xplugin')).thenReject(error);

            return expect(instance.dropCollection(collection)).to.eventually.be.rejectedWith(error);
        });
    });

    context('getTables()', () => {
        it('should return an empty object if there are no tables', () => {
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback([]), null, 'xplugin')).thenResolve();

            return expect(instance.getTables()).to.eventually.be.an.instanceof(Object).and.be.empty;
        });

        it('should return an object containing the existing tables', () => {
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
            const expected = instance.getTable('bar').inspect();

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback(['bar', 'TABLE']), null, 'xplugin')).thenResolve();

            return expect(instance.getTables()).to.eventually.be.fulfilled
                .then(actual => {
                    expect(actual).to.have.all.keys('bar');
                    expect(actual.bar.inspect()).to.deep.equal(expected);
                });
        });

        it('should return an object containing the existing views', () => {
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
            const expected = instance.getTable('bar').inspect();

            td.when(sqlStmtExecute('list_objects', ['foo'], td.callback(['bar', 'VIEW']), null, 'xplugin')).thenResolve();

            return expect(instance.getTables()).to.eventually.be.fulfilled
                .then(actual => {
                    expect(actual).to.have.all.keys('bar');
                    expect(actual.bar.inspect()).to.deep.equal(expected);
                });
        });
    });

    context('dropTable()', () => {
        it('should return true if the table was dropped', () => {
            const name = 'foo';
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
            const table = 'bar';

            td.when(sqlStmtExecute(`DROP TABLE \`${name}\`.\`${table}\``)).thenResolve();

            return expect(instance.dropTable(table)).to.eventually.be.true;
        });

        it('should return true if the table does not exist', () => {
            const name = 'foo';
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
            const table = 'bar';
            const error = new Error();
            error.info = { code: 1051 };

            td.when(sqlStmtExecute(`DROP TABLE \`${name}\`.\`${table}\``)).thenReject(error);

            return expect(instance.dropTable(table)).to.eventually.be.true;
        });

        it('should fail if an unexpected error was thrown', () => {
            const name = 'foo';
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
            const table = 'bar';
            const error = new Error('foobar');

            td.when(sqlStmtExecute(`DROP TABLE \`${name}\`.\`${table}\``)).thenReject(error);

            return expect(instance.dropTable(table)).to.eventually.be.rejectedWith(error);
        });
    });

    context('dropView()', () => {
        it('should return true if the view was dropped', () => {
            const name = 'foo';
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
            const view = 'bar';

            td.when(sqlStmtExecute(`DROP VIEW \`${name}\`.\`${view}\``)).thenResolve();

            return expect(instance.dropView(view)).to.eventually.be.true;
        });

        it('should return true if the view does not exist', () => {
            const name = 'foo';
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
            const view = 'bar';
            const error = new Error();
            error.info = { code: 1051 };

            td.when(sqlStmtExecute(`DROP VIEW \`${name}\`.\`${view}\``)).thenReject(error);

            return expect(instance.dropView(view)).to.eventually.be.true;
        });

        it('should fail if an unexpected error was thrown', () => {
            const name = 'foo';
            const instance = schema({ _client: { sqlStmtExecute } }, 'foo');
            const view = 'bar';
            const error = new Error('foobar');

            td.when(sqlStmtExecute(`DROP VIEW \`${name}\`.\`${view}\``)).thenReject(error);

            return expect(instance.dropView(view)).to.eventually.be.rejectedWith(error);
        });
    });

    context('inspect()', () => {
        it('should hide internals', () => {
            const instance = schema(null, 'foobar');
            const expected = { schema: 'foobar' };

            instance.inspect().should.deep.equal(expected);
        });
    });
});
