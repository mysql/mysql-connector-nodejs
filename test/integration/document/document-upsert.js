'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fixtures = require('test/fixtures');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration single document upsert', () => {
    let session, schema;

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    context('for MySQL >= 8.0.3', () => {
        let collection;

        beforeEach('set context', function () {
            if (process.env.NODE_TEST_MYSQL_VERSION !== '8.0.3') {
                return this.skip();
            }

            return fixtures.setup().then(suite => {
                // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
                session = suite.session;
                schema = suite.schema;
            });
        });

        beforeEach('create collection', function () {
            if (process.env.NODE_TEST_MYSQL_VERSION !== '8.0.3') {
                return this.skip();
            }

            return schema.createCollection('test');
        });

        beforeEach('update context', function () {
            if (process.env.NODE_TEST_MYSQL_VERSION !== '8.0.3') {
                return this.skip();
            }

            collection = schema.getCollection('test');
        });

        beforeEach('add fixtures', function () {
            if (process.env.NODE_TEST_MYSQL_VERSION !== '8.0.3') {
                return this.skip();
            }

            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        context('collection without unique keys', () => {
            it('should replace an existing document', function () {
                if (process.env.NODE_TEST_MYSQL_VERSION !== '8.0.3') {
                    return this.skip();
                }

                const expected = [{ _id: '1', age: 23 }, { _id: '2', name: 'bar' }];
                let actual = [];

                return expect(collection.addOrReplaceOne('1', { _id: '3', age: 23 })).to.be.fulfilled
                    .then(result => {
                        // the existing row is re-created (leading to two different operations)
                        // see https://dev.mysql.com/doc/refman/5.7/en/insert-on-duplicate.html
                        expect(result.getAffectedItemsCount()).to.equal(2);

                        return collection
                            .find()
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });

        context('collection with other unique keys', () => {
            it('should replace an existing document when there is no duplicate unique key', function () {
                if (process.env.NODE_TEST_MYSQL_VERSION !== '8.0.3') {
                    return this.skip();
                }

                const expected = [{ _id: '1', name: 'baz' }, { _id: '2', name: 'bar' }];
                let actual = [];

                return expect(collection.addOrReplaceOne('1', { _id: '3', name: 'baz' })).to.be.fulfilled
                    .then(result => {
                        // the existing row is re-created (leading to two different operations)
                        // see https://dev.mysql.com/doc/refman/5.7/en/insert-on-duplicate.html
                        expect(result.getAffectedItemsCount()).to.equal(2);

                        return collection
                            .find()
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => expect(actual).to.deep.equal(expected));
            });

            it('should replace an existing document with the same unique key', function () {
                if (process.env.NODE_TEST_MYSQL_VERSION !== '8.0.3') {
                    return this.skip();
                }

                const expected = [{ _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar' }];
                let actual = [];

                return expect(collection.addOrReplaceOne('1', { _id: '3', name: 'foo', age: 23 })).to.be.fulfilled
                    .then(result => {
                        // the existing row is re-created (leading to two different operations)
                        // see https://dev.mysql.com/doc/refman/5.7/en/insert-on-duplicate.html
                        expect(result.getAffectedItemsCount()).to.equal(2);

                        return collection
                            .find()
                            .execute(doc => actual.push(doc));
                    })
                    .then(() => expect(actual).to.deep.equal(expected));
            });
        });
    });

    context('for MySQL >= 5.7.12', () => {
        let collection;

        beforeEach('set context', () => {
            return fixtures.setup().then(suite => {
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

        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .execute();
        });

        context('collection without unique keys', () => {
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
        });

        context('collection with other unique keys', () => {
            beforeEach('create generated column', () => {
                return session
                    .sql(`ALTER TABLE ${schema.getName()}.${collection.getName()} ADD COLUMN name VARCHAR(3) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(doc, '$.name'))) VIRTUAL UNIQUE KEY NOT NULL`)
                    .execute();
            });

            it('should fail if the document exists but there is a duplicate unique key', () => {
                return expect(collection.addOrReplaceOne('1', { _id: '3', name: 'bar' })).to.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(5116);
                    });
            });

            it.skip('should fail if the document does not exist and there is a duplicate unique key', () => {
                return expect(collection.addOrReplaceOne('3', { _id: '1', name: 'bar' })).to.be.rejected
                    .then(err => {
                        expect(err.info).to.include.keys('code');
                        expect(err.info.code).to.equal(5116);
                    });
            });
        });
    });
});
