'use strict';

/* eslint-env node, mocha */

const fixtures = require('test/integration/fixtures');

describe('@integration session schema', () => {
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

    it('should allow to create collections', () => {
        const collections = ['test1', 'test2'];
        const expected = {
            [collections[0]]: schema.getCollection(collections[0]),
            [collections[1]]: schema.getCollection(collections[1])
        };

        return Promise.all([
            schema.createCollection(collections[0]),
            schema.createCollection(collections[1]),
            schema.getCollections().should.eventually.deep.equal(expected)
        ]).should.be.fulfilled;
    });

    it('should allow to drop collections', () => {
        const collection = 'test';

        return Promise.all([
            schema.getCollections().should.eventually.be.empty,
            schema.createCollection(collection),
            schema.getCollections().should.eventually.not.be.empty,
            schema.dropCollection(collection),
            schema.getCollections().should.eventually.be.empty
        ]).should.be.fulfilled;
    });
});

