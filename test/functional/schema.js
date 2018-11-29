'use strict';

/* eslint-env node, mocha */

const config = require('test/properties');
const fixtures = require('test/fixtures');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional session schema', () => {
    let session, schema;

    beforeEach('create default schema', () => {
        return fixtures.createDefaultSchema();
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

    context('creating collections', () => {
        it('should allow to create collections', () => {
            const collections = ['test1', 'test2'];

            return Promise
                .all([
                    schema.createCollection(collections[0]),
                    schema.createCollection(collections[1])
                ])
                .then(() => {
                    return schema.getCollections();
                })
                .then(result => {
                    expect(result).to.have.lengthOf(2);
                    expect(result[0].getName()).to.deep.equal(collections[0]);
                    expect(result[1].getName()).to.deep.equal(collections[1]);
                });
        });
    });

    context('fetching collections', () => {
        it('should allow to retrieve a single collection', () => {
            return schema
                .createCollection('foo')
                .then(() => {
                    expect(schema.getCollection('foo').getName()).to.equal('foo');
                });
        });

        it('should allow to retrieve the list of existing collections', () => {
            return schema
                .createCollection('foo')
                .then(() => {
                    return schema.getCollections();
                })
                .then(collections => {
                    expect(collections).to.have.lengthOf(1);
                    expect(collections[0].getName()).to.equal('foo');
                });
        });
    });

    context('dropping collections', () => {
        it('should allow to drop an existing collection', () => {
            const collection = 'test';

            return expect(Promise.all([
                expect(schema.getCollections()).to.eventually.be.empty,
                schema.createCollection(collection),
                expect(schema.getCollections()).to.eventually.not.be.empty,
                schema.dropCollection(collection),
                expect(schema.getCollections()).to.eventually.be.empty
            ])).to.eventually.be.fulfilled;
        });

        it('should not fail to drop non-existent collections', () => {
            return expect(schema.dropCollection('test')).to.eventually.be.fulfilled;
        });

        it('should fail to drop a collection with an empty name', () => {
            return expect(schema.dropCollection('')).to.eventually.be.rejected;
        });

        it('should fail to drop a collection with an invalid name', () => {
            return expect(schema.dropCollection(' ')).to.eventually.be.rejected;
        });

        it('should fail to drop a collection with name set to `null`', () => {
            return expect(schema.dropCollection(null)).to.eventually.be.rejected;
        });
    });

    context('fetching tables', () => {
        it('should allow to retrieve a single table', () => {
            return session
                .sql(`CREATE TABLE ${schema.getName()}.foo (_id SERIAL)`)
                .execute()
                .then(() => {
                    expect(schema.getTable('foo').getName()).to.equal('foo');
                });
        });

        it('should allow to retrieve the list of existing tables', () => {
            return session
                .sql(`CREATE TABLE ${schema.getName()}.foo (_id SERIAL)`)
                .execute()
                .then(() => {
                    return schema.getTables();
                })
                .then(tables => {
                    expect(tables).to.have.lengthOf(1);
                    expect(tables[0].getName()).to.equal('foo');
                });
        });
    });

    context('available collections', () => {
        it('BUG#28745240 should check if a collection exists in a given schema in the presence of other collections', () => {
            return schema.getCollection('noop').existsInDatabase()
                .then(exists => {
                    return expect(exists).to.be.false;
                })
                .then(() => {
                    return schema.createCollection('test');
                })
                .then(() => {
                    return schema.getCollection('noop').existsInDatabase();
                })
                .then(exists => {
                    return expect(exists).to.be.false;
                });
        });
    });
});
