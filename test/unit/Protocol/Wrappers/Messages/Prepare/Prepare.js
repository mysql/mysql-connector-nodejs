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
let Prepare = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');

describe('Mysqlx.Prepare.Prepare wrapper', () => {
    let PrepareStub;

    beforeEach('replace dependencies with test doubles', () => {
        PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
        // reload module with the replacements
        Prepare = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');
    });

    afterEach('restore original dependencies', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            let OneOfMessage, Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
                OneOfMessage = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Prepare = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');
            });

            it('creates a Mysqlx.Prepare.Prepare wrapper for a given statement instance', () => {
                const oneOfMessageProto = 'foo';
                const proto = new PrepareStub.Prepare();
                const protoValue = 'bar';
                const statementId = 'baz';
                const statement = { getStatementId: () => statementId };

                td.when(Wraps(proto)).thenReturn({ valueOf: () => protoValue });
                td.when(OneOfMessage.create(statement, { toPrepare: true })).thenReturn({ valueOf: () => oneOfMessageProto });

                expect(Prepare.create(statement).valueOf()).to.equal(protoValue);
                expect(td.explain(proto.setStmtId).callCount).to.equal(1);
                expect(td.explain(proto.setStmtId).calls[0].args[0]).to.equal(statementId);
                expect(td.explain(proto.setStmt).callCount).to.equal(1);
                expect(td.explain(proto.setStmt).calls[0].args[0]).to.equal(oneOfMessageProto);
            });
        });
    });

    context('instance methods', () => {
        let Serializable;

        beforeEach('replace dependencies with test doubles', () => {
            Serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
            // reload module with the replacements
            Prepare = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');
        });

        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new PrepareStub.Prepare();
                const expected = 'foo';

                td.when(Serializable(proto)).thenReturn({ serialize: () => expected });

                expect(Prepare(proto).serialize()).to.equal(expected);
            });
        });

        context('toJSON()', () => {
            let OneOfMessage;

            beforeEach('replace dependencies with test doubles', () => {
                OneOfMessage = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');
                // reload module with the replacements
                Prepare = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');
            });

            it('returns a textual representation of a Mysqlx.Prepare.Prepare message', () => {
                const proto = new PrepareStub.Prepare();
                const stmt = 'foo';
                const stmtId = 'bar';
                const stmtProto = `${stmt}_proto`;

                td.when(proto.getStmtId()).thenReturn(stmtId);
                td.when(proto.getStmt()).thenReturn(stmtProto);
                td.when(OneOfMessage(stmtProto)).thenReturn({ toJSON: () => stmt });

                expect(Prepare(proto).toJSON()).to.deep.equal({ stmt_id: stmtId, stmt });
            });
        });

        context('valueOf()', () => {
            let Wraps;

            beforeEach('replace dependencies with test doubles', () => {
                Wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
                // reload module with the replacements
                Prepare = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');
            });

            it('returns the underlying protobuf stub instance', () => {
                const proto = new PrepareStub.Prepare();
                const expected = 'foo';

                td.when(Wraps(proto)).thenReturn({ valueOf: () => expected });

                expect(Prepare(proto).valueOf()).to.equal(expected);
            });
        });
    });
});
