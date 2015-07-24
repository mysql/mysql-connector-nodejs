"use strict";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

chai.should();
chai.use(chaiAsPromised);

var assert = require("assert");
var Protocol = require("../../lib/Protocol");
var Messages = require('../../lib/Protocol/Messages');

var nullStream = {
    on: function () {},
    write: function () {}
};

describe('Protocol', function () {
    describe('capabilitiesGet', function () {
        it('should send a Capabilities Get message', function () {
            var sentData = null;

            var mockedStream = {
                on: function () {
                },
                write: function (data) {
                    sentData = data;
                }
            };

            var protocol = new Protocol(mockedStream);
            assert.strictEqual(sentData, null, "There was data sent too early");
            protocol.capabilitiesGet();
            assert.notEqual(sentData, null, "There was no data sent");
            var data = protocol.decodeMessage(sentData, 0, protocol.clientMessages);
            assert.strictEqual(data.messageId, Messages.ClientMessages.CON_CAPABILITIES_GET);
        });
        it('should resolve Promise with empty capabilities', function () {
            var protocol = new Protocol(nullStream);
            var promise = protocol.capabilitiesGet();
            protocol.handleServerMessage(protocol.encodeMessage(Messages.ServerMessages.CONN_CAPABILITIES, {}, protocol.serverMessages));
            return promise.should.eventually.deep.equal({}); // be.fulfilled;
        });
    });
});
