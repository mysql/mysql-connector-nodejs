'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const fixtures = require('test/integration/fixtures');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe.only('@integration miscellaneous', () => {
    let session, schema;

    beforeEach('set context', () => {
        return fixtures.setup().then(suite => {
            // TODO(rui.quelhas): use ES6 destructuring assignment for node >=6.0.0
            session = suite.session;
            schema = suite.schema;
        });
    });

    afterEach('clear context', () => {
        return fixtures.teardown(session);
    });

    context('collection `fields()` according to the shell implementation', () => {
        beforeEach('setup', () => {
            return schema
                .createCollection('test')
                .then(collection => {
                    return collection
                        .add({ name: 'foo', weight: 2 })
                        .add({ name: 'bar', weight: 3 })
                        .add({ name: 'baz', weight: 1 })
                        .execute();
                });
        });

        it('should work like', () => {
            const expected = [{ name: 'foo', weight: 2 }, { name: 'bar', weight: 3 }, { name: 'baz', weight: 1 }];
            let actual = [];

            return schema
                .getCollection('test')
                .find()
                .fields(['name', 'weight'])
                .execute(doc => actual.push(doc))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('collection `groupBy()`', () => {
        it('should work like', () => {
            const CollectionFind = require('lib/DevAPI/CollectionFind');
            const query = new CollectionFind();

            expect(() => query.groupBy(['name', 'weight'])).to.not.throw(Error);
        });
    });

    context('collection `sort()`', () => {
        it('should work like', () => {
            const CollectionFind = require('lib/DevAPI/CollectionFind');
            const query = new CollectionFind();

            expect(() => query.sort(['name desc'])).to.not.throw(Error);
        });
    });

    context('collection `add()` behaviour', () => {
        it('should work like', () => {
            const promise = schema.createCollection('test')
                .then(collection => {
                    return collection
                        .add([])
                        .execute();
                });

            return expect(promise).to.not.be.rejected;
        });
    });
});
