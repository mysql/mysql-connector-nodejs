'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/integration/fixtures');

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

    afterEach('clear context', () => {
        return fixtures.teardown(session);
    });

    context('with limit', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: 1, name: 'foo' })
                .add({ _id: 2, name: 'bar' })
                .add({ _id: 3, name: 'baz' })
                .execute();
        });

        it('should remove a given number of documents', () => {
            const expected = [{ _id: 3, name: 'baz' }];
            let actual = [];

            return collection
                .remove()
                .limit(2)
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });
});
