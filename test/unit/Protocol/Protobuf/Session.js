'use strict';

/* eslint-env node, mocha */

const ResetStub = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_session_pb').Reset;
const expect = require('chai').expect;
const td = require('testdouble');

describe('Protobuf', () => {
    context('Session', () => {
        let Session;

        afterEach('reset fakes', () => {
            td.reset();
        });

        context('encodeReset()', () => {
            let FakeResetStub;

            beforeEach('create fakes', () => {
                FakeResetStub = td.constructor(ResetStub);

                td.replace('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_session_pb', { Reset: FakeResetStub });
                Session = require('../../../../lib/Protocol/Protobuf/Adapters/Session');
            });

            it('require the session to be kept open by default (without need for re-authentication)', () => {
                td.when(FakeResetStub.prototype.serializeBinary()).thenReturn('bar');

                const reset = Session.encodeReset();

                // eslint-disable-next-line node/no-deprecated-api
                expect(reset).to.deep.equal(new Buffer('bar'));
                expect(td.explain(FakeResetStub.prototype.setKeepOpen).callCount).to.equal(1);
                return expect(td.explain(FakeResetStub.prototype.setKeepOpen).calls[0].args[0]).to.equal(true);
            });

            it('allows to not require the session to be kept open', () => {
                td.when(FakeResetStub.prototype.serializeBinary()).thenReturn('bar');

                const reset = Session.encodeReset({ keepOpen: false });

                // eslint-disable-next-line node/no-deprecated-api
                expect(reset).to.deep.equal(new Buffer('bar'));
                return expect(td.explain(FakeResetStub.prototype.setKeepOpen).callCount).to.equal(0);
            });
        });
    });
});
