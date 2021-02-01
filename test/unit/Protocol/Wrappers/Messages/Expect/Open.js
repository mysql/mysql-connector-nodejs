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
let open = require('../../../../../../lib/Protocol/Wrappers/Messages/Expect/Open');

describe('Mysqlx.Expect.Open wrapper', () => {
    let ExpectStub, condition, serializable, wraps;

    beforeEach('create fakes', () => {
        ExpectStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_expect_pb');
        condition = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expect/Condition');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        open = require('../../../../../../lib/Protocol/Wrappers/Messages/Expect/Open');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Expect.Open wrap instance', () => {
                const proto = new ExpectStub.Open();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });
                td.when(condition.create('bar')).thenReturn({ valueOf: () => 'qux' });
                td.when(condition.create('baz')).thenReturn({ valueOf: () => 'quux' });

                expect(open.create(['bar', 'baz']).valueOf()).to.equal('foo');
                expect(td.explain(proto.setCondList).callCount).to.equal(1);
                expect(td.explain(proto.setCondList).calls[0].args[0]).to.deep.equal(['qux', 'quux']);
            });
        });
    });

    context('instance methods', () => {
        context('getOperation()', () => {
            it('returns the name of the operation', () => {
                const proto = new ExpectStub.Open();

                td.when(proto.getOp()).thenReturn(ExpectStub.Open.CtxOperation.EXPECT_CTX_COPY_PREV);
                expect(open(proto).getOperation()).to.equal('EXPECT_CTX_COPY_PREV');

                td.when(proto.getOp()).thenReturn(ExpectStub.Open.CtxOperation.EXPECT_CTX_EMPTY);
                expect(open(proto).getOperation()).to.equal('EXPECT_CTX_EMPTY');
            });
        });

        context('serialize()', () => {
            it('returns the raw buffer data to be sent through the wire', () => {
                const proto = new ExpectStub.Open();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(open(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Expect.open message', () => {
                const proto = new ExpectStub.Open();

                const wrapper = open(proto);
                const getOperation = td.replace(wrapper, 'getOperation');

                td.when(getOperation()).thenReturn('foo');
                td.when(proto.getCondList()).thenReturn(['p_bar', 'p_baz']);
                td.when(condition('p_bar')).thenReturn({ toJSON: () => 'bar' });
                td.when(condition('p_baz')).thenReturn({ toJSON: () => 'baz' });

                expect(wrapper.toJSON()).to.deep.equal({ op: 'foo', cond: ['bar', 'baz'] });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExpectStub.Open();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(open(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
