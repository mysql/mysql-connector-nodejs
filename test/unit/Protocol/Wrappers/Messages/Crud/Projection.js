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

const ExprStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_expr_pb').Expr;
const parserType = require('../../../../../../lib/ExprParser').Type.PROJECTED_SEARCH_EXPR;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let projection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');

describe('Mysqlx.Crud.Projection wrapper', () => {
    let CrudStub, expr, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        projection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Projection wrap instance given a raw string', () => {
                td.when(expr.create('foo', { type: parserType })).thenReturn({ valueOf: () => 'bar' });
                td.when(wraps('bar')).thenReturn({ valueOf: () => 'baz' });

                expect(projection.create('foo').valueOf()).to.equal('baz');
                expect(td.explain(CrudStub.Projection.prototype.setSource).callCount).to.equal(0);
            });

            it('returns a Mysqlx.Crud.Projection wrapper given an expression object', () => {
                const proto = new CrudStub.Projection();
                const input = new ExprStub();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(projection.create(input).valueOf()).to.equal('foo');
                expect(td.explain(proto.setSource).callCount).to.equal(1);
                expect(td.explain(proto.setSource).calls[0].args[0]).to.equal(input);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Projection message', () => {
                const proto = new CrudStub.Projection();

                td.when(proto.getSource()).thenReturn('p_foo');
                td.when(expr('p_foo')).thenReturn({ toJSON: () => 'foo' });
                td.when(proto.getAlias()).thenReturn('bar');

                expect(projection(proto).toJSON()).to.deep.equal({ source: 'foo', alias: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Projection();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(projection(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
