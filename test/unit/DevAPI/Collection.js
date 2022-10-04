/*
 * Copyright (c) 2016, 2022, Oracle and/or its affiliates.
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

const expect = require('chai').expect;
const errors = require('../../../lib/constants/errors');
const td = require('testdouble');

// subject under test needs to be reloaded with test doubles
let Collection = require('../../../lib/DevAPI/Collection');

describe('Collection factory function', () => {
    let DatabaseObject;

    beforeEach('replace dependencies with test doubles', () => {
        DatabaseObject = td.replace('../../../lib/DevAPI/DatabaseObject');
        // reload module with the replacements
        Collection = require('../../../lib/DevAPI/Collection');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('add()', () => {
        let CollectionAdd;

        beforeEach('replace dependencies with test doubles', () => {
            CollectionAdd = td.replace('../../../lib/DevAPI/CollectionAdd');
            // reload module with the replacements
            Collection = require('../../../lib/DevAPI/Collection');
        });

        it('creates a CollectionAdd statement inserting documents provided as an array', () => {
            const add = td.function();
            const connection = 'foo';
            const documents = [{ name: 'bar' }, { name: 'baz' }];
            const expected = 'qux';
            const schema = 'quux';
            const tableName = 'quuz';

            td.when(CollectionAdd({ connection, schema, tableName })).thenReturn({ add });
            td.when(add(documents)).thenReturn(expected);

            return expect(Collection({ connection, schema, tableName }).add(documents)).to.equal(expected);
        });

        it('creates a CollectionAdd statement inserting documents provided as multiple arguments', () => {
            const add = td.function();
            const connection = 'foo';
            const documents = [{ name: 'bar' }, { name: 'baz' }];
            const expected = 'qux';
            const schema = 'quux';
            const tableName = 'quuz';

            td.when(CollectionAdd({ connection, schema, tableName })).thenReturn({ add });
            td.when(add(documents)).thenReturn(expected);

            return expect(Collection({ connection, schema, tableName }).add(documents[0], documents[1])).to.equal(expected);
        });
    });

    context('addOrReplaceOne()', () => {
        let CollectionAdd;

        beforeEach('create fakes', () => {
            CollectionAdd = td.replace('../../../lib/DevAPI/CollectionAdd');
            // reload module with the replacements
            Collection = require('../../../lib/DevAPI/Collection');
        });

        it('creates and executes a CollectionAdd statement replacing a given document', () => {
            const add = td.function();
            const connection = 'foo';
            const doc = { name: 'bar' };
            const execute = td.function();
            const expected = 'baz';
            const id = 'qux';
            const schema = 'quux';
            const tableName = 'quuz';

            td.when(CollectionAdd({ connection, schema, tableName, upsert: true })).thenReturn({ add });
            td.when(add({ _id: id, ...doc })).thenReturn({ execute });
            td.when(execute()).thenResolve(expected);

            return Collection({ connection, schema, tableName }).addOrReplaceOne(id, doc)
                .then(got => expect(got).to.equal(expected));
        });

        it('sanitizes the document id that is being used for the replacement', () => {
            const add = td.function();
            const connection = 'foo';
            const doc = { name: 'bar' };
            const execute = td.function();
            const expected = 'baz';
            const id = 'qu"x';
            const schema = 'quux';
            const tableName = 'quuz';

            td.when(CollectionAdd({ connection, schema, tableName, upsert: true })).thenReturn({ add });
            td.when(add({ _id: 'qu\\"x', ...doc })).thenReturn({ execute });
            td.when(execute()).thenResolve(expected);

            return Collection({ connection, schema, tableName }).addOrReplaceOne(id, doc)
                .then(got => expect(got).to.equal(expected));
        });

        it('creates and executes a CollectionAdd statement when the document contains the given id', () => {
            const add = td.function();
            const connection = 'foo';
            const doc = { _id: 'bar', name: 'baz' };
            const execute = td.function();
            const expected = 'qux';
            const schema = 'quux';
            const tableName = 'quuz';

            td.when(CollectionAdd({ connection, schema, tableName, upsert: true })).thenReturn({ add });
            td.when(add(doc)).thenReturn({ execute });
            td.when(execute()).thenResolve(expected);

            return Collection({ connection, schema, tableName }).addOrReplaceOne(doc._id, doc)
                .then(got => expect(got).to.equal(expected));
        });

        it('fails to create a CollectionAdd statement when the document id and the given id do not match', () => {
            return Collection().addOrReplaceOne('foo', { _id: 'baz', name: 'bar' })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_DOCUMENT_ID_MISMATCH);
                });
        });
    });

    context('count()', () => {
        let SqlExecute;

        beforeEach('replace dependencies with test doubles', () => {
            SqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
            // reload module with the replacements
            Collection = require('../../../lib/DevAPI/Collection');
        });

        it('creates and executes an SqlExecute statement that counts the number of documents in a collection', () => {
            const total = 3;
            const connection = 'foo';
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const tableName = 'baz';

            td.when(SqlExecute(connection, `SELECT COUNT(*) FROM \`${schemaName}\`.\`${tableName}\``)).thenReturn({ execute });
            td.when(execute(td.callback([total]))).thenResolve();

            return Collection({ connection, schema, tableName }).count()
                .then(actual => expect(actual).to.equal(total));
        });

        it('fails to execute an SqlExecute statement when the server reports an unexpected error', () => {
            const connection = 'foo';
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const tableName = 'baz';
            const errorMessage = 'qux';
            const error = new Error(errorMessage);
            error.info = { msg: errorMessage };

            td.when(SqlExecute(), { ignoreExtraArgs: true }).thenReturn({ execute });
            td.when(execute(), { ignoreExtraArgs: true }).thenReject(error);

            return Collection({ connection, schema, tableName }).count()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err).to.deep.equal(error);
                });
        });

        // Maybe this will become a responsability of the X Plugin at some point in the future.
        it('replaces occurences of "Table" for "Collection" in server-reported error messages', () => {
            const connection = 'foo';
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const tableName = 'baz';
            const errorMessage = `Table '${schemaName}.${tableName}' doesn't exist.`;
            const error = new Error(errorMessage);
            error.info = { msg: errorMessage };

            td.when(SqlExecute(), { ignoreExtraArgs: true }).thenReturn({ execute });
            td.when(execute(), { ignoreExtraArgs: true }).thenReject(error);

            return Collection({ connection, schema, tableName }).count()
                .then(() => {
                    expect.fail();
                })
                .catch(err => {
                    expect(err.message).to.equal("Collection 'bar.baz' doesn't exist.");
                    return expect(err.info.msg).to.equal(err.message);
                });
        });
    });

    context('createIndex()', () => {
        let SqlExecute;

        beforeEach('replace dependencies with test doubles', () => {
            SqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
            // reload module with the replacements
            Collection = require('../../../lib/DevAPI/Collection');
        });

        it('creates and executes a SqlExecute statement that creates a collection index with the given name', () => {
            const connection = 'foo';
            const execute = td.function();
            const expected = true;
            const indexName = 'bar';
            const schemaName = 'baz';
            const schema = { getName: () => schemaName };
            const tableName = 'qux';
            const documentField = '$.age';
            const indexDatatype = 'TINYINT';

            const indexProperties = [{
                name: indexName,
                schema: schemaName,
                collection: tableName,
                unique: false,
                type: 'INDEX',
                constraint: [{ array: false, member: documentField, required: false, type: indexDatatype }]
            }];

            const indexDefinition = { fields: [{ field: documentField, type: indexDatatype }] };

            td.when(SqlExecute(connection, 'create_collection_index', indexProperties, 'mysqlx')).thenReturn({ execute });
            td.when(execute()).thenResolve(expected);

            return Collection({ connection, schema, tableName }).createIndex(indexName, indexDefinition)
                .then(got => expect(got).to.equal(expected));
        });

        it('creates and executes a SqlExecute statement that creates an multi-value collection index with the given name', () => {
            const connection = 'foo';
            const execute = td.function();
            const expected = true;
            const indexName = 'bar';
            const schemaName = 'baz';
            const schema = { getName: () => schemaName };
            const tableName = 'qux';
            const documentField = '$.tags';
            const indexDatatype = 'CHAR';

            const indexProperties = [{
                name: indexName,
                schema: schemaName,
                collection: tableName,
                unique: false,
                type: 'INDEX',
                constraint: [{ array: true, member: documentField, required: false, type: indexDatatype }]
            }];

            const indexDefinition = { fields: [{ field: documentField, type: indexDatatype, array: true }] };

            td.when(SqlExecute(connection, 'create_collection_index', indexProperties, 'mysqlx')).thenReturn({ execute });
            td.when(execute()).thenResolve(expected);

            return Collection({ connection, schema, tableName }).createIndex(indexName, indexDefinition)
                .then(got => expect(got).to.equal(expected));
        });

        it('fails to create an SqlExecute statement when the index name is not valid', () => {
            return Collection().createIndex()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_NAME);
                });
        });

        it('fails to create an SqlExecute statement when the index definition does not include a valid field list', () => {
            return Collection().createIndex('foo', {})
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_DEFINITION);
                });
        });

        it('fails to create an SqlExecute statement when the index definition includes an empty field list', () => {
            return Collection().createIndex('foo', { fields: [] })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_DEFINITION);
                });
        });

        it('fails to create an SqlExecute statement when the index definition includes an invalid field', () => {
            return Collection().createIndex('foo', { fields: [{ field: null, type: null }] })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_DEFINITION);
                });
        });

        it('fails to create an SqlExecute statement when the index definition includes a missing field', () => {
            return Collection().createIndex('foo', { fields: [{ type: 'TINYINT' }] })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_DEFINITION);
                });
        });

        it('fails to create an SqlExecute statement when the index definition includes a field without a datatype', () => {
            return Collection().createIndex('foo', { fields: [{ field: '$.age' }] })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_DEFINITION);
                });
        });

        // The X Plugin is not capable of creating unique indexes.
        it('fails to create an SqlExecute statement when the index definition enables uniqueness', () => {
            return Collection().createIndex('foo', { fields: [{ field: '$.age', type: 'INT' }], unique: true })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_NO_UNIQUE_INDEX);
                });
        });
    });

    context('dropIndex()', () => {
        let SqlExecute;

        beforeEach('replace dependencies with test doubles', () => {
            SqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
            // reload module with the replacements
            Collection = require('../../../lib/DevAPI/Collection');
        });

        context('when it exists', () => {
            it('creates and executes an SqlExecute statement to delete a collection index with the given name', () => {
                const connection = 'foo';
                const execute = td.function();
                const expected = true;
                const indexName = 'bar';
                const schemaName = 'baz';
                const schema = { getName: () => schemaName };
                const tableName = 'qux';
                const indexProperties = [{ name: indexName, schema: schemaName, collection: tableName }];

                td.when(SqlExecute(connection, 'drop_collection_index', indexProperties, 'mysqlx')).thenReturn({ execute });
                td.when(execute()).thenResolve(expected);

                return Collection({ connection, schema, tableName }).dropIndex(indexName)
                    .then(got => expect(got).to.equal(expected));
            });
        });

        context('when it does not exist', () => {
            it('creates and executes an SqlExecute statement to delete a collection index with the given name', () => {
                const connection = 'foo';
                const execute = td.function();
                const indexName = 'bar';
                const schemaName = 'baz';
                const schema = { getName: () => schemaName };
                const tableName = 'qux';
                const indexProperties = [{ name: indexName, schema: schemaName, collection: tableName }];

                const error = new Error();
                error.info = { code: errors.ER_CANT_DROP_FIELD_OR_KEY };

                td.when(SqlExecute(connection, 'drop_collection_index', indexProperties, 'mysqlx')).thenReturn({ execute });
                td.when(execute()).thenReject(error);

                return Collection({ connection, schema, tableName }).dropIndex(indexName)
                    .then(got => expect(got).to.be.false);
            });
        });

        it('fails to create an SqlExecute statement when the index name is not valid', () => {
            return Collection().dropIndex()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_INDEX_NAME);
                });
        });

        it('fails to execute an SqlExecute statement when the server reports an unexpected error', () => {
            const connection = 'foo';
            const indexName = 'bar';
            const error = new Error('baz');
            const execute = td.function();
            const schemaName = 'baz';
            const schema = { getName: () => schemaName };
            const tableName = 'qux';
            const indexProperties = [{ name: indexName, schema: schemaName, collection: tableName }];

            td.when(SqlExecute(connection, 'drop_collection_index', indexProperties, 'mysqlx')).thenReturn({ execute });
            td.when(execute()).thenReject(error);

            return Collection({ connection, schema, tableName }).dropIndex(indexName)
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(error.message);
                });
        });
    });

    context('existsInDatabase()', () => {
        let SqlExecute;

        beforeEach('replace dependencies with test doubles', () => {
            SqlExecute = td.replace('../../../lib/DevAPI/SqlExecute');
            // reload module with the replacements
            Collection = require('../../../lib/DevAPI/Collection');
        });

        it('creates and executes a SqlExecute statement that returns true if the collection exists in the database', () => {
            const connection = 'foo';
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const tableName = 'baz';

            td.when(SqlExecute(connection, 'list_objects', [{ schema: schemaName, pattern: tableName }], 'mysqlx')).thenReturn({ execute });
            td.when(execute()).thenResolve({ fetchAll: () => [[tableName, 'COLLECTION']] });

            return Collection({ connection, schema, tableName }).existsInDatabase()
                .then(actual => expect(actual).to.be.true);
        });

        it('creates and executes a SqlExecute statement that returns false if the collection does not exist in the database', () => {
            const connection = 'foo';
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const tableName = 'baz';

            td.when(SqlExecute(connection, 'list_objects', [{ schema: schemaName, pattern: tableName }], 'mysqlx')).thenReturn({ execute });
            td.when(execute()).thenResolve({ fetchAll: () => [] });

            return Collection({ connection, schema, tableName }).existsInDatabase()
                .then(actual => expect(actual).to.be.false);
        });

        it('creates and executes a SqlExecute statement that returns false if a table with the same name exists in the database', () => {
            const connection = 'foo';
            const execute = td.function();
            const schemaName = 'bar';
            const schema = { getName: () => schemaName };
            const tableName = 'baz';

            td.when(SqlExecute(connection, 'list_objects', [{ schema: schemaName, pattern: tableName }], 'mysqlx')).thenReturn({ execute });
            td.when(execute()).thenResolve({ fetchAll: () => [[tableName, 'TABLE']] });

            return Collection({ connection, schema, tableName }).existsInDatabase()
                .then(actual => expect(actual).to.be.false);
        });
    });

    context('find()', () => {
        let CollectionFind, Expr;

        beforeEach('replace dependencies with test doubles', () => {
            CollectionFind = td.replace('../../../lib/DevAPI/CollectionFind');
            Expr = td.replace('../../../lib/DevAPI/Expr');

            // reload module with the replacements
            Collection = require('../../../lib/DevAPI/Collection');
        });

        it('creates a CollectionFind statement with a parsed version of the given criteria expression', () => {
            const connection = 'foo';
            const criteria = 'bar';
            const schemaName = 'baz';
            const schema = { getName: () => schemaName };
            const searchConditionStr = 'qux';
            const tableName = 'quux';
            const statement = 'quuz';

            td.when(Expr({ value: searchConditionStr })).thenReturn({ getValue: () => criteria });
            td.when(CollectionFind({ connection, criteria, schema, tableName })).thenReturn(statement);

            return expect(Collection({ connection, schema, tableName }).find(searchConditionStr)).to.equal(statement);
        });
    });

    context('getName()', () => {
        it('returns the collection name', () => {
            expect(Collection({ tableName: 'foo' }).getName()).to.equal('foo');
        });
    });

    context('getOne()', () => {
        context('when it does not exist in the local cache', () => {
            it('creates and executes a CollectionFind statement to retrieve a document with the given id', () => {
                const bind = td.function();
                const expected = 'foo';
                const execute = td.function();
                const id = 'bar';

                const instance = Collection();
                const find = td.replace(instance, 'find');

                td.when(find('_id = :id')).thenReturn({ bind });
                td.when(bind('id', id)).thenReturn({ execute });
                td.when(execute(td.callback(expected))).thenResolve();

                return instance.getOne(id)
                    .then(got => expect(got).to.equal(expected));
            });
        });

        context('when it already exists in the local cache', () => {
            it('executes a CollectionFind statement to retrieve a document with the given id', () => {
                const bind = td.function();
                const getOneStatement = { bind };
                const expected = 'foo';
                const execute = td.function();
                const id = '';

                const instance = Collection({ getOneStatement });
                const find = td.replace(instance, 'find');

                td.when(bind('id', id)).thenReturn({ execute });
                td.when(execute(td.callback(expected))).thenResolve();

                return instance.getOne(id)
                    .then(got => {
                        expect(td.explain(find).callCount).to.equal(0);
                        return expect(got).to.equal(expected);
                    });
            });
        });

        it('resolves to a null document when the id is not provided', () => {
            return Collection().getOne()
                .then(got => expect(got).to.be.null);
        });
    });

    context('getSession()', () => {
        it('returns the associated session instance', () => {
            const connection = 'foo';
            const session = 'bar';
            const getSession = () => session;

            td.when(DatabaseObject(connection)).thenReturn({ getSession });

            expect(Collection({ connection }).getSession()).to.deep.equal(session);
        });
    });

    context('getSchema()', () => {
        it('returns the instance of the collection schema', () => {
            const schemaName = 'foo';
            const schema = { getName: () => schemaName };
            const instance = Collection({ schema });

            expect(instance.getSchema()).to.equal(schema);
            return expect(instance.getSchema().getName()).to.equal(schemaName);
        });
    });

    context('inspect()', () => {
        it('returns a stringified object containing the collection details', () => {
            const schemaName = 'foo';
            const schema = { getName: () => schemaName };
            const tableName = 'bar';
            const expected = { schema: schemaName, collection: tableName };

            expect(Collection({ schema, tableName }).inspect()).to.deep.equal(expected);
        });
    });

    context('modify()', () => {
        let CollectionModify, Expr;

        beforeEach('replace dependencies with test doubles', () => {
            CollectionModify = td.replace('../../../lib/DevAPI/CollectionModify');
            Expr = td.replace('../../../lib/DevAPI/Expr');

            // reload module with the replacements
            Collection = require('../../../lib/DevAPI/Collection');
        });

        it('creates a CollectionModify statement with a parsed version of the given criteria expression', () => {
            const connection = 'foo';
            const criteria = 'bar';
            const schemaName = 'baz';
            const schema = { getName: () => schemaName };
            const searchConditionStr = 'qux';
            const tableName = 'quux';
            const statement = 'quuz';

            td.when(Expr({ value: searchConditionStr })).thenReturn({ getValue: () => criteria });
            td.when(CollectionModify({ connection, criteria, schema, tableName })).thenReturn(statement);

            return expect(Collection({ connection, schema, tableName }).modify(searchConditionStr)).to.equal(statement);
        });
    });

    context('remove()', () => {
        let CollectionRemove, Expr;

        beforeEach('replace dependencies with test doubles', () => {
            CollectionRemove = td.replace('../../../lib/DevAPI/CollectionRemove');
            Expr = td.replace('../../../lib/DevAPI/Expr');

            // reload module with the replacements
            Collection = require('../../../lib/DevAPI/Collection');
        });

        it('creates a CollectionRemove statement with a parsed version of the given criteria expression', () => {
            const connection = 'foo';
            const criteria = 'bar';
            const schemaName = 'baz';
            const schema = { getName: () => schemaName };
            const searchConditionStr = 'qux';
            const tableName = 'quux';
            const statement = 'quuz';

            td.when(Expr({ value: searchConditionStr })).thenReturn({ getValue: () => criteria });
            td.when(CollectionRemove({ connection, criteria, schema, tableName })).thenReturn(statement);

            return expect(Collection({ connection, schema, tableName }).remove(searchConditionStr)).to.equal(statement);
        });
    });

    context('removeOne()', () => {
        context('when it does not exist in the local cache', () => {
            it('creates and executes a CollectionRemove statement to retrieve a document with the given id', () => {
                const bind = td.function();
                const expected = 'foo';
                const execute = td.function();
                const id = 'bar';

                const instance = Collection();
                const remove = td.replace(instance, 'remove');

                td.when(remove('_id = :id')).thenReturn({ bind });
                td.when(bind('id', id)).thenReturn({ execute });
                td.when(execute()).thenResolve(expected);

                return instance.removeOne(id)
                    .then(got => expect(got).to.equal(expected));
            });
        });

        context('when it already exists in the local cache', () => {
            it('executes a CollectionRemove statement to retrieve a document with the given id', () => {
                const bind = td.function();
                const removeOneStatement = { bind };
                const expected = 'foo';
                const execute = td.function();
                const id = '';

                const instance = Collection({ removeOneStatement });
                const remove = td.replace(instance, 'remove');

                td.when(bind('id', id)).thenReturn({ execute });
                td.when(execute()).thenResolve(expected);

                return instance.removeOne(id)
                    .then(got => {
                        expect(td.explain(remove).callCount).to.equal(0);
                        return expect(got).to.equal(expected);
                    });
            });
        });
    });

    context('replaceOne()', () => {
        it('creates and executes a CollectionModify statement to retrieve a document with the given id', () => {
            const bind = td.function();
            const doc = { name: 'foo' };
            const expected = 'bar';
            const execute = td.function();
            const id = 'baz';
            const set = td.function();

            const instance = Collection();
            const modify = td.replace(instance, 'modify');

            td.when(modify('_id = :id')).thenReturn({ bind });
            td.when(bind('id', id)).thenReturn({ set });
            td.when(set('$', doc)).thenReturn({ execute });
            td.when(execute()).thenResolve(expected);

            return instance.replaceOne(id, doc)
                .then(got => expect(got).to.equal(expected));
        });

        it('fails to create a CollectionModify statement when the document id and the given id do not match', () => {
            return Collection().replaceOne('foo', { _id: 'baz', name: 'bar' })
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_DOCUMENT_ID_MISMATCH);
                });
        });
    });
});
