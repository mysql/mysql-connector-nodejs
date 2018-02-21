'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fixtures = require('test/fixtures');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration single document upsert', () => {
    let collection, session, schema;

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
