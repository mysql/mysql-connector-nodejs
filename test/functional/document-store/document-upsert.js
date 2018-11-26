'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const config = require('test/properties');
const fixtures = require('test/fixtures');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional single document upsert', () => {
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

    context('collection without unique keys', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        it('should add the document with the provided properties if it does not exist', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz', age: 23 }];
            let actual = [];

            return expect(collection.addOrReplaceOne('3', { _id: '1', name: 'baz', age: 23 })).to.be.fulfilled
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(1);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should replace an existing document', () => {
            const expected = [{ _id: '1', age: 23 }, { _id: '2', name: 'bar' }];
            let actual = [];

            return expect(collection.addOrReplaceOne('1', { _id: '3', age: 23 })).to.be.fulfilled
                .then(result => {
                    // the existing row is re-created (leading to two different operations)
                    // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                    expect(result.getAffectedItemsCount()).to.equal(2);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('collection with other unique keys', () => {
        beforeEach('create generated column', () => {
            return session
                .sql(`ALTER TABLE ${schema.getName()}.${collection.getName()} ADD COLUMN name VARCHAR(3) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(doc, '$.name'))) VIRTUAL UNIQUE KEY NOT NULL`)
                .execute();
        });

        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        it('should fail if the document exists but there is a duplicate unique key', () => {
            return expect(collection.addOrReplaceOne('1', { _id: '3', name: 'bar' })).to.be.rejected
                .then(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5116);
                });
        });

        // TODO(Rui): this test is failing due to what seems to be a bug in xplugin.
        it.skip('should fail if the document does not exist and there is a duplicate unique key', () => {
            return expect(collection.addOrReplaceOne('3', { _id: '1', name: 'bar' })).to.be.rejected
                .then(err => {
                    expect(err.info).to.include.keys('code');
                    expect(err.info.code).to.equal(5116);
                });
        });

        it('should replace an existing document when there is no duplicate unique key', () => {
            const expected = [{ _id: '1', name: 'baz' }, { _id: '2', name: 'bar' }];
            let actual = [];

            return expect(collection.addOrReplaceOne('1', { _id: '3', name: 'baz' })).to.be.fulfilled
                .then(result => {
                    // the existing row is re-created (leading to two different operations)
                    // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                    expect(result.getAffectedItemsCount()).to.equal(2);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should replace an existing document with the same unique key', () => {
            const expected = [{ _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar' }];
            let actual = [];

            return expect(collection.addOrReplaceOne('1', { _id: '3', name: 'foo', age: 23 })).to.be.fulfilled
                .then(result => {
                    // the existing row is re-created (leading to two different operations)
                    // see https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html
                    expect(result.getAffectedItemsCount()).to.equal(2);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
