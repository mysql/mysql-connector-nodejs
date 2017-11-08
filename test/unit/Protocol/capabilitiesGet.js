"use strict";

chai.should();

var assert = require("assert");

describe('Client', function () {
    // TODO(Rui): update tests when the remaining Client interface is refactored.
    describe.skip('capabilitiesGet', function () {
        it('should send a Capabilities Get message', function () {
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
            protocol.capabilitiesGet();
            assert.notEqual(sentData, null, "There was no data sent");
            var data = protocol.decodeMessage(sentData, 0, protocol.clientMessages);
            assert.strictEqual(data.messageId, Messages.ClientMessages.CON_CAPABILITIES_GET);
        });
        it('should resolve Promise with empty capabilities', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.capabilitiesGet();
            protocol.handleNetworkFragment(protocol.encodeMessage(Messages.ServerMessages.CONN_CAPABILITIES, {}, protocol.serverMessages));
            return promise.should.eventually.deep.equal({});
        });
        it('should resolve multiple Promises with multiple responses in one network package', function () {
            var protocol = new Client(nullStream),
                promises = [
                    protocol.capabilitiesGet(),
                    protocol.capabilitiesGet(),
                    protocol.capabilitiesGet()
                ],
                all = Promise.all(promises),
                singleResponse = protocol.encodeMessage(Messages.ServerMessages.CONN_CAPABILITIES, {}, protocol.serverMessages),
                result = new Buffer(singleResponse.length * promises.length);
            for (var i = 0; i < promises.length; ++i) {
                singleResponse.copy(result, i * singleResponse.length);
            }
            protocol.handleNetworkFragment(result);
            return all.should.be.fulfilled;
        })
        it('should return Promise with empty capabilities from server', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.capabilitiesGet();
            var caps = { /* TODO - Use an encoder for this so we can share input here with the expected below and make this readable */
                capabilities: [
                    {
                        name: "some.capability",
                        value: {
                            type: 1, /* scalar */
                            scalar: {
                                type: 8, /* string */
                                v_string: {
                                    value: "foobar"
                                }
                            }
                        }
                    },
                    {
                        name: "some.other.capability",
                        value: {
                            type: 3, /* array */
                            array: {
                                value: [
                                    {
                                        type: 1, /* scalar */
                                        scalar: {
                                            type: 8, /* string */
                                            v_string: {
                                                value: "1st item"
                                            }
                                        }
                                    },
                                    {
                                        type: 1, /* scalar */
                                        scalar: {
                                            type: 8, /* string */
                                            v_string: {
                                                value: "2nd item"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ]
            };
            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.CONN_CAPABILITIES, caps, Encoding.serverMessages));
            return promise.should.eventually.deep.equal({
                "some.capability": "foobar",
                "some.other.capability": [
                    "1st item",
                    "2nd item"
                ]
            });
        });
        it('should throw an error when receiving multiple messages', function () {
            var protocol = new Client(nullStream);
            var promise = protocol.capabilitiesGet();
            protocol.handleNetworkFragment(protocol.encodeMessage(Messages.ServerMessages.CONN_CAPABILITIES, {}, protocol.serverMessages));
            assert.throws(
                function () {
                    protocol.handleNetworkFragment(protocol.encodeMessage(Messages.ServerMessages.CONN_CAPABILITIES, {}, protocol.serverMessages));
                },
                /Queue is empty/
            );
            return promise.should.eventually.deep.equal({});
        });
    });
});
