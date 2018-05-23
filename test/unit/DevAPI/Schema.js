'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Schema', () => {
    let execute, schema, sqlExecute;

    beforeEach('create fakes', () => {
        execute = td.function();
        sqlExecute = td.function();
        schema = proxyquire('lib/DevAPI/Schema', { './SqlExecute': sqlExecute });
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('existsInDatabase()', () => {
        it('should return true if the schema exists in database', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.callback(['bar']))).thenResolve();
            td.when(sqlExecute('foo', 'SHOW DATABASES LIKE ?', ['bar'])).thenReturn({ execute });

            return expect(instance.existsInDatabase()).to.eventually.be.true;
        });

        it('should return false if the schema does not exist in database', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.callback([]))).thenResolve();
            td.when(sqlExecute('foo', 'SHOW DATABASES LIKE ?', ['bar'])).thenReturn({ execute });

            return expect(instance.existsInDatabase()).to.eventually.be.false;
        });
    });

    context('getCollections()', () => {
        it('should return an empty object if there are no collections', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.matchers.isA(Function))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.getCollections()).to.eventually.be.an.instanceof(Array).and.be.empty;
        });

        it('should return an object containing the existing collections', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.callback(['baz', 'COLLECTION']))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.getCollections()).to.eventually.be.fulfilled
                .then(actual => {
                    expect(actual).to.have.lengthOf(1);
                    expect(actual[0].getName()).to.deep.equal('baz');
                });
        });
    });

    context('createCollection', () => {
        context('when the collection already exists (error code 1050)', () => {
            it('should return the existing collection if the option to re-use is enabled', () => {
                const instance = schema('foo', 'bar');
                const expected = instance.getCollection('baz').inspect();
                const error = new Error();
                error.info = { code: 1050 };

                td.when(execute()).thenReject(error);
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return expect(instance.createCollection('baz', { ReuseExistingObject: true })).to.eventually.be.fulfilled
                    .then(actual => {
                        expect(actual.inspect()).deep.equal(expected);
                    });
            });

            it('should fail if the option to re-use is disabled', () => {
                const instance = schema('foo', 'bar');
                const error = new Error();
                error.info = { code: 1050 };

                td.when(execute()).thenReject(error);
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return expect(instance.createCollection('baz')).to.eventually.be.rejectedWith(error);
            });
        });

        context('when the collection does not exist', () => {
            it('should return a newly created collection', () => {
                const instance = schema('foo', 'bar');
                const expected = instance.getCollection('baz').inspect();

                td.when(execute()).thenResolve();
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return expect(instance.createCollection('baz')).to.eventually.be.fulfilled
                    .then(actual => {
                        expect(actual.inspect()).to.deep.equal(expected);
                    });
            });

            it('should fail if some unexpected error is thrown', () => {
                const instance = schema('foo', 'bar');
                const error = new Error();
                error.info = {};

                td.when(execute()).thenReject(error);
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return expect(instance.createCollection('baz')).to.eventually.be.rejectedWith(error);
            });

            it('should fail if some unexpected error is thrown even if the option to re-use is enabled', () => {
                const instance = schema('foo', 'bar');
                const error = new Error();
                error.info = {};

                td.when(execute()).thenReject(error);
                td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

                return expect(instance.createCollection('baz', { ReuseExistingObject: true })).to.eventually.be.rejectedWith(error);
            });
        });
    });

    context('dropCollection()', () => {
        it('should return true if the collection was dropped', () => {
            const instance = schema('foo', 'bar');

            td.when(execute()).thenResolve();
            td.when(sqlExecute('foo', 'drop_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.dropCollection('baz')).to.eventually.be.true;
        });

        it('should return true if the collection does not exist', () => {
            const instance = schema('foo', 'bar');
            const error = new Error();
            error.info = { code: 1051 };

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'drop_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.dropCollection('baz')).to.eventually.be.true;
        });

        it('should fail if an unexpected error was thrown', () => {
            const instance = schema('foo', 'bar');
            const error = new Error('foobar');

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'drop_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.dropCollection('baz')).to.eventually.be.rejectedWith(error);
        });
    });

    context('getTables()', () => {
        it('should return an empty object if there are no tables', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.matchers.isA(Function))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.getTables()).to.eventually.be.an.instanceof(Array).and.be.empty;
        });

        it('should return an object containing the existing tables', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.callback(['baz', 'TABLE']))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.getTables()).to.eventually.be.fulfilled
                .then(actual => {
                    expect(actual).to.have.lengthOf(1);
                    expect(actual[0].getName()).to.equal('baz');
                });
        });

        it('should return an object containing the existing views', () => {
            const instance = schema('foo', 'bar');

            td.when(execute(td.callback(['baz', 'VIEW']))).thenResolve();
            td.when(sqlExecute('foo', 'list_objects', [{ schema: 'bar' }], 'mysqlx')).thenReturn({ execute });

            return expect(instance.getTables()).to.eventually.be.fulfilled
                .then(actual => {
                    expect(actual).to.have.lengthOf(1);
                    expect(actual[0].getName()).to.equal('baz');
                });
        });
    });

    context('inspect()', () => {
        it('should hide internals', () => {
            const instance = schema(null, 'foobar');
            const expected = { name: 'foobar' };

            expect(instance.inspect()).to.deep.equal(expected);
        });
    });
});
