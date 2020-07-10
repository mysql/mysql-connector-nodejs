'use strict';

/* eslint-env node, mocha */

const CrudStub = require('../../../../../lib/Protocol/Stubs/mysqlx_crud_pb');
const expect = require('chai').expect;
const polyglot = require('../../../../../lib/Protocol/Wrappers/Traits/Polyglot');
const td = require('testdouble');

describe('Polyglot trait', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getDataModel()', () => {
        it('returns the data model name of a valid protobuf stub instance', () => {
            const proto = new CrudStub.Find();
            proto.setDataModel(CrudStub.DataModel.DOCUMENT);
            expect(polyglot(proto).getDataModel()).to.equal('DOCUMENT');

            proto.setDataModel(CrudStub.DataModel.TABLE);
            expect(polyglot(proto).getDataModel()).to.equal('TABLE');
        });

        it('returns undefined if the data model is not available', () => {
            const getDataModel = td.function();
            const proto = { getDataModel };

            td.when(getDataModel()).thenReturn(CrudStub.DataModel[CrudStub.DataModel.length - 1] + 1);
            // eslint-disable-next-line no-unused-expressions
            expect(polyglot(proto).getDataModel()).to.not.exist;

            td.when(getDataModel()).thenReturn();
            return expect(polyglot(proto).getDataModel()).to.not.exist;
        });
    });
});
