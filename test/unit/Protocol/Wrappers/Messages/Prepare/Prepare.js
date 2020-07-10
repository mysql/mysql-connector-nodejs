'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let prepare = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');

describe('Mysqlx.Prepare.Prepare wrapper', () => {
    let PrepareStub, oneOfMessage, serializable, wraps;

    beforeEach('create fakes', () => {
        PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
        oneOfMessage = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/OneOfMessage');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        prepare = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Prepare');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Prepare.Prepare wrapper instance for a given statement object', () => {
                const proto = new PrepareStub.Prepare();
                const statement = { getStatementId: td.function() };

                td.when(statement.getStatementId()).thenReturn('foo');
                td.when(oneOfMessage.create(statement, { toPrepare: true })).thenReturn({ valueOf: () => 'bar' });
                td.when(wraps(proto)).thenReturn({ valueOf: () => 'baz' });

                expect(prepare.create(statement).valueOf()).to.equal('baz');
                expect(td.explain(proto.setStmtId).callCount).to.equal(1);
                expect(td.explain(proto.setStmtId).calls[0].args[0]).to.equal('foo');
                expect(td.explain(proto.setStmt).callCount).to.equal(1);
                expect(td.explain(proto.setStmt).calls[0].args[0]).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new PrepareStub.Prepare();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(prepare(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Prepare.Prepare message', () => {
                const proto = new PrepareStub.Prepare();

                td.when(proto.getStmtId()).thenReturn('foo');
                td.when(proto.getStmt()).thenReturn('p_bar');
                td.when(oneOfMessage('p_bar')).thenReturn({ toJSON: () => 'bar' });

                expect(prepare(proto).toJSON()).to.deep.equal({ stmt_id: 'foo', stmt: 'bar' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new PrepareStub.Prepare();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(prepare(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
