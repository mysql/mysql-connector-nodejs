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
let condition = require('../../../../../../lib/Protocol/Wrappers/Messages/Expect/Condition');

describe('Mysqlx.Expect.Condition wrapper', () => {
    let ExpectStub, bytes, wraps;

    beforeEach('create fakes', () => {
        ExpectStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_expect_pb');
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        condition = require('../../../../../../lib/Protocol/Wrappers/Messages/Expect/Condition');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Expect.Condition wrap instance', () => {
                const proto = new ExpectStub.Open.Condition();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'qux' });
                td.when(bytes.create(Buffer.from('bar'))).thenReturn({ valueOf: () => 'quux' });

                expect(condition.create({ key: 'foo', value: 'bar', condition: 'baz' }).valueOf()).to.equal('qux');
                expect(td.explain(proto.setConditionKey).callCount).to.equal(1);
                expect(td.explain(proto.setConditionKey).calls[0].args[0]).to.equal('foo');
                expect(td.explain(proto.setConditionValue).callCount).to.equal(1);
                expect(td.explain(proto.setConditionValue).calls[0].args[0]).to.equal('quux');
                expect(td.explain(proto.setOp).callCount).to.equal(1);
                expect(td.explain(proto.setOp).calls[0].args[0]).to.equal('baz');
            });
        });
    });

    context('instance methods', () => {
        context('getKey()', () => {
            it('returns the name of the key condition to perform an action', () => {
                const proto = new ExpectStub.Open.Condition();
                const wrapper = condition(proto);

                td.when(proto.getConditionKey()).thenReturn(0);
                // eslint-disable-next-line no-unused-expressions
                expect(wrapper.getKey()).to.not.exist;

                td.when(proto.getConditionKey()).thenReturn(ExpectStub.Open.Condition.Key.EXPECT_NO_ERROR);
                expect(wrapper.getKey()).to.equal('EXPECT_NO_ERROR');

                td.when(proto.getConditionKey()).thenReturn(ExpectStub.Open.Condition.Key.EXPECT_FIELD_EXIST);
                expect(wrapper.getKey()).to.equal('EXPECT_FIELD_EXIST');

                td.when(proto.getConditionKey()).thenReturn(ExpectStub.Open.Condition.Key.EXPECT_DOCID_GENERATED);
                expect(wrapper.getKey()).to.equal('EXPECT_DOCID_GENERATED');
            });
        });

        context('getOperation()', () => {
            it('returns the name of the action', () => {
                const proto = new ExpectStub.Open.Condition();
                const wrapper = condition(proto);

                td.when(proto.getOp()).thenReturn(ExpectStub.Open.Condition.ConditionOperation.EXPECT_OP_SET);
                expect(wrapper.getOperation()).to.equal('EXPECT_OP_SET');

                td.when(proto.getOp()).thenReturn(ExpectStub.Open.Condition.ConditionOperation.EXPECT_OP_UNSET);
                expect(wrapper.getOperation()).to.equal('EXPECT_OP_UNSET');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Expect.Condition message', () => {
                const proto = new ExpectStub.Open.Condition();
                const wrapper = condition(proto);

                const getKey = td.replace(wrapper, 'getKey');
                const getOperation = td.replace(wrapper, 'getOperation');

                td.when(getKey()).thenReturn('foo');
                td.when(proto.getConditionValue()).thenReturn('p_bar');
                td.when(bytes('p_bar')).thenReturn({ toJSON: () => 'bar' });
                td.when(getOperation()).thenReturn('baz');

                expect(wrapper.toJSON()).to.deep.equal({ condition_key: 'foo', condition_value: 'bar', op: 'baz' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new ExpectStub.Open.Condition();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(condition(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
