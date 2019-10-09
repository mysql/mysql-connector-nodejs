'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const statement = require('../../../lib/DevAPI/Statement');
const td = require('testdouble');

describe('Schema', () => {
    let execute, schema, sqlExecute;

    beforeEach('create fakes', () => {
        execute = td.function();
        sqlExecute = td.function();
        sqlExecute.Namespace = statement.Type;

        td.replace('../../../lib/DevAPI/SqlExecute', sqlExecute);
        schema = require('../../../lib/DevAPI/Schema');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('existsInDatabase()', () => {
        let fetchAll;

        beforeEach('create fakes', () => {
            fetchAll = td.function();
        });

        it('returns true if the schema exists in database', () => {
            const instance = schema('foo', 'bar');

            td.when(fetchAll()).thenReturn(['bar']);
            td.when(execute()).thenResolve({ fetchAll });
            td.when(sqlExecute('foo', 'SHOW DATABASES LIKE ?', ['bar'])).thenReturn({ execute });

            return instance.existsInDatabase()
                .then(actual => expect(actual).to.be.true);
        });

        it('returns false if the schema does not exist in database', () => {
            const instance = schema('foo', 'bar');

            td.when(fetchAll()).thenReturn([]);
            td.when(execute()).thenResolve({ fetchAll });
            td.when(sqlExecute('foo', 'SHOW DATABASES LIKE ?', ['bar'])).thenReturn({ execute });

            return instance.existsInDatabase()
                .then(actual => expect(actual).to.be.false);
        });
    });

    context('getCollections()', () => {
        it('returns an empty object if there are no collections', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.matchers.isA(Function))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return instance.getCollections()
                .then(actual => expect(actual).to.be.an.instanceof(Array).and.be.empty);
        });

        it('returns an object containing the existing collections', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.callback(['baz', 'COLLECTION']))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return instance.getCollections()
                .then(actual => {
                    expect(actual).to.have.lengthOf(1);
                    expect(actual[0].getName()).to.deep.equal('baz');
                });
        });
    });

    context('createCollection', () => {
        context('when the collection already exists (error code 1050)', () => {
            it('returns the existing collection if the option to re-use is enabled', () => {
                const instance = schema('foo', 'bar');
                const expected = instance.getCollection('baz').inspect();
                const error = new Error();
                error.info = { code: 1050 };

                td.when(execute()).thenReject(error);
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return instance.createCollection('baz', { ReuseExistingObject: true })
                    .then(actual => expect(actual.inspect()).deep.equal(expected));
            });

            it('fails if the option to re-use is disabled', () => {
                const instance = schema('foo', 'bar');
                const error = new Error();
                error.info = { code: 1050 };

                td.when(execute()).thenReject(error);
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return instance.createCollection('baz')
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });
        });

        context('when the collection does not exist', () => {
            it('returns a newly created collection', () => {
                const instance = schema('foo', 'bar');
                const expected = instance.getCollection('baz').inspect();

                td.when(execute()).thenResolve();
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return instance.createCollection('baz')
                    .then(actual => expect(actual.inspect()).to.deep.equal(expected));
            });

            it('fails if some unexpected error is thrown', () => {
                const instance = schema('foo', 'bar');
                const error = new Error();
                error.info = {};

                td.when(execute()).thenReject(error);
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return instance.createCollection('baz')
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });

            it('fails if some unexpected error is thrown even if the option to re-use is enabled', () => {
                const instance = schema('foo', 'bar');
                const error = new Error();
                error.info = {};

                td.when(execute()).thenReject(error);
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return instance.createCollection('baz', { ReuseExistingObject: true })
                    .then(() => expect.fail())
                    .catch(err => expect(err).to.deep.equal(error));
            });
        });
    });

    context('dropCollection()', () => {
        it('returns true if the collection was dropped', () => {
            const instance = schema('foo', 'bar');

            td.when(execute()).thenResolve();
            td.when(sqlExecute('foo', 'drop_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.dropCollection('baz')
                .then(actual => expect(actual).to.be.true);
        });

        it('returns true if the collection does not exist', () => {
            const instance = schema('foo', 'bar');
            const error = new Error();
            error.info = { code: 1051 };

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'drop_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.dropCollection('baz')
                .then(actual => expect(actual).to.be.true);
        });

        it('fails if an unexpected error was thrown', () => {
            const instance = schema('foo', 'bar');
            const error = new Error('foobar');

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'drop_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.dropCollection('baz')
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    context('getTables()', () => {
        it('returns an empty object if there are no tables', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.matchers.isA(Function))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return instance.getTables()
                .then(actual => expect(actual).to.be.an.instanceof(Array).and.be.empty);
        });

        it('returns an object containing the existing tables', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.callback(['baz', 'TABLE']))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return instance.getTables()
                .then(actual => {
                    expect(actual).to.have.lengthOf(1);
                    expect(actual[0].getName()).to.equal('baz');
                });
        });

        it('returns an object containing the existing views', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.callback(['baz', 'VIEW']))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return instance.getTables()
                .then(actual => {
                    expect(actual).to.have.lengthOf(1);
                    expect(actual[0].getName()).to.equal('baz');
                });
        });
    });

    context('inspect()', () => {
        it('hides internals', () => {
            const instance = schema(null, 'foobar');
            const expected = { name: 'foobar' };

            expect(instance.inspect()).to.deep.equal(expected);
        });
    });
});
