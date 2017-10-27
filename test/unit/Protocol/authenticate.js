"use strict";

chai.should();

var assert = require("assert");

describe('Client', function () {
    describe('Authentication', function () {
        describe('Single-Pass', function () {
            it('should put the initial data into the Authentication Start message', function () {
                var sentData = null;
                var testBuffer = new Buffer([0, 1, 2, 3, 4, 5]);

                var mockedStream = {
                    on: function () {
                    },
                    write: function (data) {
                        sentData = data;
                    }
                };
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                        return testBuffer;
                    }
                };

                var protocol = new Client(mockedStream);
                assert.strictEqual(sentData, null, "There was data sent too early");
                protocol.authenticate(mockedAuthenticator);
                assert.notEqual(sentData, null, "There was no data sent");
                var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
                assert.strictEqual(data.decoded.auth_data.length, testBuffer.length);
                assert.strictEqual(data.decoded.auth_data.toString(), testBuffer.toString());
            });
            it('should put the authenticator\'s name in the Authentication Start message', function () {
                var sentData = null;

                var mockedStream = {
                    on: function () {
                    },
                    write: function (data) {
                        sentData = data;
                    }
                };
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                        return;
                    }
                };

                var protocol = new Client(mockedStream);
                assert.equal(sentData, null, "There was data sent too early");
                protocol.authenticate(mockedAuthenticator);
                assert.notEqual(sentData, null, "There was no data sent");
                var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
                assert.strictEqual(data.decoded.mech_name, 'mock');
            });
            it('should resolve Promise if Authentication succeeds after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, Encoding.serverMessages));
                return promise.should.be.fulfilled;
            });
            it('should allow Failing with empty reason after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {}, Encoding.serverMessages));
                return promise.should.be.rejected;
            });
            it('should allow to provide a reason, when Failing after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var message = "This is a test!";
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {msg: message}, Encoding.serverMessages));
                return promise.should.be.rejected;
            });
            it('should empty queue if auth succeeds after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, Encoding.serverMessages));
                return promise.then(function () {
                    assert.equal(protocol._workQueue.hasMore(), false);
                    return true;
                });
            });
            it('should allow Failing with empty reason after Auth Start', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {}, Encoding.serverMessages));
                return promise.catch(function () {
                    assert.equal(protocol._workQueue.hasMore(), false);
                    return true;
                });
            });
        });
        describe('multi-pass', function () {
            it('should put the additional data into the Authentication Continue message', function () {
                var sentData = null;
                var testBuffers = [ new Buffer([0, 1, 2, 3, 4, 5]), new Buffer([6, 7, 8, 9]) ];

                var mockedStream = {
                    on: function () {
                    },
                    write: function (data) {
                        sentData = data;
                    }
                };
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    },
                    getNextAuthData: function () {
                        return testBuffers.shift();
                    }
                };

                var protocol = new Client(mockedStream);
                protocol.authenticate(mockedAuthenticator);
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
                assert.strictEqual(data.decoded.auth_data.toString(), (new Buffer([0, 1, 2, 3, 4, 5])).toString());
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                var data = Encoding.decodeMessage(sentData, 0, Encoding.clientMessages);
                assert.strictEqual(data.decoded.auth_data.toString(), (new Buffer([6, 7, 8, 9])).toString());
            });
            it('should fail if handler doesn\'t expect continuation', function () {
                var sentData = null;

                var mockedStream = {
                    on: function () {
                    },
                    write: function (data) {
                        sentData = data;
                    }
                };
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    },
                };

                var protocol = new Client(mockedStream);
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                return promise.should.be.rejected;
            });
            it('should resolve Promise if Authentication succeeds after Auth Continue', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    },
                    getNextAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_OK, {}, Encoding.serverMessages));
                return promise.should.be.fulfilled;
            });
            it('should fail if Authentication fails after Auth Continue', function () {
                var protocol = new Client(nullStream);
                var mockedAuthenticator = {
                    name: 'mock',
                    getInitialAuthData: function () {
                    },
                    getNextAuthData: function () {
                    }
                };
                var promise = protocol.authenticate(mockedAuthenticator);
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.SESS_AUTHENTICATE_CONTINUE, {}, Encoding.serverMessages));
                protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.ERROR, {}, Encoding.serverMessages));
                return promise.should.be.rejected;
            });
            it('should detect old MySQL protocol', function () {
                const protocol = new Client(nullStream),
                    buf = new Buffer([ // MySQL welcome package
                        0x4d, 0x00, 0x00, 0x00, 0x0a, 0x35, 0x2e, 0x37, 0x2e, 0x35, 0x2d, 0x6d, 0x31, 0x35, 0x00, 0x0b,
                        0x00, 0x00, 0x00, 0x44, 0x37, 0x23, 0x48, 0x22, 0x6d, 0x22, 0x5d, 0x00, 0xff, 0xf7, 0x08, 0x02,
                        0x00, 0xff, 0x81, 0x15, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x76,
                        0x25, 0x4e, 0x3e, 0x2a, 0x54, 0x4a, 0x57, 0x55, 0x27, 0x5e, 0x00, 0x6d, 0x79, 0x73, 0x71, 0x6c,
                        0x5f, 0x6e, 0x61, 0x74, 0x69, 0x76, 0x65, 0x5f, 0x70, 0x61, 0x73, 0x73, 0x77, 0x6f, 0x72, 0x64,
                        0x00]);
                (function () {
                    protocol.handleNetworkFragment(buf);
                }).should.throw(/is no MySQL server speaking X Protocol/);
            });
        });
    });
});
