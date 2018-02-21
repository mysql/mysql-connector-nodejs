'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fixtures = require('test/fixtures');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@integration document collection contains', () => {
    let session, schema, collection;

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

    beforeEach('add fixtures', () => {
        return collection
            .add({ _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } })
            .add({ _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } })
            .add({ _id: 3, categories: ['MySQL', 'Shell'], author: 48, reviewers: [48, 48] })
            .execute();
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session, schema);
    });

    it('should return all documents where some field contains a given value', () => {
        const expected = [{ _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } }];
        let actual = [];

        return collection
            .find("'DocumentStore' in categories")
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should return all documents where some field does not contain a given value', () => {
        const expected = [
            { _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } },
            { _id: 3, categories: ['MySQL', 'Shell'], author: 48, reviewers: [48, 48] }
        ];
        let actual = [];

        return collection
            .find("'DocumentStore' not in categories")
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should return all documents where some field contains the value of another field', () => {
        const expected = [
            { _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } },
            { _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } },
            { _id: 3, categories: ['MySQL', 'Shell'], author: 48, reviewers: [48, 48] }
        ];
        let actual = [];

        return collection
            .find('author in reviewers')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should return all documents where some field does not contain the value of another field', () => {
        const expected = [];
        let actual = [];

        return collection
            .find('author not in reviewers')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should return all documents where the value of some field exists in a given set of values', () => {
        const expected = [
            { _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } },
            { _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } }
        ];
        let actual = [];

        return collection
            .find('author in [45, 46]')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should return all documents where the value of some field does not exist in a given set of values', () => {
        const expected = [{ _id: 3, categories: ['MySQL', 'Shell'], author: 48, reviewers: [48, 48] }];
        let actual = [];

        return collection
            .find('author not in [45, 46]')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should return all documents where some nested field contains a given value', () => {
        const expected = [{ _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } }];
        let actual = [];

        return collection
            .find('{ "foo": "bar" } in meta')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should return all documents where some nested field does not contain a given value', () => {
        const expected = [{ _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } }];
        let actual = [];

        return collection
            .find('{ "foo": "bar" } not in meta')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('should fail if the left-side operand is not castable to JSON', () => {
        return expect(collection.find('(1+2) in [1, 2, 3]').execute()).to.be.rejected
            .then(err => {
                expect(err.info).to.include.keys('code');
                expect(err.info.code).to.equal(5154);
            });
    });
});
