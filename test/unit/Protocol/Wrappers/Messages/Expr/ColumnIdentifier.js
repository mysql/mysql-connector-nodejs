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

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let columnIdentifier = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');

describe('Mysqlx.Expr.ColumnIdentifier wrapper', () => {
    let ExprStub, documentPathItem, list, optionalString, parser, wraps;

    beforeEach('create fakes', () => {
        ExprStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb');
        documentPathItem = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');
        list = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
        optionalString = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/OptionalString');
        parser = td.replace('../../../../../../lib/ExprParser');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        columnIdentifier = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/ColumnIdentifier');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Expr.ColumnIdentifier wrap instance parsing a provided name', () => {
                td.when(parser.parse('foo', { type: parser.Type.COLUMN_OR_PATH })).thenReturn({ getIdentifier: () => 'bar' });
                td.when(wraps('bar')).thenReturn({ valueOf: () => 'baz' });

                expect(columnIdentifier.create('foo').valueOf()).to.equal('baz');
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Expr.ColumnIdentifier message', () => {
                const proto = new ExprStub.ColumnIdentifier();

                td.when(proto.getDocumentPathList()).thenReturn(['p_foo', 'p_bar']);
                td.when(documentPathItem('p_foo')).thenReturn('d_foo');
                td.when(documentPathItem('p_bar')).thenReturn('d_bar');
                td.when(list(['d_foo', 'd_bar'])).thenReturn({ toJSON: () => ['foo', 'bar'] });

                td.when(proto.getName()).thenReturn('p_baz');
                td.when(optionalString('p_baz')).thenReturn({ toJSON: () => 'baz' });

                td.when(proto.getTableName()).thenReturn('p_qux');
                td.when(optionalString('p_qux')).thenReturn({ toJSON: () => 'qux' });

                td.when(proto.getSchemaName()).thenReturn('p_quux');
                td.when(optionalString('p_quux')).thenReturn({ toJSON: () => 'quux' });

                expect(columnIdentifier(proto).toJSON()).to.deep.equal({ document_path: ['foo', 'bar'], name: 'baz', table_name: 'qux', schema_name: 'quux' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExprStub.ColumnIdentifier();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(columnIdentifier(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
