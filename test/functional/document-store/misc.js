'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const fixtures = require('../../fixtures');
const mysqlx = require('../../../');

// TODO(rui.quelhas): extract tests into proper self-contained suites.
describe('collection miscellaneous tests', () => {
    let schema, session;

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
        return schema.createCollection('test');
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('checks if a collection exists in the database', () => {
        return schema.createCollection('foobar')
            .then(collection => collection.existsInDatabase())
            .then(result => expect(result).to.be.true);
    });

    it('checks if a collection does not exist in the database', () => {
        var collection = schema.getCollection('foobar');

        return collection.existsInDatabase()
            .then(result => expect(result).to.be.false);
    });

    it('creates a collection with the given name', () => {
        return schema.createCollection('foobar')
            .then(collection => expect(collection.getName()).to.equal('foobar'));
    });

    it('creates a collection within the appropriate schema', () => {
        return schema.createCollection('foobar')
            .then(collection => expect(collection.getSchema().getName()).to.deep.equal(schema.getName()));
    });

    it('@regression does not apply padding when retrieving server-side auto-generated _id values using SQL', () => {
        const ids = [];

        return schema.getCollection('test').add({ name: 'foo' })
            .execute()
            .then(() => {
                return session.sql(`SELECT _id FROM ${schema.getName()}.test`)
                    .execute(row => ids.push(row[0]));
            })
            .then(() => ids.forEach(id => expect(id).to.have.lengthOf(28)));
    });

    context('collection size', () => {
        beforeEach('ensure non-existing collection', () => {
            return schema.dropCollection('noop');
        });

        beforeEach('add fixtures', () => {
            return schema.getCollection('test')
                .add({ name: 'foo' })
                .add({ name: 'bar' })
                .add({ name: 'baz' })
                .execute();
        });

        it('retrieves the total number of documents in a collection', () => {
            return schema.getCollection('test').count()
                .then(actual => expect(actual).to.equal(3));
        });

        it('fails if the collection does not exist in the given schema', () => {
            return schema.getCollection('noop').count()
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Collection '${schema.getName()}.noop' doesn't exist`));
        });
    });

    context('collections in the schema', () => {
        it('checks if a collection exists in the database', () => {
            return schema.createCollection('foo')
                .then(() => schema.getCollection('foo').existsInDatabase())
                .then(exists => expect(exists).to.be.true);
        });

        it('distinguishes tables from collections', () => {
            return schema.createCollection('foo')
                .then(() => schema.getTable('foo').existsInDatabase())
                .then(exists => expect(exists).to.be.false);
        });
    });
});
