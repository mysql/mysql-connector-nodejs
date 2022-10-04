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

// subject under test needs to be reloaded with replacement fakes
let LimitExpr = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');

describe('Mysqlx.Crud.LimitExpr wrapper', () => {
    // let CrudStub, expr, wraps;

    // beforeEach('create fakes', () => {
    //     CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
    //     expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
    //     wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
    //     LimitExpr = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
    // });

    // afterEach('reset fakes', () => {
    //     td.reset();
    // });
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        // reload module with the replacements
        LimitExpr = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let Expr, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                LimitExpr = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
            });

            it('creates an empty Mysqlx.Crud.LimitExpr wrapper if the count is not defined', () => {
                td.when(Wraps(undefined)).thenReturn({ valueOf: () => 'foo' });

                expect(LimitExpr.create().valueOf()).to.equal('foo');
                expect(td.explain(CrudStub.LimitExpr.prototype.setRowCount).callCount).to.equal(0);
                expect(td.explain(CrudStub.LimitExpr.prototype.setOffset).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Crud.LimitExpr wrapper with the count if the offset is not defined', () => {
                const count = 'foo';
                const countExpr = `${count}_expr`;
                const position = 0;
                const proto = new CrudStub.LimitExpr();
                const protoValue = 'bar';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Expr.create({ value: count, position, isLiteral: true })).thenReturn({ valueOf: () => countExpr });

                expect(LimitExpr.create({ count, position }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal(countExpr);
                expect(td.explain(proto.setOffset).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Crud.LimitExpr wrapper with both the count and offset', () => {
                const count = 'foo';
                const countExpr = `${count}_expr`;
                const offset = 'bar';
                const offsetExpr = `${offset}_expr`;
                const position = 0;
                const proto = new CrudStub.LimitExpr();
                const protoValue = 'baz';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Expr.create({ value: count, position: 0, isLiteral: true })).thenReturn({ valueOf: () => countExpr });
                td.when(Expr.create({ value: offset, position: 1, isLiteral: true })).thenReturn({ valueOf: () => offsetExpr });

                expect(LimitExpr.create({ count, offset, position }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal(countExpr);
                expect(td.explain(proto.setOffset).callCount).to.equal(1);
                expect(td.explain(proto.setOffset).calls[0].args[0]).to.equal(offsetExpr);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            let Expr;

            beforeEach('replace dependencies with test doubles', () => {
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                // reload module with the replacements
                LimitExpr = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
            });

            it('returns nothing if the underlying protobuf instance is not available', () => {
                // eslint-disable-next-line no-unused-expressions
                expect(LimitExpr().toJSON()).to.not.exist;
            });

            it('returns a textual representation of a Mysqlx.Crud.LimitExpr message', () => {
                const count = 'foo';
                const countExprProto = `${count}_expr_proto`;
                const offset = 'bar';
                const offsetExprProto = `${offset}_expr_proto`;
                const proto = new CrudStub.LimitExpr();

                td.when(proto.getRowCount()).thenReturn(countExprProto);
                td.when(Expr(countExprProto)).thenReturn({ toJSON: () => count });

                td.when(proto.getOffset()).thenReturn(offsetExprProto);
                td.when(Expr(offsetExprProto)).thenReturn({ toJSON: () => offset });

                expect(LimitExpr(proto).toJSON()).to.deep.equal({ offset, row_count: count });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                LimitExpr = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/LimitExpr');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.LimitExpr();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(LimitExpr(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
