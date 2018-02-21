'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fixtures = require('test/fixtures');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration document collection indexes', () => {
    let session, schema, collection;

    beforeEach('set context', () => {
        return fixtures.createDatabase().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            session = suite.session;
            schema = suite.schema;
        });
    });

    beforeEach('create collection', () => {
        return schema.createCollection('test');
    });

    beforeEach('update context', () => {
        collection = schema.getCollection('test');
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
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
