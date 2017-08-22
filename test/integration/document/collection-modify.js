'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');

describe('@integration document collection modify', () => {
    let session, schema, collection;

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
            .add({ _id: '3', name: 'baz' })
            .execute();
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    context('with truthy condition', () => {
        it('should updated all documents in a collection', () => {
            const expected = [{ _id: '1', name: 'qux' }, { _id: '2', name: 'qux' }, { _id: '3', name: 'qux' }];
            let actual = [];

            return collection
                .modify('true')
                .set('$.name', 'qux')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with filtering condition', () => {
        it('should update the documents from a collection that match the criteria', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'qux' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .modify('$.name == "bar"')
                .set('$.name', 'qux')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        it('should modify a given number of documents', () => {
            const expected = [{ _id: '1', name: 'qux' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .modify('true')
                .set('$.name', 'qux')
                .limit(1)
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('single document replacement', () => {
        it('should replace the entire document if it exists', () => {
            const expected = [{ _id: '1', age: 23 }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .replaceOne('1', { _id: '3', age: 23 })
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(1);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should do nothing if the document does not exist', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .replaceOne('4', { _id: '1', name: 'baz', age: 23 })
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(0);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        it('should modify all documents that match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '1', name: 'qux' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'qux' }];
            let actual = [];

            return collection
                .modify("$._id in ('1', '3')")
                .set('$.name', 'qux')
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should modify all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'qux' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .modify("$._id not in ('1', '3')")
                .set('$.name', 'qux')
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
