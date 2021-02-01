/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');

describe('autonomous prepared statements for collections without server support', () => {
    let collection, schema, session;

    // server container defined in docker.compose.yml
    const baseConfig = { host: 'mysql-8.0.3', socket: undefined };

    beforeEach('create default schema', () => {
        return fixtures.createSchema(config.schema, baseConfig);
    });

    beforeEach('create session using default schema', () => {
        return mysqlx.getSession(Object.assign({}, config, baseConfig))
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
        return collection
            .add({ _id: '1', name: 'foo' })
            .add({ _id: '2', name: 'bar' })
            .add({ _id: '3', name: 'baz' })
            .execute();
    });

    afterEach('drop default schema', () => {
        return session.dropSchema(config.schema);
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('find', () => {
        it('falls back to the regular execution mode', () => {
            const expected = [{ _id: '1' }, { _id: '2' }, { _id: '3' }];
            const actual = [];

            const op = collection.find('name = :name').fields('_id');
            const names = ['foo', 'bar', 'baz'];

            return Promise.all(names.map(name => op.bind('name', name).execute(doc => actual.push(doc))))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('modify', () => {
        it('falls back to the regular execution mode', () => {
            const expected = [{ _id: '1', name: 'qux' }, { _id: '2', name: 'qux' }, { _id: '3', name: 'qux' }];
            const actual = [];

            const op = collection.modify('name = :name').set('name', 'qux');
            const names = ['foo', 'bar', 'baz'];

            return Promise.all(names.map(name => op.bind('name', name).execute()))
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('remove', () => {
        it('falls back to the regular execution mode', () => {
            const actual = [];

            const op = collection.remove('name = :name');
            const names = ['foo', 'bar', 'baz'];

            return Promise.all(names.map(name => op.bind('name', name).execute()))
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.be.empty);
        });
    });
});
