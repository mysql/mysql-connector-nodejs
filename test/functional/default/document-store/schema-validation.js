/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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

const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');

describe('schema validation', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let schema, session;

    beforeEach('create default schema', () => {
        return fixtures.createSchema(baseConfig.schema);
    });

    beforeEach('create session using default schema', () => {
        const defaultConfig = Object.assign({}, config, baseConfig);

        return mysqlx.getSession(defaultConfig)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getDefaultSchema();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('creating the collection with a schema', () => {
        it('fails to insert a document when the schema is violated', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA);
                });
        });

        it('enforces the schema for document updates', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(collection => collection.add({ name: 'foo' }).execute())
                .then(res => expect(res.getAffectedItemsCount()).to.equal(1))
                .then(() => schema.getCollection('test').modify('name = :name').bind('name', 'foo').set('name', 1).execute())
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA);
                });
        });

        it('enforces the schema without setting the level', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema } };

            return schema.createCollection('test', options)
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA);
                });
        });

        it('allows to insert a document when the schema is not violated', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(collection => collection.add({ name: 'foo' }).execute());
        });

        it('does not fail with an empty option block', () => {
            return schema.createCollection('test', {})
                .then(collection => collection.add({ name: 'foo' }).execute());
        });

        it('fails with unknown protocol options', () => {
            return schema.createCollection('test', { foo: 'bar' })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_INVALID_ARGUMENT);
                });
        });

        it('does not fail with missing validation options', () => {
            return schema.createCollection('test', { validation: {} })
                .then(collection => collection.add({ name: 'foo' }).execute());
        });

        it('fails with invalid validation type', () => {
            return schema.createCollection('test', { validation: null })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_ARGUMENT_TYPE);
                });
        });

        it('fails with unknown validation options', () => {
            return schema.createCollection('test', { validation: { foo: 'bar' } })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_INVALID_ARGUMENT);
                });
        });

        it('does not fail when validation is explicitely disabled', () => {
            const options = { validation: { level: mysqlx.Schema.ValidationLevel.OFF } };

            return schema.createCollection('test', options)
                .then(collection => collection.add({ name: 'foo' }).execute());
        });

        it('does not fail with an empty JSON schema', () => {
            const options = { validation: { schema: {} } };

            return schema.createCollection('test', options)
                .then(collection => collection.add({ name: 'foo' }).execute());
        });

        it('fails with an invalid JSON schema', () => {
            const options = { validation: { schema: 'foo' } };

            return schema.createCollection('test', options)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_INVALID_VALIDATION_SCHEMA);
                });
        });

        it('fails with an invalid JSON schema property', () => {
            const options = { validation: { schema: { type: 'foo' } } };

            return schema.createCollection('test', options)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_INVALID_VALIDATION_SCHEMA);
                });
        });

        it('fails with an invalid value of "level"', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: 'foo' } };

            return schema.createCollection('test', options)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_ARGUMENT_VALUE);
                });
        });

        it('fails with additional unknown properties', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, foo: 'bar' } };

            return schema.createCollection('test', options)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_INVALID_ARGUMENT);
                });
        });

        it('does not add a schema to an existing collection without one', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { reuseExisting: true, validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test')
                .then(() => schema.createCollection('test', options))
                .then(collection => collection.add({ name: 1 }).execute());
        });

        it('does not implicitely remove a schema from an existing collection with one', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(() => schema.createCollection('test', { reuseExisting: true }))
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA);
                });
        });

        it('does not explicitely remove a schema from an existing collection with one', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(() => schema.createCollection('test', { reuseExisting: true, validation: { level: mysqlx.Schema.ValidationLevel.OFF } }))
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA);
                });
        });
    });

    context('modifying the collection schema', () => {
        it('fails with an empty option block', () => {
            return schema.modifyCollection('test', {})
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_ARGUMENT_OBJECT_EMPTY);
                });
        });

        it('fails with unknown protocol options', () => {
            return schema.modifyCollection('test', { foo: 'bar' })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_INVALID_ARGUMENT);
                });
        });

        it('fails with missing validation options', () => {
            return schema.modifyCollection('test', { validation: {} })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_ARGUMENT_OBJECT_EMPTY);
                });
        });

        it('fails with invalid validation type', () => {
            return schema.modifyCollection('test', { validation: null })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_ARGUMENT_TYPE);
                });
        });

        it('fails with unknown validation options', () => {
            return schema.modifyCollection('test', { validation: { foo: 'bar' } })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_INVALID_ARGUMENT);
                });
        });

        it('fails with an invalid json schema', () => {
            const options = { validation: { schema: 'foo' } };

            return schema.modifyCollection('test', options)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_INVALID_VALIDATION_SCHEMA);
                });
        });

        it('fails with an invalid json schema property', () => {
            const options = { validation: { schema: { type: 'foo' } } };

            return schema.modifyCollection('test', options)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_INVALID_VALIDATION_SCHEMA);
                });
        });

        it('fails with an invalid value of "level"', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: 'foo' } };

            return schema.modifyCollection('test', options)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_ARGUMENT_VALUE);
                });
        });

        it('fails with additional unknown properties', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, foo: 'bar' } };

            return schema.modifyCollection('test', options)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_CMD_INVALID_ARGUMENT);
                });
        });

        it('fails if a collection does not exist', () => {
            const options = { validation: { level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.modifyCollection('test', options)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(errors.ER_NO_SUCH_TABLE);
                });
        });

        it('updates the schema of an existing collection', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test')
                .then(() => schema.modifyCollection('test', options))
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA);
                });
        });

        it('explicitely disables the schema of an existing collection', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(() => schema.modifyCollection('test', { validation: { level: mysqlx.Schema.ValidationLevel.OFF } }))
                .then(collection => collection.add({ name: 1 }).execute());
        });

        it('postpones enabling the schema validation', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.OFF } };

            return schema.createCollection('test', options)
                .then(() => schema.modifyCollection('test', { validation: { level: mysqlx.Schema.ValidationLevel.STRICT } }))
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA);
                });
        });

        it('allows to enforce a schema with previously enabled validation', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(() => schema.modifyCollection('test', { validation: { schema: jsonSchema } }))
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA);
                });
        });

        it('enforces a schema for subsequent document updates', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test')
                .then(collection => collection.add({ name: 'foo' }).execute())
                .then(res => expect(res.getAffectedItemsCount()).to.equal(1))
                .then(() => schema.modifyCollection('test', options))
                .then(() => schema.getCollection('test').modify('name = :name').bind('name', 'foo').set('name', 1).execute())
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    return expect(err.info.code).to.equal(errors.ER_X_DOCUMENT_DOESNT_MATCH_EXPECTED_SCHEMA);
                });
        });
    });
});
