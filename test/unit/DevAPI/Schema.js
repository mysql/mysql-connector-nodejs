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

const errors = require('../../../lib/constants/errors');
const expect = require('chai').expect;
const td = require('testdouble');
const warnings = require('../../../lib/constants/warnings');

// subject under test needs to be reloaded with replacement fakes
let schema = require('../../../lib/DevAPI/Schema');

describe('Schema', () => {
    let databaseObject, execute, sqlExecute, warning;

    beforeEach('create fakes', () => {
        execute = td.function();
        warning = td.function();

        databaseObject = td.replace('../../../lib/DevAPI/DatabaseObject');
        sqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');

        const logger = td.replace('../../../lib/logger');
        td.when(logger('api:schema')).thenReturn({ warning });

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

    context('mixins', () => {
        it('mixes the DatabaseObject blueprint', () => {
            const connection = 'foo';

            schema(connection);

            expect(td.explain(databaseObject).callCount).to.equal(1);
            return expect(td.explain(databaseObject).calls[0].args).to.deep.equal([connection]);
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
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
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
            const instance = schema('foo', 'bar');

            td.when(execute()).thenResolve();
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { ReuseExistingObject: true })
                .then(() => {
                    expect(td.explain(warning).callCount).to.equal(1);
                    return expect(td.explain(warning).calls[0].args).to.deep.equal(['createCollection', warnings.MESSAGES.WARN_DEPRECATED_CREATE_COLLECTION_REUSE_EXISTING, { type: warnings.TYPES.DEPRECATION, code: warnings.CODES.DEPRECATION }]);
                });
        });

        it('fails if some unexpected error is thrown', () => {
            const instance = schema('foo', 'bar');
            const error = new Error();
            error.info = {};

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz')
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });

        it('fails if some unexpected error is thrown even if the option to re-use is enabled', () => {
            const instance = schema('foo', 'bar');
            const error = new Error();
            error.info = {};

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz' }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { reuseExisting: true })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });

        it('fails if some unexpected error is thrown even if the option to re-use is enabled alongside additional options', () => {
            const instance = schema('foo', 'bar');
            const options = { reuse_existing: true, validation: true };
            const error = new Error();
            error.info = {};

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz', options }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { reuseExisting: true, validation: true })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });

        it('fails with a custom message if the server does not support schema validation', () => {
            const instance = schema('foo', 'bar');
            const options = { reuse_existing: false, validation: true };
            const error = new Error();
            error.info = { code: 5015 };

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz', options }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { validation: true })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_COLLECTION_OPTIONS_NOT_SUPPORTED);
                });
        });

        it('fails with a custom message if the server does not support schema validation if the option to re-use is enabled', () => {
            const instance = schema('foo', 'bar');
            const options = { reuse_existing: true, validation: true };
            const error = new Error();
            error.info = { code: 5015 };

            td.when(execute()).thenReject(error);
            td.when(sqlExecute('foo', 'create_collection', [{ schema: 'bar', name: 'baz', options }], 'mysqlx')).thenReturn({ execute });

            return instance.createCollection('baz', { reuseExisting: true, validation: true })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_COLLECTION_OPTIONS_NOT_SUPPORTED);
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
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
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
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
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
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_COLLECTION_OPTIONS_NOT_SUPPORTED);
                });
        });
    });
});
