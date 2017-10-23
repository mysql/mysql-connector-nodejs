'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');

describe('@integration document collection remove', () => {
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
        it('should remove all documents from a collection', () => {
            let actual = [];

            return collection
                .remove('true')
                .execute()
                .then(() => collection.find().execute(doc => {
                    if (!doc) {
                        return;
                    }

                    actual.push(doc);
                }))
                .then(() => expect(actual).to.be.empty);
        });
    });

    context('with filtering condition', () => {
        it('should remove the documents from a collection that match the criteria', () => {
            const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove('name = "foo"')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should remove the documents from a collection that match a multi-stage bindable criteria', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove('name = :name && _id = :id')
                .bind('id', '2')
                .bind('name', 'bar')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should remove the documents from a collection that match an object bindable criteria', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove('name = :name && _id = :id')
                .bind({ id: '2', name: 'bar' })
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        it('should remove a given number of documents', () => {
            const expected = [{ _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove('true')
                .limit(2)
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('single document removal', () => {
        it('should remove an existing document with the given id', () => {
            const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .removeOne('1')
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(1);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should do nothing if no document exists with the given id', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .removeOne('4')
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
        it('should remove all documents that match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '2', name: 'bar' }];
            let actual = [];

            return collection
                .remove("_id in ('1', '3')")
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('should remove all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            let actual = [];

            return collection
                .remove("_id not in ('1', '3')")
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
