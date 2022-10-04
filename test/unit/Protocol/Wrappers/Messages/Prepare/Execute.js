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
let Execute = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');

describe('Mysqlx.Prepare.Execute wrapper', () => {
    let PrepareStub;

    beforeEach('replace dependencies with test doubles', () => {
        PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
        // reload module with the replacements
        Execute = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let Any, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Any = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Execute = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');
            });

            it('creates a Mysqlx.Prepare.Execute wrapper with a a list of placeholder values', () => {
                const placeholderValues = ['foo', 'bar'];
                const placeholderProtoValues = placeholderValues.map(p => `${p}_proto`);
                const proto = new PrepareStub.Execute();
                const protoValue = 'baz';
                const statementId = 'qux';
                const statement = {
                    getCount_: () => undefined,
                    getPlaceholderValues_: () => placeholderValues,
                    getStatementId: () => statementId
                };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Any.create(placeholderValues[0])).thenReturn({ valueOf: () => placeholderProtoValues[0] });
                td.when(Any.create(placeholderValues[1])).thenReturn({ valueOf: () => placeholderProtoValues[1] });

                expect(Execute.create(statement).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setStmtId).callCount).to.equal(1);
                expect(td.explain(proto.setStmtId).calls[0].args[0]).to.equal(statementId);
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal(placeholderProtoValues);
            });

            it('creates a Mysqlx.Prepare.Execute wrapper adding a limit row count to list of placeholder values', () => {
                const count = 'foo';
                const countProto = `${count}_proto`;
                const placeholderValues = ['bar', 'baz'];
                const placeholderProtoValues = placeholderValues.map(p => `${p}_proto`);
                const expected = [...placeholderProtoValues, countProto];
                const proto = new PrepareStub.Execute();
                const protoValue = 'qux';
                const statementId = 'quux';
                const statement = {
                    getCount_: () => count,
                    getOffset_: () => undefined,
                    getPlaceholderValues_: () => placeholderValues,
                    getStatementId: () => statementId
                };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Any.create(placeholderValues[0])).thenReturn({ valueOf: () => placeholderProtoValues[0] });
                td.when(Any.create(placeholderValues[1])).thenReturn({ valueOf: () => placeholderProtoValues[1] });
                td.when(Any.create(count)).thenReturn({ valueOf: () => countProto });

                expect(Execute.create(statement).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setStmtId).callCount).to.equal(1);
                expect(td.explain(proto.setStmtId).calls[0].args[0]).to.equal(statementId);
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal(expected);
            });

            it('creates a Mysqlx.Prepare.Execute wrapper adding a limit row count and offset to the list of placeholder values', () => {
                const count = 'foo';
                const countProto = `${count}_proto`;
                const offset = 'bar';
                const offsetProto = `${offset}_proto`;
                const placeholderValues = ['baz', 'qux'];
                const placeholderProtoValues = placeholderValues.map(p => `${p}_proto`);
                const expected = [...placeholderProtoValues, countProto, offsetProto];
                const proto = new PrepareStub.Execute();
                const protoValue = 'quux';
                const statementId = 'quuux';
                const statement = {
                    getCount_: () => count,
                    getOffset_: () => offset,
                    getPlaceholderValues_: () => placeholderValues,
                    getStatementId: () => statementId
                };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(Any.create(placeholderValues[0])).thenReturn({ valueOf: () => placeholderProtoValues[0] });
                td.when(Any.create(placeholderValues[1])).thenReturn({ valueOf: () => placeholderProtoValues[1] });
                td.when(Any.create(count)).thenReturn({ valueOf: () => countProto });
                td.when(Any.create(offset)).thenReturn({ valueOf: () => offsetProto });

                expect(Execute.create(statement).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setStmtId).callCount).to.equal(1);
                expect(td.explain(proto.setStmtId).calls[0].args[0]).to.equal(statementId);
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal(expected);
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            let Serializable;

            beforeEach('replace dependencies with test doubles', () => {
                Serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
                // reload module with the replacements
                Execute = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');
            });

            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new PrepareStub.Execute();
                const expected = 'foo';

                td.when(Serializable(proto)).thenReturn({ serialize: () => expected });

                expect(Execute(proto).serialize()).to.equal(expected);
            });
        });

        context('toJSON()', () => {
            let Any, List;

            beforeEach('replace dependencies with test doubles', () => {
                PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
                Any = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
                List = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
                // reload module with the replacements
                Execute = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');
            });

            it('returns a textual representation of a Mysqlx.Prepare.Execute message', () => {
                const args = ['foo', 'bar'];
                const argsProtoList = args.map(a => `${a}_proto`);
                const argsAnyList = args.map(a => `${a}_any`);
                const proto = new PrepareStub.Execute();
                const statementId = 'baz';

                td.when(proto.getStmtId()).thenReturn(statementId);
                td.when(proto.getArgsList()).thenReturn(argsProtoList);
                td.when(Any(argsProtoList[0])).thenReturn(argsAnyList[0]);
                td.when(Any(argsProtoList[1])).thenReturn(argsAnyList[1]);
                td.when(List(argsAnyList)).thenReturn({ toJSON: () => args });

                expect(Execute(proto).toJSON()).to.deep.equal({ stmt_id: statementId, args });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Execute = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new PrepareStub.Execute();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Execute(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
