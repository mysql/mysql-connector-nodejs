'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const fixtures = require('test/fixtures');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

// TODO(rui.quelhas): extract tests into proper self-contained suites.
describe('@functional collection miscellaneous tests', () => {
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

    it('should retrieve an existing document from the collection', () => {
        const expected = {
            _id: 'efefevvr',
            here: {
                we: 'do',
                have: 1,
                great: 'object'
            }
        };

        return collection
            .add(expected)
            .execute()
            .then(() => {
                return collection.find().execute(actual => expect(actual).to.deep.equal(expected));
            });
    });

    it('should retrieve a modified document from the collection', () => {
        const document = {
            _id: 'efefevvr',
            here: {
                we: 'do',
                have: 1,
                great: 'object'
            }
        };

        const expected = {
            _id: 'efefevvr',
            here: 'all is gone'
        };

        return Promise.all([
            collection.add(document).execute(),
            collection.modify(`_id = '${document._id}'`).set('here', 'all is gone').execute()
        ]).then(() => {
            return collection.find().execute(actual => expect(actual).to.deep.equal(expected));
        });
    });

    it('should not retrieve a document that was removed from the collection', () => {
        const document = {
            _id: 'efefevvr',
            here: {
                we: 'do',
                have: 1,
                great: 'object'
            }
        };

        return Promise.all([
            collection.add(document).execute(),
            collection.find().execute(),
            collection.remove(`_id = '${document._id}'`).execute()
        ]).then(() => {
            return collection.find().execute(actual => expect(actual).to.be.undefined);
        });
    });

    it('should respect limit when deleting documents', () => {
        const document1 = { _id: 'document1' };
        const document2 = { _id: 'document2' };

        return Promise.all([
            collection.add([document1, document2]).execute(),
            collection.remove('true').limit(1).execute()
        ]).then(() => {
            return collection.find().execute(actual => expect(actual).to.deep.equal(document2));
        });
    });

    it('should check if a collection exists in the database', () => {
        return schema
            .createCollection('foobar')
            .then(collection => collection.existsInDatabase())
            .then(result => expect(result).to.be.true);
    });

    it('should create a collection with the given name', () => {
        return schema
            .createCollection('foobar')
            .then(collection => expect(collection.getName()).to.equal('foobar'));
    });

    it('should create a collection within the appropriate schema', () => {
        return schema
            .createCollection('foobar')
            .then(collection => expect(collection.getSchema().getName()).to.deep.equal(schema.getName()));
    });

    it('@regression should not apply padding when retrieving server-side auto-generated _id values using SQL', () => {
        const ids = [];

        return schema
            .getCollection('test')
            .add({ name: 'foo' })
            .execute()
            .then(() => {
                return session
                    .sql(`SELECT _id FROM ${schema.getName()}.test`)
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

        it('should retrieve the total number of documents in a collection', () => {
            return expect(schema.getCollection('test').count()).to.eventually.equal(3);
        });

        it('should fail if the collection does not exist in the given schema', () => {
            return expect(schema.getCollection('noop').count()).to.be.rejectedWith(`Collection '${schema.getName()}.noop' doesn't exist`);
        });
    });
});
