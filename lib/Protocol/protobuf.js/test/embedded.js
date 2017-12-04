/* global describe, it */
var Protobuf = require('../index');
var Schema = require('./schema');
var Chai = require('chai');
Chai.Assertion.includeStack = true;
var expect = Chai.expect;
var client = new Protobuf(Schema);
var encoded, decoded, check;

describe('Embedded tests', function () {
    it('Can encode embedded messages', function () {
        decoded = { int32: 12345 };
        encoded = client.encode('Test3', { test: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode embedded messages', function () {
        check = client.decode('Test3', encoded);
        expect(check.test).to.exist;
        expect(check.test).to.deep.equal(decoded);
    });

    it('Can encode repeated embedded messages', function () {
        decoded = [{ int32: 12345 }, { uint32: 67890 }];
        encoded = client.encode('Test3', { tests: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode repeated embedded messages', function () {
        check = client.decode('Test3', encoded);
        expect(check.tests).to.exist;
        expect(check.tests).to.deep.equal(decoded);
    });
});
