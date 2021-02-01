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
let column = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Column');

describe('Mysqlx.Crud.Column wrapper', () => {
    let CrudStub, wraps;

    beforeEach('create fakes', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        column = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Column');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Crud.Column wrap instance with a given name', () => {
                const proto = new CrudStub.Column();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'bar' });

                expect(column.create('foo').valueOf()).to.equal('bar');
                expect(td.explain(proto.setName).callCount).to.equal(1);
                expect(td.explain(proto.setName).calls[0].args[0]).to.equal('foo');
            });

            it('returns an empty wrap if no argument is provided', () => {
                td.when(wraps(undefined)).thenReturn({ valueOf: () => 'foo' });

                expect(column.create().valueOf()).to.equal('foo');
                expect(td.explain(CrudStub.Column.prototype.setName).callCount).to.equal(0);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Crud.Column message', () => {
                const proto = new CrudStub.Column();

                td.when(proto.getName()).thenReturn('foo');

                expect(column(proto).toJSON()).to.deep.equal({ name: 'foo' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Column();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(column(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
