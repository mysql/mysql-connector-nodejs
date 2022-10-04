/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');

describe('finding documents in collections using CRUD with multi-value lookup criteria', () => {
    const baseConfig = { schema: config.schema || 'mysql-connector-nodejs_test' };

    let schema, session, collection;

    beforeEach('create default schema', () => {
        return fixtures.createSchema(baseConfig.schema);
    });

    beforeEach('create session using default schema', () => {
        const defaultConfig = Object.assign({}, config, baseConfig);

        return mysqlx.getSession(defaultConfig)
            .then(s => {
                session = s;
            });
    });

    beforeEach('load default schema', () => {
        schema = session.getDefaultSchema();
    });

    beforeEach('create collection', () => {
        return schema.createCollection('test')
            .then(c => {
                collection = c;
            });
    });

    beforeEach('add fixtures', () => {
        return collection
            .add({ _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } })
            .add({ _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } })
            .add({ _id: 3, categories: ['MySQL', 'Shell'], author: 48, reviewers: [48, 48] })
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    it('returns all documents where some field contains a given value', () => {
        const expected = [{ _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } }];
        const actual = [];

        return collection
            .find("'DocumentStore' in categories")
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('returns all documents where some field does not contain a given value', () => {
        const expected = [
            { _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } },
            { _id: 3, categories: ['MySQL', 'Shell'], author: 48, reviewers: [48, 48] }
        ];
        const actual = [];

        return collection
            .find("'DocumentStore' not in categories")
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('returns all documents where some field contains the value of another field', () => {
        const expected = [
            { _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } },
            { _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } },
            { _id: 3, categories: ['MySQL', 'Shell'], author: 48, reviewers: [48, 48] }
        ];
        const actual = [];

        return collection
            .find('author in reviewers')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('returns all documents where some field does not contain the value of another field', () => {
        const expected = [];
        const actual = [];

        return collection
            .find('author not in reviewers')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('returns all documents where the value of some field exists in a given set of values', () => {
        const expected = [
            { _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } },
            { _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } }
        ];
        const actual = [];

        return collection
            .find('author in [45, 46]')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('returns all documents where the value of some field does not exist in a given set of values', () => {
        const expected = [{ _id: 3, categories: ['MySQL', 'Shell'], author: 48, reviewers: [48, 48] }];
        const actual = [];

        return collection
            .find('author not in [45, 46]')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('returns all documents where some nested field contains a given value', () => {
        const expected = [{ _id: 1, categories: ['DocumentStore'], author: 45, reviewers: [45], meta: { foo: 'bar', baz: 'qux' } }];
        const actual = [];

        return collection
            .find('{ "foo": "bar" } in meta')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('returns all documents where some nested field does not contain a given value', () => {
        const expected = [{ _id: 2, categories: ['InnoDB cluster'], author: 46, reviewers: [45, 46], meta: { foo: 'baz' } }];
        const actual = [];

        return collection
            .find('{ "foo": "bar" } not in meta')
            .execute(post => post && actual.push(post))
            .then(() => expect(actual).to.deep.equal(expected));
    });

    it('fails if the left-side operand is not castable to JSON', () => {
        return collection.find('(1+2) in [1, 2, 3]').execute()
            .then(() => {
                return expect.fail();
            })
            .catch(err => {
                expect(err.info).to.include.keys('code');
                return expect(err.info.code).to.equal(errors.ER_X_EXPR_BAD_VALUE);
            });
    });
});
