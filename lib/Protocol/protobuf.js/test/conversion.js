/* global describe, it */
var Protobuf = require('../index');
var Schema = require('./schema');
var Chai = require('chai');
Chai.Assertion.includeStack = true;
var expect = Chai.expect;
var long = require('long');
var client = new Protobuf(Schema);
var encoded, decoded, check;

describe('Conversion tests', function () {
    it('Accepts strings in place of numbers', function () {
        decoded = '1234';
        encoded = client.encode('Test1', { int32: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Decodes numbers that were strings originally', function () {
        check = client.decode('Test1', encoded);
        expect(check.int32).to.exist;
        expect(check.int32).to.be.a('number');
        expect(check.int32).to.equal(Number(decoded));
    });

    it('Accepts numbers in place of strings', function () {
        decoded = 20;
        encoded = client.encode('Test1', { string: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Decodes strings that were numbers originally', function () {
        check = client.decode('Test1', encoded);
        expect(check.string).to.exist;
        expect(check.string).to.be.a('string');
        expect(check.string).to.equal(String(decoded));
    });

    it('Accepts numbers in place of longs', function () {
        decoded = 9876;
        encoded = client.encode('Test1', { int64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Decodes longs that were numbers originally', function () {
        check = client.decode('Test1', encoded);
        expect(check.int64).to.exist;
        expect(check.int64).to.be.an.instanceof(long);
        expect(check.int64).to.deep.equal(long.fromNumber(decoded));
    });

    it('Accepts strings in place of longs', function () {
        decoded = '-1234';
        encoded = client.encode('Test1', { sint64: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Decodes longs that were strings originally', function () {
        check = client.decode('Test1', encoded);
        expect(check.sint64).to.exist;
        expect(check.sint64).to.be.an.instanceof(long);
        expect(check.sint64).to.deep.equal(long.fromString(decoded));
    });
});
