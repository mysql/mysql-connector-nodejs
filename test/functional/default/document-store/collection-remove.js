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
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');

describe('removing documents from a collection using CRUD', () => {
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

    afterEach('drop default schema', () => {
        return session.dropSchema(schema.getName());
    });

    afterEach('close session', () => {
        return session.close();
    });

    context('with truthy condition', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes all documents from a collection', () => {
            const actual = [];

            return collection
                .remove('true')
                .execute()
                .then(() => collection.find().execute(doc => {
                    if (!doc) {
                        return;
                    }

                    actual.push(doc);
                }))
                .then(() => expect(actual).to.be.empty);
        });
    });

    context('with filtering condition', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes the documents from a collection that match the criteria', () => {
            const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            const actual = [];

            return collection
                .remove('name = "foo"')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes the documents from a collection that match a multi-stage bindable criteria', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            const actual = [];

            return collection
                .remove('name = :name && _id = :id')
                .bind('id', '2')
                .bind('name', 'bar')
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes the documents from a collection that match an object bindable criteria', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            const actual = [];

            return collection
                .remove('name = :name && _id = :id')
                .bind({ id: '2', name: 'bar' })
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('with limit', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes a given number of documents', () => {
            const expected = [{ _id: '3', name: 'baz' }];
            const actual = [];

            return collection
                .remove('true')
                .limit(2)
                .execute()
                .then(() => collection.find().execute(doc => actual.push(doc)))
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('single document removal', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes an existing document with the given id', () => {
            const expected = [{ _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            const actual = [];

            return collection
                .removeOne('1')
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(1);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('does nothing if no document exists with the given id', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '2', name: 'bar' }, { _id: '3', name: 'baz' }];
            const actual = [];

            return collection
                .removeOne('4')
                .then(result => {
                    expect(result.getAffectedItemsCount()).to.equal(0);

                    return collection
                        .find()
                        .execute(doc => actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('multi-option expressions', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo' })
                .add({ _id: '2', name: 'bar' })
                .add({ _id: '3', name: 'baz' })
                .execute();
        });

        it('removes all documents that match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '2', name: 'bar' }];
            const actual = [];

            return collection
                .remove("_id in ('1', '3')")
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes all documents that do not match a criteria specified by a grouped expression', () => {
            const expected = [{ _id: '1', name: 'foo' }, { _id: '3', name: 'baz' }];
            const actual = [];

            return collection
                .remove("_id not in ('1', '3')")
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('removal order', () => {
        beforeEach('add fixtures', () => {
            return collection
                .add({ _id: '1', name: 'foo', age: 23 })
                .add({ _id: '2', name: 'bar', age: 42 })
                .add({ _id: '3', name: 'baz', age: 23 })
                .execute();
        });

        it('removes documents with a given order provided as an expression array', () => {
            const expected = [{ _id: '1', name: 'foo', age: 23 }, { _id: '2', name: 'bar', age: 42 }];
            const actual = [];

            return collection
                .remove('true')
                .limit(1)
                .sort(['age ASC', 'name ASC'])
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });

        it('removes documents with a given order provided as multiple expressions', () => {
            const expected = [{ _id: '1', name: 'foo', age: 23 }];
            const actual = [];

            return collection
                .remove('true')
                .limit(2)
                .sort('age DESC', 'name ASC')
                .execute()
                .then(() => {
                    return collection
                        .find()
                        .execute(doc => doc && actual.push(doc));
                })
                .then(() => expect(actual).to.deep.equal(expected));
        });
    });

    context('BUG#30401962 affected items', () => {
        beforeEach('add fixtures', () => {
            return collection.add({ name: 'foo' }, { name: 'bar' }, { name: 'baz' })
                .execute();
        });

        context('without limit', () => {
            it('returns the number of documents that have been removed from the collection', () => {
                return collection.remove('true')
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(3));
            });
        });

        context('with limit', () => {
            it('returns the number of documents that have been removed from the collection', () => {
                const limit = 2;

                return collection.remove('true')
                    .limit(limit)
                    .execute()
                    .then(res => expect(res.getAffectedItemsCount()).to.equal(limit));
            });
        });
    });

    context('when debug mode is enabled', () => {
        beforeEach('populate collection', () => {
            return collection.add({ name: 'foo', count: 2 })
                .add({ name: 'bar', count: 5 })
                .add({ name: 'foo', count: 10 })
                .execute();
        });

        it('logs the basic operation parameters', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'remove.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Delete', script, [schema.getName(), collection.getName()])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudDelete = proc.logs[0];
                    expect(crudDelete).to.contain.keys('collection', 'data_model');
                    expect(crudDelete.collection).to.contain.keys('name', 'schema');
                    expect(crudDelete.collection.name).to.equal(collection.getName());
                    expect(crudDelete.collection.schema).to.equal(schema.getName());
                    expect(crudDelete.data_model).to.equal('DOCUMENT');
                });
        });

        it('logs the criteria statement data', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'remove-with-criteria.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Crud.Delete', script, [schema.getName(), collection.getName(), 'count = 10'])
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);

                    const crudDelete = proc.logs[0];
                    expect(crudDelete).to.contain.keys('criteria');
                    expect(crudDelete.criteria).to.contain.keys('type', 'operator');
                    expect(crudDelete.criteria.type).to.equal('OPERATOR');
                    expect(crudDelete.criteria.operator).to.contain.keys('name', 'param');
                    expect(crudDelete.criteria.operator.name).to.equal('==');
                    expect(crudDelete.criteria.operator.param).to.be.an('array').and.have.lengthOf(2);
                    expect(crudDelete.criteria.operator.param[0]).to.contain.keys('type', 'identifier');
                    expect(crudDelete.criteria.operator.param[0].type).to.equal('IDENT');
                    expect(crudDelete.criteria.operator.param[0].identifier).contain.keys('document_path');
                    expect(crudDelete.criteria.operator.param[0].identifier.document_path).to.be.an('array').and.have.lengthOf(1);
                    expect(crudDelete.criteria.operator.param[0].identifier.document_path[0]).to.contain.keys('type', 'value');
                    expect(crudDelete.criteria.operator.param[0].identifier.document_path[0].type).to.equal('MEMBER');
                    expect(crudDelete.criteria.operator.param[0].identifier.document_path[0].value).to.equal('count');
                    expect(crudDelete.criteria.operator.param[1]).to.contain.keys('type', 'literal');
                    expect(crudDelete.criteria.operator.param[1].type).to.equal('LITERAL');
                    expect(crudDelete.criteria.operator.param[1].literal).to.contain.keys('type', 'v_unsigned_int');
                    expect(crudDelete.criteria.operator.param[1].literal.type).to.equal('V_UINT');
                    expect(crudDelete.criteria.operator.param[1].literal.v_unsigned_int).to.equal(10);
                });
        });

        it('logs the table changes metadata', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'document-store', 'remove.js');

            return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script, [schema.getName(), collection.getName()])
                .then(proc => {
                    // LOCAL notices are decoded twice (needs to be improved)
                    // so there are no assurances about the correct length
                    expect(proc.logs).to.have.length.above(0);

                    const rowsAffectedNotice = proc.logs[proc.logs.length - 1];
                    expect(rowsAffectedNotice).to.have.keys('type', 'scope', 'payload');
                    expect(rowsAffectedNotice.type).to.equal('SESSION_STATE_CHANGED');
                    expect(rowsAffectedNotice.scope).to.equal('LOCAL');
                    expect(rowsAffectedNotice.payload).to.have.keys('param', 'value');
                    expect(rowsAffectedNotice.payload.param).to.equal('ROWS_AFFECTED');
                    expect(rowsAffectedNotice.payload.value).to.be.an('array').and.have.lengthOf(1);
                    expect(rowsAffectedNotice.payload.value[0]).to.have.keys('type', 'v_unsigned_int');
                    expect(rowsAffectedNotice.payload.value[0].type).to.equal('V_UINT');
                    expect(rowsAffectedNotice.payload.value[0].v_unsigned_int).to.equal(3);
                });
        });
    });
});
