'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let deallocate = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Deallocate');

describe('Mysqlx.Prepare.Deallocate wrapper', () => {
    let PrepareStub, serializable, wraps;

    beforeEach('create fakes', () => {
        PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        deallocate = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Deallocate');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Prepare.Deallocate expression wrapper for a given statement object', () => {
                const proto = new PrepareStub.Deallocate();
                const statement = { getStatementId: td.function() };

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });
                td.when(statement.getStatementId()).thenReturn('bar');

                expect(deallocate.create(statement).valueOf()).to.equal('foo');
                expect(td.explain(proto.setStmtId).callCount).to.equal(1);
                expect(td.explain(proto.setStmtId).calls[0].args[0]).to.equal('bar');
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new PrepareStub.Deallocate();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(deallocate(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Prepare.Deallocate message', () => {
                const proto = new PrepareStub.Deallocate();

                td.when(proto.getStmtId()).thenReturn('foo');

                expect(deallocate(proto).toJSON()).to.deep.equal({ stmt_id: 'foo' });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new PrepareStub.Deallocate();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(deallocate(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
