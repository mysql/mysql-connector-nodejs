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
let documentPathItem = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');

describe('Mysqlx.Expr.DocumentPathItem wrapper', () => {
    let ExprStub, wraps;

    beforeEach('create fakes', () => {
        ExprStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        documentPathItem = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the document path item type name', () => {
                const proto = new ExprStub.DocumentPathItem();

                td.when(proto.getType()).thenReturn(0);
                // eslint-disable-next-line no-unused-expressions
                expect(documentPathItem(proto).getType()).to.not.exist;

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.MEMBER);
                expect(documentPathItem(proto).getType()).to.equal('MEMBER');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.MEMBER_ASTERISK);
                expect(documentPathItem(proto).getType()).to.equal('MEMBER_ASTERISK');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
                expect(documentPathItem(proto).getType()).to.equal('ARRAY_INDEX');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(documentPathItem(proto).getType()).to.equal('ARRAY_INDEX_ASTERISK');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(documentPathItem(proto).getType()).to.equal('DOUBLE_ASTERISK');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Expr.DocumentPathItem message', () => {
                const proto = new ExprStub.DocumentPathItem();

                const wrapper = documentPathItem(proto);
                const getType = td.replace(wrapper, 'getType');

                td.when(getType()).thenReturn('foo');

                td.when(proto.toObject()).thenReturn({ type: 'foo', value: 'bar' });
                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', value: 'bar' });

                td.when(proto.toObject()).thenReturn({ type: 'foo', index: 'bar' });
                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', index: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExprStub.DocumentPathItem();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(documentPathItem(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
