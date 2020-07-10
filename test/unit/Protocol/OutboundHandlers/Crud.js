'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let crud = require('../../../../lib/Protocol/OutboundHandlers/Crud');

describe('Mysqlx.Crud outbound handler', () => {
    let crudDelete, crudFind, crudInsert, crudUpdate, logger, info;

    beforeEach('create fakes', () => {
        crudDelete = td.replace('../../../../lib/Protocol/Wrappers/Messages/Crud/Delete');
        crudFind = td.replace('../../../../lib/Protocol/Wrappers/Messages/Crud/Find');
        crudInsert = td.replace('../../../../lib/Protocol/Wrappers/Messages/Crud/Insert');
        crudUpdate = td.replace('../../../../lib/Protocol/Wrappers/Messages/Crud/Update');
        logger = td.replace('../../../../lib/tool/log');

        info = td.function();
        td.when(logger('protocol:outbound:Mysqlx.Crud')).thenReturn({ info });

        crud = require('../../../../lib/Protocol/OutboundHandlers/Crud');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    it('serializes and logs Mysqlx.Crud.Delete messages', () => {
        const message = { serialize: td.function() };

        td.when(crudDelete.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(crud.encodeDelete('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Delete');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Crud.Find messages', () => {
        const message = { serialize: td.function() };

        td.when(crudFind.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(crud.encodeFind('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Find');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Crud.Insert messages', () => {
        const message = { serialize: td.function() };

        td.when(crudInsert.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(crud.encodeInsert('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Insert');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });

    it('serializes and logs Mysqlx.Crud.Update messages', () => {
        const message = { serialize: td.function() };

        td.when(crudUpdate.create('foo')).thenReturn(message);
        td.when(message.serialize()).thenReturn('bar');

        expect(crud.encodeUpdate('foo')).to.equal('bar');
        expect(td.explain(info).callCount).to.equal(1);
        expect(td.explain(info).calls[0].args[0]).to.equal('Update');
        expect(td.explain(info).calls[0].args[1]).to.deep.equal(message);
    });
});
