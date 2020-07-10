'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let sql = require('../../../../lib/Protocol/OutboundHandlers/Sql');

describe('Mysqlx.Sql outbound handler', () => {
    let info, logger, stmtExecute;

    beforeEach('create fakes', () => {
        stmtExecute = td.replace('../../../../lib/Protocol/Wrappers/Messages/Sql/StmtExecute');
        logger = td.replace('../../../../lib/tool/log');

        info = td.function();
        td.when(logger('protocol:outbound:Mysqlx.Sql')).thenReturn({ info });

        sql = require('../../../../lib/Protocol/OutboundHandlers/Sql');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    it('serializes and logs Mysqlx.Sql.StmtExecute messages', () => {
        const message = { serialize: td.function() };

        td.when(stmtExecute.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(sql.encodeStmtExecute('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('StmtExecute');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });
});
