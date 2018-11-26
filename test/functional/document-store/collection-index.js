'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const fixtures = require('test/fixtures');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional collection indexes', () => {
    let schema, session, collection;

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

    beforeEach('create collection', () => {
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('dropping indexes', () => {
        it('should not drop non-existent index', () => {
            return expect(collection.dropIndex('foo')).to.be.rejected;
        });

        it('should drop a valid index', () => {
            return collection
                .createIndex('age', {
                    fields: [{
                        field: '$.age',
                        type: 'TINYINT'
                    }]
                })
                .then(() => {
                    return expect(collection.dropIndex('age')).to.be.fulfilled;
                });
        });
    });

    context('creating indexes', () => {
        it('should create regular index', () => {
            const index = {
                fields: [{
                    field: '$.zip',
                    type: 'TEXT(10)',
                    required: false
                }]
            };

            return expect(collection.createIndex('zip', index)).to.eventually.be.true;
        });

        it('should fail to create duplicate index', () => {
            const index = {
                fields: [{
                    field: '$.zip',
                    type: 'TEXT(10)',
                    required: false
                }]
            };

            return collection
                .createIndex('zip', index)
                .then(() => {
                    return expect(collection.createIndex('zip', index)).to.be.rejected;
                });
        });

        it('should create spatial index', () => {
            const index = {
                fields: [{
                    field: '$.coords',
                    type: 'GEOJSON',
                    required: true,
                    options: 2,
                    srid: 4326
                }],
                type: 'SPATIAL'
            };

            return expect(collection.createIndex('coords', index)).to.be.fulfilled;
        });
    });
});
