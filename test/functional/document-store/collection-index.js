'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const util = require('../../util');
const mysqlx = require('../../../');

describe('collection indexes', () => {
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
        it('does not fail to drop a non-existent index', () => {
            return collection.dropIndex('foo')
                .then(result => expect(result).to.be.false);
        });

        it('drops a valid index', () => {
            return collection
                .createIndex('age', {
                    fields: [{
                        field: '$.age',
                        type: 'TINYINT'
                    }]
                })
                .then(() => collection.dropIndex('age'))
                .then(result => expect(result).to.be.true);
        });
    });

    context('creating indexes', () => {
        it('creates a regular index', () => {
            const name = 'zip';
            const expected = ['BTREE', 'YES', null];
            const definition = {
                fields: [{
                    field: '$.zip',
                    type: 'TEXT(10)',
                    required: false
                }]
            };

            return collection.createIndex(name, definition)
                .then(actual => expect(actual).to.be.true)
                .then(() => util.getTableIndex(session, schema.getName(), collection.getName(), name))
                .then(actual => expect(actual).to.deep.equal(expected));
        });

        it('fails to create a duplicate index', () => {
            const index = {
                fields: [{
                    field: '$.zip',
                    type: 'TEXT(10)',
                    required: false
                }]
            };

            return collection.createIndex('zip', index)
                .then(() => {
                    return collection.createIndex('zip', index)
                        .then(() => expect.fail())
                        .catch(err => {
                            expect(err.info).to.include.keys('code');
                            expect(err.info.code).to.equal(1061);
                        });
                });
        });

        it('creates a spatial index', () => {
            const name = 'coords';
            const expected = ['SPATIAL', 'YES', null];
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

            return collection.createIndex(name, index)
                .then(actual => expect(actual).to.be.true)
                .then(() => util.getTableIndex(session, schema.getName(), collection.getName(), name))
                .then(actual => expect(actual).to.deep.equal(expected));
        });

        it('creates a multi-value index', () => {
            const field = '$.tags';
            const name = 'zip';
            const expected = ['BTREE', 'YES', `cast(json_extract(\`doc\`,_utf8mb4\\'${field}\\') as char(50) array)`];
            const definition = {
                fields: [{
                    field,
                    type: 'CHAR(50)',
                    array: true
                }]
            };

            return collection.createIndex(name, definition)
                .then(actual => expect(actual).to.be.true)
                .then(() => util.getTableIndex(session, schema.getName(), collection.getName(), name))
                .then(actual => expect(actual).to.deep.equal(expected));
        });
    });
});
