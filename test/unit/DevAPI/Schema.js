/*
 * Copyright (c) 2016, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

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

    context('enums', () => {
        it('includes the set of schema validation levels', () => {
            expect(schema.ValidationLevel.OFF).to.equal('off');
            expect(schema.ValidationLevel.STRICT).to.equal('strict');
        });
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
        it('returns the instance of a new collection if it did not exist', () => {
            const instance = schema('foo', 'bar');
            const expected = instance.getCollection('baz').inspect();

            td.when(execute()).thenResolve();
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz')
                .then(actual => expect(actual.inspect()).to.deep.equal(expected));
        });

        it('fails if the collection already exists', () => {
            const instance = schema('foo', 'bar');
            const error = new Error();
            error.info = { code: 1050 };

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz')
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('returns the instance of a new collection if the option to re-use is enabled', () => {
            const instance = schema('foo', 'bar');
            const expected = instance.getCollection('baz').inspect();

            td.when(execute()).thenResolve();
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { reuseExisting: true })
                .then(actual => {
                    expect(actual.inspect()).deep.equal(expected);
                });
        });

        it('returns the instance of a new collection if the option to re-use is enabled alongside additional options', () => {
            const instance = schema('foo', 'bar');
            const options = { reuse_existing: true, validation: true };
            const expected = instance.getCollection('baz').inspect();

            td.when(execute()).thenResolve();
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz', options }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { reuseExisting: true, validation: true })
                .then(actual => {
                    expect(actual.inspect()).deep.equal(expected);
                });
        });

        it('deprecates the "ReuseExistingObject" option', () => {
            const deprecated = td.function();
            td.replace('../../../lib/DevAPI/Util/deprecated', deprecated);
            schema = require('../../../lib/DevAPI/Schema');

            const instance = schema('foo', 'bar');

            td.when(execute()).thenResolve();
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { ReuseExistingObject: true })
                .then(() => {
                    expect(td.explain(deprecated).callCount).to.equal(1);
                });
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

            return instance.createCollection('baz', { reuseExisting: true })
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails if some unexpected error is thrown even if the option to re-use is enabled alongside additional options', () => {
            const instance = schema('foo', 'bar');
            const options = { reuse_existing: true, validation: true };
            const error = new Error();
            error.info = {};

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz', options }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { reuseExisting: true, validation: true })
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails with a custom message if the server does not support schema validation', () => {
            const instance = schema('foo', 'bar');
            const options = { reuse_existing: false, validation: true };
            const error = new Error();
            error.info = { code: 5015 };

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz', options }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { validation: true })
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.'));
        });

        it('fails with a custom message if the server does not support schema validation if the option to re-use is enabled', () => {
            const instance = schema('foo', 'bar');
            const options = { reuse_existing: true, validation: true };
            const error = new Error();
            error.info = { code: 5015 };

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz', options }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { reuseExisting: true, validation: true })
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.'));
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

    context('modifyCollection()', () => {
        it('fails if the server returns an error', () => {
            const instance = schema('foo', 'bar');
            const error = new Error('foobar');

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'modify_collection_options', [{ schema: 'bar', name: 'baz', options: { qux: 'quux' } }], 'mysqlx')).thenReturn({ execute });

            return instance.modifyCollection('baz', { qux: 'quux' })
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('returns the corresponding collection instance if the operation suceeds', () => {
            const instance = schema('foo', 'bar');

            td.when(execute()).thenResolve();
            td.when(sqlExecute('foo', 'modify_collection_options', [{ schema: 'bar', name: 'baz', options: { qux: 'quux' } }], 'mysqlx')).thenReturn({ execute });

            return instance.modifyCollection('baz', { qux: 'quux' })
                .then(collection => {
                    // eslint-disable-next-line no-unused-expressions
                    expect(collection.getName).to.be.a('function');
                    expect(collection.getName()).to.equal('baz');
                });
        });

        it('fails with a custom message if the server does not support schema validation', () => {
            const instance = schema('foo', 'bar');
            const error = new Error();
            error.info = { code: 5157 };

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'modify_collection_options', [{ schema: 'bar', name: 'baz', options: { qux: 'quux' } }], 'mysqlx')).thenReturn({ execute });

            return instance.modifyCollection('baz', { qux: 'quux' })
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Your MySQL server does not support the requested operation. Please update to MySQL 8.0.19 or a later version.'));
        });
    });
});
