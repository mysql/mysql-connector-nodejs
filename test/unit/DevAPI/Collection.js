'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const collection = require('lib/DevAPI/Collection');
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
            expect(collection(null, null, 'foobar').getName()).to.equal('foobar');
        });
    });

    context('getSchema()', () => {
        it('should return the associated schema', () => {
            const instance = collection(null, { getName });

            td.when(getName()).thenReturn('foobar');

            expect(instance.getSchema().getName()).to.equal('foobar');
        });
    });

    context('getSession()', () => {
        it('should return the associated session', () => {
            const instance = collection({ foo: 'bar' });

            expect(instance.getSession()).to.deep.equal({ foo: 'bar' });
        });
    });

    context('existsInDatabase()', () => {
        it('should return true if exists in database', () => {
            const instance = collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('list_objects', ['bar', 'foo'], td.callback(['foo']), null, 'xplugin')).thenResolve();

            return expect(instance.existsInDatabase()).to.eventually.be.true;
        });

        it('should return false if it does not exist in database', () => {
            const instance = collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('list_objects', ['bar', 'foo'], td.callback([]), null, 'xplugin')).thenResolve();

            return expect(instance.existsInDatabase()).to.eventually.be.false;
        });
    });

    context('count()', () => {
        it('should return the number of documents in a collection', () => {
            const instance = collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('SELECT COUNT(*) FROM `bar`.`foo`', [], td.callback([1]))).thenResolve();

            return expect(instance.count()).to.eventually.equal(1);
        });

        it('should fail if an unexpected error is thrown', () => {
            const instance = collection({ _client: { sqlStmtExecute } }, { getName }, 'foo');
            const error = new Error('foobar');

            td.when(getName()).thenReturn('bar');
            td.when(sqlStmtExecute('SELECT COUNT(*) FROM `bar`.`foo`', [], td.callback([1]))).thenReject(error);

            return expect(instance.count()).to.eventually.be.rejectedWith(error);
        });
    });

    context('inspect()', () => {
        it('should hide internals', () => {
            const instance = collection(null, { getName }, 'foo');
            const expected = { schema: 'bar', collection: 'foo' };

            td.when(getName()).thenReturn('bar');

            expect(instance.inspect()).to.deep.equal(expected);
        });
    });

    context('add()', () => {
        it('should return an instance of the proper class', () => {
            const instance = collection().add({});

            expect(instance.getClassName()).to.equal('CollectionAdd');
        });

        it('should acknowledge documents provided as an array', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            const instance = collection().add(documents);

            expect(instance.getDocuments()).to.deep.equal(documents);
        });

        it('should acknowledge documents provided as multiple arguments', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            const instance = collection().add(documents[0], documents[1]);

            expect(instance.getDocuments()).to.deep.equal(documents);
        });
    });

    context('remove()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const name = 'baz';
            const query = 'true';
            const instance = collection(session, schema, name).remove(query);

            expect(instance.getClassName()).to.equal('CollectionRemove');
        });
    });

    context('modify()', () => {
        it('should return an operation instance for a valid condition query', () => {
            const session = 'foo';
            const schema = 'bar';
            const name = 'baz';
            const query = 'true';
            const instance = collection(session, schema, name).modify(query);

            expect(instance.getClassName()).to.equal('CollectionModify');
        });
    });
});
