'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/integration/fixtures');

describe('@slow document collection add', () => {
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

    afterEach('clear context', () => {
        return fixtures.teardown(session);
    });

    context('with a single call', () => {
        it('should add documents provided as an array', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            let actual = [];

            return collection
                .add(documents)
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'foo'));
                });
        });

        it('should add documents provided as multiple arguments', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }];
            let actual = [];

            return collection
                .add(documents[0], documents[1])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'foo'));
                });
        });
    });

    context('with multiple calls', () => {
        it('should add documents provided as an array', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'qux' }];
            let actual = [];

            return collection
                .add(documents[0])
                .add([documents[1], documents[2]])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'foo'));
                });
        });

        it('should add documents provided as multiple arguments', () => {
            const documents = [{ foo: 'bar' }, { foo: 'baz' }, { foo: 'qux' }];
            let actual = [];

            return collection
                .add(documents[0])
                .add(documents[1], documents[2])
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => {
                    expect(actual).to.have.lengthOf(documents.length);
                    actual.forEach(doc => expect(doc).to.have.all.keys('_id', 'foo'));
                });
        });
    });
});
