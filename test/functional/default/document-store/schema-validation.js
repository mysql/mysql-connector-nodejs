'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');

describe('schema validation', () => {
    let schema, session;

    beforeEach('create default schema', () => {
        return fixtures.createSchema(config.schema);
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(config)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(config.schema);
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
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
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5180);
                });
        });

        it('enforces the schema for document updates', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(collection => collection.add({ name: 'foo' }).execute())
                .then(res => expect(res.getAffectedItemsCount()).to.equal(1))
                .then(() => schema.getCollection('test').modify('name = :name').bind('name', 'foo').set('name', 1).execute())
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5180);
                });
        });

        it('enforces the schema without setting the level', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema } };

            return schema.createCollection('test', options)
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5180);
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
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5021);
                });
        });

        it('does not fail with missing validation options', () => {
            return schema.createCollection('test', { validation: {} })
                .then(collection => collection.add({ name: 'foo' }).execute());
        });

        it('fails with invalid validation type', () => {
            return schema.createCollection('test', { validation: null })
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5016);
                });
        });

        it('fails with unknown validation options', () => {
            return schema.createCollection('test', { validation: { foo: 'bar' } })
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5021);
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
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5182);
                });
        });

        it('fails with an invalid JSON schema property', () => {
            const options = { validation: { schema: { type: 'foo' } } };

            return schema.createCollection('test', options)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5182);
                });
        });

        it('fails with an invalid value of "level"', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: 'foo' } };

            return schema.createCollection('test', options)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5017);
                });
        });

        it('fails with additional unknown properties', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, foo: 'bar' } };

            return schema.createCollection('test', options)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5021);
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
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.not.equal(5080);
                });
        });

        it('does not explicitely remove a schema from an existing collection with one', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(() => schema.createCollection('test', { reuseExisting: true, validation: { level: mysqlx.Schema.ValidationLevel.OFF } }))
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.not.equal(5080);
                });
        });
    });

    context('modifying the collection schema', () => {
        it('fails with an empty option block', () => {
            return schema.modifyCollection('test', {})
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5020);
                });
        });

        it('fails with unknown protocol options', () => {
            return schema.modifyCollection('test', { foo: 'bar' })
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5021);
                });
        });

        it('fails with missing validation options', () => {
            return schema.modifyCollection('test', { validation: {} })
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5020);
                });
        });

        it('fails with invalid validation type', () => {
            return schema.modifyCollection('test', { validation: null })
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5016);
                });
        });

        it('fails with unknown validation options', () => {
            return schema.modifyCollection('test', { validation: { foo: 'bar' } })
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5021);
                });
        });

        it('fails with an invalid json schema', () => {
            const options = { validation: { schema: 'foo' } };

            return schema.modifyCollection('test', options)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5182);
                });
        });

        it('fails with an invalid json schema property', () => {
            const options = { validation: { schema: { type: 'foo' } } };

            return schema.modifyCollection('test', options)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5182);
                });
        });

        it('fails with an invalid value of "level"', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: 'foo' } };

            return schema.modifyCollection('test', options)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5017);
                });
        });

        it('fails with additional unknown properties', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, foo: 'bar' } };

            return schema.modifyCollection('test', options)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5021);
                });
        });

        it('fails if a collection does not exist', () => {
            const options = { validation: { level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.modifyCollection('test', options)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(1146);
                });
        });

        it('updates the schema of an existing collection', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { schema: jsonSchema, level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test')
                .then(() => schema.modifyCollection('test', options))
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5180);
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
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5180);
                });
        });

        it('allows to enforce a schema with previously enabled validation', () => {
            const jsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
            const options = { validation: { level: mysqlx.Schema.ValidationLevel.STRICT } };

            return schema.createCollection('test', options)
                .then(() => schema.modifyCollection('test', { validation: { schema: jsonSchema } }))
                .then(collection => collection.add({ name: 1 }).execute())
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5180);
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
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5180);
                });
        });
    });
});
