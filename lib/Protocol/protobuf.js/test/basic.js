/* global describe, it */
var Protobuf = require('../index');
var Schema = require('./schema');
var Chai = require('chai');
Chai.Assertion.includeStack = true;
var long = require('long');
var expect = Chai.expect;
var client, encoded, decoded, check;

describe('Basic tests', function () {
    it('Can initialize with a schema', function () {
        client = new Protobuf(Schema);
        expect(client.schema).to.exist;
    });

    it('Can encode the max uint32', function () {
        decoded = 4294967295;
        encoded = client.encode('Test1', { uint32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the max uint32', function () {
        check = client.decode('Test1', encoded);
        expect(check.uint32).to.exist;
        expect(check.uint32).to.deep.equal(decoded);
    });

    it('Can encode the min uint32', function () {
        decoded = 0;
        encoded = client.encode('Test1', { uint32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the min uint32', function () {
        check = client.decode('Test1', encoded);
        expect(check.uint32).to.exist;
        expect(check.uint32).to.deep.equal(decoded);
    });

    it('Can encode the max int32', function () {
        decoded = 2147483647;
        encoded = client.encode('Test1', { int32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the max int32', function () {
        check = client.decode('Test1', encoded);
        expect(check.int32).to.exist;
        expect(check.int32).to.deep.equal(decoded);
    });

    it('Can encode the min int32', function () {
        decoded = -2147483648;
        encoded = client.encode('Test1', { int32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the min int32', function () {
        check = client.decode('Test1', encoded);
        expect(check.int32).to.exist;
        expect(check.int32).to.deep.equal(decoded);
    });

    it('Can encode the min sint32', function () {
        decoded = -2147483648;
        encoded = client.encode('Test1', { sint32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the min sint32', function () {
        check = client.decode('Test1', encoded);
        expect(check.sint32).to.exist;
        expect(check.sint32).to.deep.equal(decoded);
    });

    it('Can encode the max sint32', function () {
        decoded = 2147483647;
        encoded = client.encode('Test1', { sint32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the max sint32', function () {
        check = client.decode('Test1', encoded);
        expect(check.sint32).to.exist;
        expect(check.sint32).to.deep.equal(decoded);
    });

    it('Can encode the max int64', function () {
        decoded = long.MAX_SIGNED_VALUE;
        encoded = client.encode('Test1', { int64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the max int64', function () {
        check = client.decode('Test1', encoded);
        expect(check.int64).to.exist;
        expect(check.int64).to.deep.equal(decoded);
    });

    it('Can encode the min int64', function () {
        decoded = long.MIN_SIGNED_VALUE;
        encoded = client.encode('Test1', { int64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the min int64', function () {
        check = client.decode('Test1', encoded);
        expect(check.int64).to.exist;
        expect(check.int64).to.deep.equal(decoded);
    });

    it('Can encode a uint64', function () {
        decoded = long.fromNumber(987654321, true);
        encoded = client.encode('Test1', { uint64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode a uint64', function () {
        check = client.decode('Test1', encoded);
        expect(check.uint64).to.exist;
        expect(check.uint64).to.deep.equal(decoded);
    });

    it('Can encode the max sint64', function () {
        decoded = long.MAX_SIGNED_VALUE;
        encoded = client.encode('Test1', { sint64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the max sint64', function () {
        check = client.decode('Test1', encoded);
        expect(check.sint64).to.exist;
        expect(check.sint64).to.deep.equal(decoded);
    });

    it('Can encode the min sint64', function () {
        decoded = long.MIN_SIGNED_VALUE;
        encoded = client.encode('Test1', { sint64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode the min sint64', function () {
        check = client.decode('Test1', encoded);
        expect(check.sint64).to.exist;
        expect(check.sint64).to.deep.equal(decoded);
    });

    it('Can encode a bool', function () {
        decoded = true;
        encoded = client.encode('Test1', { bool: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode a bool', function () {
        check = client.decode('Test1', encoded);
        expect(check.bool).to.exist;
        expect(check.bool).to.deep.equal(decoded);
    });

    it('Can encode an enum', function () {
        decoded = 1;
        encoded = client.encode('Test1', { enum: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode an enum', function () {
        check = client.decode('Test1', encoded);
        expect(check.enum).to.exist;
        expect(check.enum).to.deep.equal(decoded);
    });

    it('Can encode a string', function () {
        decoded = 'test string';
        encoded = client.encode('Test1', { string: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode a string', function () {
        check = client.decode('Test1', encoded);
        expect(check.string).to.exist;
        expect(check.string).to.deep.equal(decoded);
    });

    it('Can encode a utf8 string', function () {
        decoded = 'testing ✓';
        encoded = client.encode('Test1', { string: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode a utf8 string', function () {
        check = client.decode('Test1', encoded);
        expect(check.string).to.exist;
        expect(check.string).to.deep.equal(decoded);
    });

    it('Can encode bytes', function () {
        decoded = new Buffer([0x00, 0x01, 0x02, 0x03, 0x04]);
        encoded = client.encode('Test1', { bytes: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode bytes', function () {
        check = client.decode('Test1', encoded);
        expect(check.bytes).to.exist;
        expect(check.bytes).to.deep.equal(decoded);
    });

    it('Can encode a fixed64', function () {
        decoded = long.fromNumber(987654321, true);
        encoded = client.encode('Test1', { fixed64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode a fixed64', function () {
        check = client.decode('Test1', encoded);
        expect(check.fixed64).to.exist;
        expect(check.fixed64).to.deep.equal(decoded);
    });

    it('Can encode an sfixed64', function () {
        decoded = long.fromNumber(987654321);
        encoded = client.encode('Test1', { sfixed64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode an sfixed64', function () {
        check = client.decode('Test1', encoded);
        expect(check.sfixed64).to.exist;
        expect(check.sfixed64).to.deep.equal(decoded);
    });

    it('Can encode a double', function () {
        decoded = long.fromNumber(987654321, true);
        encoded = client.encode('Test1', { double: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode a double', function () {
        check = client.decode('Test1', encoded);
        expect(check.double).to.exist;
        expect(check.double).to.deep.equal(decoded);
    });

    it('Can encode a fixed32', function () {
        decoded = 12345;
        encoded = client.encode('Test1', { fixed32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode a fixed32', function () {
        check = client.decode('Test1', encoded);
        expect(check.fixed32).to.exist;
        expect(check.fixed32).to.deep.equal(decoded);
    });

    it('Can encode an sfixed32', function () {
        decoded = -12345;
        encoded = client.encode('Test1', { sfixed32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode an sfixed32', function () {
        check = client.decode('Test1', encoded);
        expect(check.sfixed32).to.exist;
        expect(check.sfixed32).to.deep.equal(decoded);
    });

    it('Can encode a float', function () {
        decoded = 1278;
        encoded = client.encode('Test1', { float: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode a float', function () {
        check = client.decode('Test1', encoded);
        expect(check.float).to.exist;
        expect(check.float).to.deep.equal(decoded);
    });
});
