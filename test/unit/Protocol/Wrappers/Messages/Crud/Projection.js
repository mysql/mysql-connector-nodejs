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
let Projection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');

describe('Mysqlx.Crud.Projection wrapper', () => {
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        // reload module with the replacements
        Projection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        let Expr, Wraps;

        beforeEach('replace dependencies with test doubles', () => {
            Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
            Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
            // reload module with the replacements
            Projection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');
        });

        context('create()', () => {
            it('creates a Mysqlx.Crud.Projection wrapper given a projectedSeachExpr containing a source expression', () => {
                const proto = new CrudStub.Projection();
                const protoValue = 'foo';
                const source = 'bar';
                const sourceProto = `${source}_proto`;

                td.when(Expr.create({ value: source })).thenReturn({ valueOf: () => sourceProto });
                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(Projection.create({ source }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setSource).callCount).to.equal(1);
                expect(td.explain(proto.setSource).calls[0].args[0]).to.equal(sourceProto);
                expect(td.explain(proto.setAlias).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Crud.Projection wrapper given a projectedSeachExpr containing a source expression and an alias', () => {
                const alias = 'foo';
                const proto = new CrudStub.Projection();
                const protoValue = 'bar';
                const source = 'baz';
                const sourceProto = `${source}_proto`;

                td.when(Expr.create({ value: source })).thenReturn({ valueOf: () => sourceProto });
                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(Projection.create({ alias, source }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setSource).callCount).to.equal(1);
                expect(td.explain(proto.setSource).calls[0].args[0]).to.equal(sourceProto);
                expect(td.explain(proto.setAlias).callCount).to.equal(1);
                expect(td.explain(proto.setAlias).calls[0].args[0]).to.equal(alias);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            let Expr;

            beforeEach('replace dependencies with test doubles', () => {
                Expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
                // reload module with the replacements
                Projection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');
            });

            it('returns a textual representation of a Mysqlx.Crud.Projection message', () => {
                const alias = 'foo';
                const proto = new CrudStub.Projection();
                const source = 'bar';
                const sourceProto = `${source}_proto`;

                td.when(proto.getSource()).thenReturn(sourceProto);
                td.when(Expr(sourceProto)).thenReturn({ toJSON: () => source });
                td.when(proto.getAlias()).thenReturn(alias);

                expect(Projection(proto).toJSON()).to.deep.equal({ source, alias });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Projection = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Projection');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Projection();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Projection(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
