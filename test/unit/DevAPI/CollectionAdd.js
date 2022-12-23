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

const dataModel = require('../../../lib/Protocol/Stubs/mysqlx_crud_pb').DataModel.DOCUMENT;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with test doubles
let CollectionAdd = require('../../../lib/DevAPI/CollectionAdd');

describe('CollectionAdd statement', () => {
    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('add()', () => {
        let DocumentOrJSON;

        beforeEach('replace dependencies with test doubles', () => {
            DocumentOrJSON = td.replace('../../../lib/DevAPI/DocumentOrJSON');
            // reload module with the replacements
            CollectionAdd = require('../../../lib/DevAPI/CollectionAdd');
        });

        it('appends documents provided in an array to the list of rows to be inserted', () => {
            const rows = [];
            const documents = [{ name: 'foo' }, { name: 'bar' }];
            const expected = documents.map(value => ({ value, isLiteral: true }));
            const getValue = td.function();
            const isLiteral = () => true;

            td.when(DocumentOrJSON(documents[0])).thenReturn({ getValue, isLiteral });
            td.when(DocumentOrJSON(documents[1])).thenReturn({ getValue, isLiteral });
            td.when(getValue()).thenReturn(documents[1]);
            td.when(getValue(), { times: 1 }).thenReturn(documents[0]);

            CollectionAdd({ rows }).add(documents);

            return expect(rows).to.deep.equal(expected);
        });

        it('appends documents provided as multiple arguments to the list of rows to be inserted', () => {
            const rows = [];
            const documents = [{ name: 'foo' }, { name: 'bar' }];
            const expected = documents.map(value => ({ value, isLiteral: true }));
            const getValue = td.function();
            const isLiteral = () => true;

            td.when(DocumentOrJSON(documents[0])).thenReturn({ getValue, isLiteral });
            td.when(DocumentOrJSON(documents[1])).thenReturn({ getValue, isLiteral });
            td.when(getValue()).thenReturn(documents[1]);
            td.when(getValue(), { times: 1 }).thenReturn(documents[0]);

            CollectionAdd({ rows }).add(documents[0], documents[1]);

            return expect(rows).to.deep.equal(expected);
        });

        it('appends documents provided in different calls to the list of rows to be inserted', () => {
            const rows = [];
            const documents = [{ name: 'foo' }, { name: 'bar' }];
            const expected = documents.map(value => ({ value, isLiteral: true }));
            const getValue = td.function();
            const isLiteral = () => true;

            td.when(DocumentOrJSON(documents[0])).thenReturn({ getValue, isLiteral });
            td.when(DocumentOrJSON(documents[1])).thenReturn({ getValue, isLiteral });
            td.when(getValue()).thenReturn(documents[1]);
            td.when(getValue(), { times: 1 }).thenReturn(documents[0]);

            CollectionAdd({ rows }).add(documents[0]).add(documents[1]);

            return expect(rows).to.deep.equal(expected);
        });
    });

    context('execute()', () => {
        let Result;

        beforeEach('replace dependencies with test doubles', () => {
            Result = td.replace('../../../lib/DevAPI/Result');
            // reload module with the replacements
            CollectionAdd = require('../../../lib/DevAPI/CollectionAdd');
        });

        it('executes a CollectionAdd statement and returns a Result instance with the details provided by the server', () => {
            const crudInsert = td.function();
            const integerType = 'foo';
            const connection = { getClient: () => ({ crudInsert }), getIntegerType: () => integerType, isIdle: () => false, isOpen: () => true };
            const rows = 'bar';
            const schemaName = 'baz';
            const schema = { getName: () => schemaName };
            const tableName = 'qux';
            const details = 'quux';
            const want = 'quuux';

            td.when(crudInsert({ dataModel, rows, schemaName, tableName, upsert: false })).thenResolve(details);
            td.when(Result({ ...details, integerType })).thenReturn(want);

            return CollectionAdd({ connection, rows, schema, tableName }).execute()
                .then(got => expect(got).to.equal(want));
        });

        it('executes a CollectionAdd statement in upsert mode and returns a Result instance with the details provided by the server', () => {
            const crudInsert = td.function();
            const integerType = 'foo';
            const connection = { getClient: () => ({ crudInsert }), getIntegerType: () => integerType, isIdle: () => false, isOpen: () => true };
            const rows = 'bar';
            const schemaName = 'ba<';
            const schema = { getName: () => schemaName };
            const tableName = 'qux';
            const details = 'quux';
            const upsert = true;
            const want = 'quuux';

            td.when(crudInsert({ dataModel, rows, schemaName, tableName, upsert })).thenResolve(details);
            td.when(Result({ ...details, integerType })).thenReturn(want);

            return CollectionAdd({ connection, rows, schema, tableName, upsert }).execute()
                .then(got => expect(got).to.equal(want));
        });

        it('does not execute the CollectionAdd statement when the list of rows to insert is empty', () => {
            const crudInsert = td.function();
            const connection = { getClient: () => ({ crudInsert }) };

            return CollectionAdd({ connection }).execute()
                .then(() => expect(td.explain(crudInsert).callCount).to.equal(0));
        });

        it('fails to execute the CollectionAdd statement when the connection is not open', () => {
            const crudInsert = td.function();
            const error = new Error('foo');
            const connection = { getClient: () => ({ crudInsert }), getError: () => error, isOpen: () => false, isIdle: () => false };
            const rows = 'bar';

            return CollectionAdd({ connection, rows }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(td.explain(crudInsert).callCount).to.equal(0);
                    return expect(err).to.deep.equal(error);
                });
        });

        it('fails to execute the CollectionAdd statement when the connection has expired', () => {
            const crudInsert = td.function();
            const error = new Error('foo');
            const connection = { getClient: () => ({ crudInsert }), getError: () => error, isOpen: () => true, isIdle: () => true };
            const rows = 'bar';

            return CollectionAdd({ connection, rows }).execute()
                .then(() => {
                    return expect.fail();
                })
                .catch(err => {
                    expect(td.explain(crudInsert).callCount).to.equal(0);
                    return expect(err).to.deep.equal(error);
                });
        });
    });
});
