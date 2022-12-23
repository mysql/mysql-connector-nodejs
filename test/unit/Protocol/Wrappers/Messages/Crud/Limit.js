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
let Limit = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');

describe('Mysqlx.Crud.Limit wrapper', () => {
    let CrudStub;

    beforeEach('replace dependencies with test doubles', () => {
        CrudStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
        // reload module with the replacements
        Limit = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
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
                Limit = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
            });

            it('creates an empty Mysqlx.Crud.Limit wrapper when the count is not defined', () => {
                td.when(Wraps(undefined)).thenReturn({ valueOf: () => 'foo' });

                expect(Limit.create().valueOf()).to.equal('foo');
                expect(td.explain(CrudStub.Limit.prototype.setRowCount).callCount).to.equal(0);
                expect(td.explain(CrudStub.Limit.prototype.setOffset).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Crud.Limit wrapper with the count when the offset is not defined', () => {
                const count = 'foo';
                const proto = new CrudStub.Limit();
                const protoValue = 'bar';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(Limit.create({ count }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal(count);
                expect(td.explain(proto.setOffset).callCount).to.equal(0);
            });

            it('creates a Mysqlx.Crud.Limit wrapper instance with both the count and offset', () => {
                const count = 'foo';
                const offset = 'bar';
                const proto = new CrudStub.Limit();
                const protoValue = 'baz';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });

                expect(Limit.create({ count, offset }).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setRowCount).callCount).to.equal(1);
                expect(td.explain(proto.setRowCount).calls[0].args[0]).to.equal(count);
                expect(td.explain(proto.setOffset).callCount).to.equal(1);
                expect(td.explain(proto.setOffset).calls[0].args[0]).to.equal(offset);
            });
        });
    });

    context('instance methods', () => {
        context('toJSON()', () => {
            it('returns nothing if the underlying protobuf instance is not available', () => {
                // eslint-disable-next-line no-unused-expressions
                expect(Limit().toJSON()).to.not.exist;
            });

            it('returns a textual representation of a Mysqlx.Crud.Limit message', () => {
                const proto = new CrudStub.Limit();

                td.when(proto.getRowCount()).thenReturn(3);
                td.when(proto.getOffset()).thenReturn(3);

                expect(Limit(proto).toJSON()).to.deep.equal({ offset: 3n, row_count: 3n });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Limit = require('../../../../../../lib/Protocol/Wrappers/Messages/Crud/Limit');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new CrudStub.Limit();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Limit(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
