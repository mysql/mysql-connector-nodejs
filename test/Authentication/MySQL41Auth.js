"use strict";

var assert = require("assert");
var MySQL41Auth = require("../../lib/Authentication/MySQL41Auth");

describe('MySQL41Auth', function () {
    it('should throw if the server sends less than 20 bytes', function () {
        var username = 'root';
        var auth = new MySQL41Auth({user: username, password: 'fff'});
        assert.throws(
            function () {
                auth.getNextAuthData(new Buffer(19));
            },
            /Scramble buffer had invalid length/
        );
    });
    it('should throw if the server sends more than 20 bytes', function () {
        var username = 'root';
        var auth = new MySQL41Auth({user: username, password: 'fff'});
        assert.throws(
            function () {
                auth.getNextAuthData(new Buffer(22));
            },
            /Scramble buffer had invalid length/
        );
    });
    it('crypted password string should be long enough for 2*\\0 + username length + 1 yte for \'*\' +20 bytes for hash', function () {
        var username = 'root';
        var auth = new MySQL41Auth({user: username, password: 'fff'});
        var result = auth.getNextAuthData(new Buffer([0xa, 0x35, 0x42, 0x1a, 0x43, 0x47, 0x6d, 0x65, 0x1, 0x4a, 0xf, 0x4c, 0x9, 0x5c, 0x32, 0x61, 0x64, 0x3c, 0x13, 0x6]));

        assert.equal(result.length, 2 + username.length + 1 + 40);
    });
    it('crypted password string should start with a \\0 byte', function () {
        var username = 'root';
        var auth = new MySQL41Auth({user: username, password: 'fff'});
        var result = auth.getNextAuthData(new Buffer([0xa, 0x35, 0x42, 0x1a, 0x43, 0x47, 0x6d, 0x65, 0x1, 0x4a, 0xf, 0x4c, 0x9, 0x5c, 0x32, 0x61, 0x64, 0x3c, 0x13, 0x6]));

        assert.equal(result[0], 0);
    });
    it('crypted password string should return the username starting at offset 1', function () {
        var username = 'root';
        var auth = new MySQL41Auth({user: username, password: 'fff'});
        var result = auth.getNextAuthData(new Buffer([0xa, 0x35, 0x42, 0x1a, 0x43, 0x47, 0x6d, 0x65, 0x1, 0x4a, 0xf, 0x4c, 0x9, 0x5c, 0x32, 0x61, 0x64, 0x3c, 0x13, 0x6]));

        assert.equal(result.slice(1, username.length + 1).toString(), username);
    });
    it('crypted password string should have a \\0 byte after username', function () {
        var username = 'root';
        var auth = new MySQL41Auth({user: username, password: 'fff'});
        var result = auth.getNextAuthData(new Buffer([0xa, 0x35, 0x42, 0x1a, 0x43, 0x47, 0x6d, 0x65, 0x1, 0x4a, 0xf, 0x4c, 0x9, 0x5c, 0x32, 0x61, 0x64, 0x3c, 0x13, 0x6]));

        assert.equal(result[username.length + 1], 0);
    });
    it('crypted password should properly hash the password fff with a given hash', function () {
        var auth = new MySQL41Auth({user: 'root', password: 'fff'});
        var result = auth.getNextAuthData(new Buffer([0xa, 0x35, 0x42, 0x1a, 0x43, 0x47, 0x6d, 0x65, 0x1, 0x4a, 0xf, 0x4c, 0x9, 0x5c, 0x32, 0x61, 0x64, 0x3c, 0x13, 0x6]));

        var exp = "*34439ed3004cf0e6030a9ec458338151bfb4e22d";
        assert.equal(result.slice(6).toString(), exp);
    });
    it('crypted password should properly hash the password fff with a given hash', function () {
        var auth = new MySQL41Auth({user: 'toor', password: 'fff'});
        var result = auth.getNextAuthData(new Buffer([0x41, 0x43, 0x56, 0x6e, 0x78, 0x19, 0x2c, 0x2c, 0x19, 0x6f, 0x18, 0x29, 0x05, 0x52, 0x3c, 0x62, 0x39, 0x3d, 0x5c, 0x77]));

        var exp = "*af1ef523d254181abb1155c1fbc933b80c2ec853";
        assert.equal(result.slice(6).toString(), exp);
    });
});

