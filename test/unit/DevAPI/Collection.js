'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Collection = require('lib/DevAPI/Collection');
const CollectionAdd = require('lib/DevAPI/CollectionAdd');
const CollectionModify = require('lib/DevAPI/CollectionModify');
const CollectionRemove = require('lib/DevAPI/CollectionRemove');
const expect = require('chai').expect;
const td = require('testdouble');

describe('Collection', () => {
    let sqlStmtExecute, getName;

    beforeEach('create fakes', () => {
        sqlStmtExecute = td.function();
        getName = td.function();
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getName()', () => {
        it('should return the collection name', () => {
            const collection = new Collection(null, null, 'foobar');

            expect(collection.getName()).to.equal('foobar');
        });
    });

    context('getSchema()', () => {
        it('should return the associated schema', () => {
            const collection = new Collection(null, { getName });

            td.when(getName()).thenReturn('foobar');

            expect(collection.getSchema().getName()).to.equal('foobar');
        });
    });

    context('getSession()', () => {
        it('should return the associated session', () => {
            const collection = new Collection({ foo: 'bar' });

            expect(collection.getSession()).to.deep.equal({ foo: 'bar' });
        });
    });

    context('existsInDatabase()', () => {
        it('should return true if exists in database', () => {
            const collection = new Collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('list_objects', ['bar', 'foo'], td.callback(['foo']), null, 'xplugin')).thenResolve();

            return expect(collection.existsInDatabase()).to.eventually.be.true;
        });

        it('should return false if it does not exist in database', () => {
            const collection = new Collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('list_objects', ['bar', 'foo'], td.callback([]), null, 'xplugin')).thenResolve();

            return expect(collection.existsInDatabase()).to.eventually.be.false;
        });
    });

    context('count()', () => {
        it('should return the number of documents in a collection', () => {
            const collection = new Collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('SELECT COUNT(*) FROM `bar`.`foo`', [], td.callback([1]))).thenResolve();

            return expect(collection.count()).to.eventually.equal(1);
        });

        it('should fail if an unexpected error is thrown', () => {
            const collection = new Collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');
            const error = new Error('foobar');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('SELECT COUNT(*) FROM `bar`.`foo`', [], td.callback([1]))).thenReject(error);

            return expect(collection.count()).to.eventually.be.rejectedWith(error);
        });
    });

    context('inspect()', () => {
        it('should hide internals', () => {
            const collection = new Collection(null, { getName }, 'foo');
            const expected = { schema: 'bar', collection: 'foo' };

            td.when(getName()).thenReturn('bar');

            expect(collection.inspect()).to.deep.equal(expected);
        });
    });

    context('add()', () => {
        it('should return an instance of the proper class', () => {
            const instance = (new Collection()).add({});

            expect(instance).to.be.an.instanceof(CollectionAdd);
        });

        it('should acknowledge documents provided as an array', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            const instance = (new Collection()).add(documents);

            expect(instance._document).to.deep.equal(documents);
        });

        it('should acknowledge documents provided as multiple arguments', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            const instance = (new Collection()).add(documents[0], documents[1]);

            expect(instance._document).to.deep.equal(documents);
        });
    });

    context('remove()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const collection = 'baz';
            const query = 'true';
            const instance = (new Collection(session, schema, collection)).remove(query);

            expect(instance).to.be.an.instanceOf(CollectionRemove);
            expect(instance._session).to.deep.equal(session);
            expect(instance._schema).to.deep.equal(schema);
            expect(instance._collection).to.deep.equal(collection);
            expect(instance._query).to.deep.equal(query);
        });
    });

    context('modify()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const collection = 'baz';
            const query = 'true';
            const instance = (new Collection(session, schema, collection)).modify(query);

            expect(instance).to.be.an.instanceOf(CollectionModify);
            expect(instance._session).to.deep.equal(session);
            expect(instance._schema).to.deep.equal(schema);
            expect(instance._collection).to.deep.equal(collection);
            expect(instance._query).to.deep.equal(query);
        });
    });
});
