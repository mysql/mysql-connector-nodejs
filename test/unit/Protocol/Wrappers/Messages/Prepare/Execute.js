'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let execute = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');

describe('Mysqlx.Prepare.Execute wrapper', () => {
    let PrepareStub, any, expr, list, serializable, wraps;

    beforeEach('create fakes', () => {
        PrepareStub = td.replace('../../../../../../lib/Protocol/Stubs/mysqlx_prepare_pb');
        any = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Any');
        expr = td.replace('../../../../../../lib/Protocol/Wrappers/Messages/Expr/Expr');
        list = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/List');
        serializable = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Serializable');
        wraps = td.replace('../../../../../../lib/Protocol/Wrappers/Traits/Wraps');
        execute = require('../../../../../../lib/Protocol/Wrappers/Messages/Prepare/Execute');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('class methods', () => {
        context('create()', () => {
            it('returns a Mysqlx.Prepare.Execute wrap instance appending count to the list of args', () => {
                const proto = new PrepareStub.Execute();
                const statement = { getCriteria: td.function(), getBindings: td.function(), getCount: td.function(), getOffset: td.function(), getStatementId: td.function() };
                const getPlaceholderArgs = td.function();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                td.when(statement.getCriteria()).thenReturn('bar');
                td.when(expr.create('bar', { toParse: true })).thenReturn({ getPlaceholderArgs });
                td.when(statement.getBindings()).thenReturn('s_baz');
                td.when(getPlaceholderArgs('s_baz')).thenReturn(['p_baz']);
                td.when(any.create('p_baz')).thenReturn({ valueOf: () => 'baz' });

                td.when(statement.getCount()).thenReturn('s_qux');
                td.when(any.create('s_qux')).thenReturn({ valueOf: () => 'qux' });

                td.when(statement.getOffset()).thenReturn();

                td.when(statement.getStatementId()).thenReturn('quux');

                expect(execute.create(statement).valueOf()).to.equal('foo');
                expect(td.explain(proto.setStmtId).callCount).to.equal(1);
                expect(td.explain(proto.setStmtId).calls[0].args[0]).to.equal('quux');
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal(['baz', 'qux']);
            });

            it('returns a Mysqlx.Prepare.Execute wrap instance appending count and offset to the list of args', () => {
                const proto = new PrepareStub.Execute();
                const statement = { getCriteria: td.function(), getBindings: td.function(), getCount: td.function(), getOffset: td.function(), getStatementId: td.function() };
                const getPlaceholderArgs = td.function();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                td.when(statement.getCriteria()).thenReturn('bar');
                td.when(expr.create('bar', { toParse: true })).thenReturn({ getPlaceholderArgs });
                td.when(statement.getBindings()).thenReturn('s_baz');
                td.when(getPlaceholderArgs('s_baz')).thenReturn(['p_baz']);
                td.when(any.create('p_baz')).thenReturn({ valueOf: () => 'baz' });

                td.when(statement.getCount()).thenReturn('s_qux');
                td.when(any.create('s_qux')).thenReturn({ valueOf: () => 'qux' });

                td.when(statement.getOffset()).thenReturn('s_quux');
                td.when(any.create('s_quux')).thenReturn({ valueOf: () => 'quux' });

                td.when(statement.getStatementId()).thenReturn('quuz');

                expect(execute.create(statement).valueOf()).to.equal('foo');
                expect(td.explain(proto.setStmtId).callCount).to.equal(1);
                expect(td.explain(proto.setStmtId).calls[0].args[0]).to.equal('quuz');
                expect(td.explain(proto.setArgsList).callCount).to.equal(1);
                expect(td.explain(proto.setArgsList).calls[0].args[0]).to.deep.equal(['baz', 'qux', 'quux']);
            });
        });
    });

    context('instance methods', () => {
        context('serialize()', () => {
            it('returns a raw network buffer of the underlying protobuf message', () => {
                const proto = new PrepareStub.Execute();

                td.when(serializable(proto)).thenReturn({ serialize: () => 'foo' });

                expect(execute(proto).serialize()).to.equal('foo');
            });
        });

        context('toJSON()', () => {
            it('returns a textual representation of a Mysqlx.Prepare.Execute message', () => {
                const proto = new PrepareStub.Execute();

                td.when(proto.getStmtId()).thenReturn('foo');
                td.when(proto.getArgsList()).thenReturn(['p_bar', 'p_baz']);
                td.when(any('p_bar')).thenReturn('a_bar');
                td.when(any('p_baz')).thenReturn('a_baz');
                td.when(list(['a_bar', 'a_baz'])).thenReturn({ toJSON: () => ['bar', 'baz'] });

                expect(execute(proto).toJSON()).to.deep.equal({ stmt_id: 'foo', args: ['bar', 'baz'] });
            });
        });

        context('valueOf()', () => {
            it('returns the underlying protobuf stub instance', () => {
                const proto = new PrepareStub.Execute();

                td.when(wraps(proto)).thenReturn({ valueOf: () => 'foo' });

                expect(execute(proto).valueOf()).to.equal('foo');
            });
        });
    });
});
