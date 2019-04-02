'use strict';

/* eslint-env node, mocha */

const config = require('../properties');
const expect = require('chai').expect;
const fixtures = require('../fixtures');
const mysqlx = require('../../');

describe('fragments', () => {
    let schema, session, collection;

    beforeEach('create default schema', () => {
        return fixtures.createDefaultSchema();
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(config)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getSchema(config.schema);
    });

    beforeEach('create collection', () => {
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    beforeEach('add fixtures', () => {
        // Make sure the content size exceeds V8's maximum buffer length (currently, 4096 bytes)
        // by, at least, a factor of 2 (to make it simple, the size of the remaining content is ignored).
        return collection.add({ content: 'x'.repeat(4096 * 2) })
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('does not not fail when a message is split into more than two fragments', () => {
        const expected = 'x'.repeat(4096 * 2);

        return collection.find()
            .fields('content')
            .execute(doc => expect(doc.content).to.equal(expected));
    });
});
