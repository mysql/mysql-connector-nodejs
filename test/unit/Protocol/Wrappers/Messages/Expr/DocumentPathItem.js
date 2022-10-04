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

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement test doubles
let DocumentPathItem = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');

describe('Mysqlx.Expr.DocumentPathItem wrapper', () => {
    let ExprStub;

    beforeEach('replace dependencies with test doubles', () => {
        ExprStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb');
        // reload module with the replacements
        DocumentPathItem = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                DocumentPathItem = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');
            });

            it('creates a Mysqlx.Expr.DocumentPathItem wrapper for a field with a given name', () => {
                const proto = new ExprStub.DocumentPathItem();
                const protoValue = 'foo';
                const type = 'member';
                const value = 'bar';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(DocumentPathItem.create({ type, value }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(ExprStub.DocumentPathItem.Type.MEMBER);
                expect(td.explain(proto.setValue).callCount).to.equal(1);
                expect(td.explain(proto.setValue).calls[0].args[0]).to.equal(value);
                expect(td.explain(proto.setIndex).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Expr.DocumentPathItem wrapper for a field wildcard', () => {
                const proto = new ExprStub.DocumentPathItem();
                const protoValue = 'foo';
                const type = 'memberAsterisk';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(DocumentPathItem.create({ type }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(ExprStub.DocumentPathItem.Type.MEMBER_ASTERISK);
                expect(td.explain(proto.setValue).callCount).to.equal(0);
                expect(td.explain(proto.setIndex).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Expr.DocumentPathItem wrapper for an element at a given array index', () => {
                const proto = new ExprStub.DocumentPathItem();
                const protoValue = 'foo';
                const type = 'arrayIndex';
                const value = 'bar';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(DocumentPathItem.create({ type, value }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
                expect(td.explain(proto.setIndex).callCount).to.equal(1);
                expect(td.explain(proto.setIndex).calls[0].args[0]).to.equal(value);
                expect(td.explain(proto.setValue).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Expr.DocumentPathItem wrapper for an array index wildcard', () => {
                const proto = new ExprStub.DocumentPathItem();
                const protoValue = 'foo';
                const type = 'arrayIndexAsterisk';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(DocumentPathItem.create({ type }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(td.explain(proto.setValue).callCount).to.equal(0);
                expect(td.explain(proto.setIndex).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Expr.DocumentPathItem wrapper for a globstar', () => {
                const proto = new ExprStub.DocumentPathItem();
                const protoValue = 'foo';
                const type = 'doubleAsterisk';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(DocumentPathItem.create({ type }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setType).callCount).to.equal(1);
                expect(td.explain(proto.setType).calls[0].args[0]).to.equal(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(td.explain(proto.setValue).callCount).to.equal(0);
                expect(td.explain(proto.setIndex).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('getType()', () => {
            it('returns the document path item type name', () => {
                const proto = new ExprStub.DocumentPathItem();

                td.when(proto.getType()).thenReturn(0);
                // eslint-disable-next-line no-unused-expressions
                expect(DocumentPathItem(proto).getType()).to.not.exist;

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.MEMBER);
                expect(DocumentPathItem(proto).getType()).to.equal('MEMBER');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.MEMBER_ASTERISK);
                expect(DocumentPathItem(proto).getType()).to.equal('MEMBER_ASTERISK');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.ARRAY_INDEX);
                expect(DocumentPathItem(proto).getType()).to.equal('ARRAY_INDEX');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.ARRAY_INDEX_ASTERISK);
                expect(DocumentPathItem(proto).getType()).to.equal('ARRAY_INDEX_ASTERISK');

                td.when(proto.getType()).thenReturn(ExprStub.DocumentPathItem.Type.DOUBLE_ASTERISK);
                expect(DocumentPathItem(proto).getType()).to.equal('DOUBLE_ASTERISK');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Expr.DocumentPathItem message', () => {
                const proto = new ExprStub.DocumentPathItem();

                const wrapper = DocumentPathItem(proto);
                const getType = td.replace(wrapper, 'getType');

                td.when(getType()).thenReturn('foo');

                td.when(proto.toObject()).thenReturn({ type: 'foo', value: 'bar' });
                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', value: 'bar' });

                td.when(proto.toObject()).thenReturn({ type: 'foo', index: 'bar' });
                expect(wrapper.toJSON()).to.deep.equal({ type: 'foo', index: 'bar' });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                DocumentPathItem = require('../../../../../../lib/Protocol/Wrappers/Messages/Expr/DocumentPathItem');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExprStub.DocumentPathItem();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(DocumentPathItem(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
