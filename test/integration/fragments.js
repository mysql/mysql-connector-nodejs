'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('test/fixtures');

describe('@integration fragments', () => {
    let session, schema, collection;

    beforeEach('set context', () => {
        return fixtures.createDatabase().then(suite => {
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

    beforeEach('add fixtures', () => {
        // Make sure the content size exceeds V8's maximum buffer length (currently, 4096 bytes)
        // by, at least, a factor of 2 (to make it simple, the size of the remaining content is ignored).
        return collection
            .add({ content: 'x'.repeat(4096 * 2) })
            .execute();
    });

    it('should not fail when a message is split into more than two fragments', () => {
        const expected = 'x'.repeat(4096 * 2);

        return collection
            .find()
            .fields('content')
            .execute(doc => expect(doc.content).to.equal(expected));
    });
});
