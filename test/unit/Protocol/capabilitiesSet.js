"use strict";

chai.should();

var assert = require("assert");

describe('Client', function () {
    // TODO(Rui): update tests when the remaining Client interface is refactored.
    describe('capabilitiesSet', function () {
        it('should send a Capabilities Set message', function () {
            var sentData = null;

            var mockedStream = {
                on: function () {
                },
                write: function (data) {
                    sentData = data;
                }
            };

            var protocol = new Client(mockedStream);
            assert.strictEqual(sentData, null, "There was data sent too early");
            protocol.capabilitiesSet({});
            assert.notEqual(sentData, null, "There was no data sent");
            var data = protocol.decodeMessage(sentData, 0, protocol.clientMessages);
            assert.strictEqual(data.messageId, Messages.ClientMessages.CON_CAPABILITIES_SET);
        });
        it('should send a Capabilities Set message with a single value', function () {
            var sentData = null;

            var mockedStream = {
                on: function () {
                },
                write: function (data) {
                    sentData = data;
                }
            };

            var protocol = new Client(mockedStream);
            assert.strictEqual(sentData, null, "There was data sent too early");
            protocol.capabilitiesSet({ option: 42 });
            assert.notEqual(sentData, null, "There was no data sent");
            var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
            assert.strictEqual(data.messageId, Messages.ClientMessages.CON_CAPABILITIES_SET);
            assert.strictEqual(data.decoded.capabilities.capabilities.length, 1);
            assert.strictEqual(data.decoded.capabilities.capabilities[0].name, 'option');
        });
        it('should send a Capabilities Set message with multiple values', function () {
            var sentData = null;

            var mockedStream = {
                on: function () {
                },
                write: function (data) {
                    sentData = data;
                }
            };

            var protocol = new Client(mockedStream);
            assert.strictEqual(sentData, null, "There was data sent too early");
            protocol.capabilitiesSet({ option1: 42, option2: 24 });
            assert.notEqual(sentData, null, "There was no data sent");
            var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
            assert.strictEqual(data.messageId, Messages.ClientMessages.CON_CAPABILITIES_SET);
            assert.strictEqual(data.decoded.capabilities.capabilities.length, 2);
            assert.strictEqual(data.decoded.capabilities.capabilities[0].name, 'option1');
            assert.strictEqual(data.decoded.capabilities.capabilities[1].name, 'option2');
        });
        it('should resolve Promise', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.capabilitiesSet({});
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.OK, {}, Encoding.serverMessages));
            return promise.should.be.fulfilled;
        });
        it('should fail on error', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.capabilitiesSet({});
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, { code: 1, sql_state: 'HY000', msg: 'Invalid'}, Encoding.serverMessages));
            return promise.should.be.rejected;
        });
    });
});
