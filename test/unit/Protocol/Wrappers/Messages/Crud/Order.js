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
let Order = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');

describe('Mysqlx.Crud.Order wrapper', () => {
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        // reload module with the replacements
        Order = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let CrudStub, Expr, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Order = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
            });

            it('creates a Mysqlx.Crud.Order wrapper given a sortExpr containing a column id expression', () => {
                const expr = 'foo';
                const exprProto = `${expr}_proto`;
                const proto = new CrudStub.Order();
                const protoValue = 'bar';

                td.when(Expr.create({ value: expr })).thenReturn({ valueOf: () => exprProto });
                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(Order.create({ expr }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setExpr).callCount).to.equal(1);
                expect(td.explain(proto.setExpr).calls[0].args[0]).to.equal(exprProto);
            });

            it('creates a Mysqlx.Crud.Order wrapper given a sortExpr containing a column id expression and a case-insensitive direction', () => {
                const expr = 'foo';
                const exprProto = `${expr}_proto`;
                const proto = new CrudStub.Order();
                const protoValue = 'bar';

                td.when(Expr.create({ value: expr })).thenReturn({ valueOf: () => exprProto });
                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                let direction = 'ASC';

                expect(Order.create({ expr, direction }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setExpr).callCount).to.equal(1);
                expect(td.explain(proto.setExpr).calls[0].args[0]).to.equal(exprProto);
                expect(td.explain(proto.setDirection).callCount).to.equal(1);
                expect(td.explain(proto.setDirection).calls[0].args[0]).to.equal(CrudStub.Order.Direction.ASC);

                direction = 'DESC';

                expect(Order.create({ expr, direction }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setExpr).callCount).to.equal(2); // call count has increased
                expect(td.explain(proto.setExpr).calls[1].args[0]).to.equal(exprProto);
                expect(td.explain(proto.setDirection).callCount).to.equal(2); // call count has increased
                expect(td.explain(proto.setDirection).calls[1].args[0]).to.equal(CrudStub.Order.Direction.DESC);

                direction = 'asc';

                expect(Order.create({ expr, direction }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setExpr).callCount).to.equal(3); // call count has increased
                expect(td.explain(proto.setExpr).calls[2].args[0]).to.equal(exprProto);
                expect(td.explain(proto.setDirection).callCount).to.equal(3); // call count has increased
                expect(td.explain(proto.setDirection).calls[2].args[0]).to.equal(CrudStub.Order.Direction.ASC);

                direction = 'desc';

                expect(Order.create({ expr, direction }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setExpr).callCount).to.equal(4); // call count has increased
                expect(td.explain(proto.setExpr).calls[3].args[0]).to.equal(exprProto);
                expect(td.explain(proto.setDirection).callCount).to.equal(4); // call count has increased
                expect(td.explain(proto.setDirection).calls[3].args[0]).to.equal(CrudStub.Order.Direction.DESC);
            });
        });
    });

    context('instance methods', () => {
        context('getDirection()', () => {
            it('returns the Ordering direction identifier', () => {
                const proto = new CrudStub.Order();
                let expected = 'ASC';

                td.when(proto.getDirection()).thenReturn(CrudStub.Order.Direction.ASC);
                expect(Order(proto).getDirection()).to.equal(expected);

                expected = 'DESC';

                td.when(proto.getDirection()).thenReturn(CrudStub.Order.Direction.DESC);
                expect(Order(proto).getDirection()).to.equal(expected);
            });
        });

        context('toJSON()', () => {
            let Expr;

            beforeEach('replace dependencies with test doubles', () => {
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                // reload module with the replacements
                Order = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
            });

            it('returns a textual representation of a Mysqlx.Crud.Order message', () => {
                const direction = 'foo';
                const expr = 'bar';
                const exprProto = `${expr}_proto`;
                const proto = new CrudStub.Order();

                const wrap = Order(proto);
                const getDirection = td.replace(wrap, 'getDirection');

                td.when(proto.getExpr()).thenReturn(exprProto);
                td.when(Expr(exprProto)).thenReturn({ toJSON: () => expr });
                td.when(getDirection()).thenReturn(direction);

                expect(wrap.toJSON()).to.deep.equal({ expr, direction });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Order = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Order');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Order();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Order(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
