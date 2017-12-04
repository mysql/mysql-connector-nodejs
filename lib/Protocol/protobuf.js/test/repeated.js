/* global describe, it */
var Protobuf = require('../index');
var Schema = require('./schema');
var Chai = require('chai');
Chai.Assertion.includeStack = true;
var expect = Chai.expect;
var client = new Protobuf(Schema);
var encoded, decoded, check;

describe('Repeated tests', function () {
    it('Can encode repeated integers', function () {
        decoded = [1, 2, 3, 4];
        encoded = client.encode('Test2', { ints: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode repeated integers', function () {
        check = client.decode('Test2', encoded);
        expect(check.ints).to.exist;
        expect(check.ints).to.deep.equal(decoded);
    });

    it('Can encode repeated strings', function () {
        decoded = ['one', 'two', 'three', 'four'];
        encoded = client.encode('Test2', { strings: decoded });
        expect(encoded).to.be.an.instanceof(Buffer);
    });

    it('Can decode repeated strings', function () {
        check = client.decode('Test2', encoded);
        expect(check.strings).to.exist;
        expect(check.strings).to.deep.equal(decoded);
    });
});
