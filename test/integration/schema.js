'use strict';

/* eslint-env node, mocha */

const fixtures = require('test/fixtures');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

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
        return fixtures.teardown(session, schema);
    });

    it('should allow to create collections', () => {
        const collections = ['test1', 'test2'];

        return expect(Promise.all([
            schema.createCollection(collections[0]),
            schema.createCollection(collections[1]),
            schema.getCollections()
        ])).to.be.fulfilled.then(result => {
            expect(Object.keys(result[2])).to.have.lengthOf(2);
            expect(result[2]).to.have.keys(collections);
            expect(result[2][collections[0]].inspect()).to.deep.equal(result[0].inspect());
            expect(result[2][collections[1]].inspect()).to.deep.equal(result[1].inspect());
        });
    });

    context('dropping collections', () => {
        it('should allow to drop an existing collection', () => {
            const collection = 'test';

            return expect(Promise.all([
                expect(schema.getCollections()).to.eventually.be.empty,
                schema.createCollection(collection),
                expect(schema.getCollections()).to.eventually.not.be.empty,
                schema.dropCollection(collection),
                expect(schema.getCollections()).to.eventually.be.empty
            ])).to.eventually.be.fulfilled;
        });

        it('should not fail to drop non-existent collections', () => {
            return expect(schema.dropCollection('test')).to.eventually.be.fulfilled;
        });

        it('should fail to drop a collection with an empty name', () => {
            return expect(schema.dropCollection('')).to.eventually.be.rejected;
        });

        it('should fail to drop a collection with an invalid name', () => {
            return expect(schema.dropCollection(' ')).to.eventually.be.rejected;
        });

        it('should fail to drop a collection with name set to `null`', () => {
            return expect(schema.dropCollection(null)).to.eventually.be.rejected;
        });
    });
});
