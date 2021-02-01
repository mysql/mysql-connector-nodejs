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
let typedRow = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');

describe('Mysqlx.Crud.Insert.TypedRow wrapper', () => {
    let CrudStub, expr, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        typedRow = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/TypedRow');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Insert.TypedRow wrap instance for a single value', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });
                td.when(expr.create('foo')).thenReturn({ valueOf: () => 'baz' });

                expect(typedRow.create('foo').valueOf()).to.equal('bar');
                expect(td.explain(proto.setFieldList).callCount).to.equal(1);
                expect(td.explain(proto.setFieldList).calls[0].args[0]).to.deep.equal(['baz']);
            });

            it('returns a Mysqlx.Crud.Insert.TypedRow wrap instance for a list of values', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });
                td.when(expr.create('foo')).thenReturn({ valueOf: () => 'baz' });

                expect(typedRow.create(['foo']).valueOf()).to.equal('bar');
                expect(td.explain(proto.setFieldList).callCount).to.equal(1);
                expect(td.explain(proto.setFieldList).calls[0].args[0]).to.deep.equal(['baz']);
            });

            it('returns a Mysqlx.Crud.Insert.TypedRow without any undefined value', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });

                expect(typedRow.create(undefined).valueOf()).to.equal('bar');
                expect(td.explain(proto.setFieldList).callCount).to.equal(1);
                expect(td.explain(proto.setFieldList).calls[0].args[0]).to.deep.equal([]);

                // call count has increased
                expect(typedRow.create([undefined]).valueOf()).to.equal('bar');
                expect(td.explain(proto.setFieldList).callCount).to.equal(2);
                expect(td.explain(proto.setFieldList).calls[1].args[0]).to.deep.equal([]);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Insert.TypedRow message', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(proto.getFieldList()).thenReturn(['foo']);
                td.when(expr('foo')).thenReturn({ toJSON: () => 'bar' });

                expect(typedRow(proto).toJSON()).to.deep.equal({ field: ['bar'] });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Insert.TypedRow();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(typedRow(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
