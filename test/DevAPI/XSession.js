var expect = require('chai').expect;
var Session = require('../../lib/DevAPI/BaseSession');
var Schema = require('../../lib/DevAPI/Schema');

describe('XSession', function () {
    it('should have a getSchema method', function () {
        var session = new Session({});
        expect(session.getSchema).to.exist.and.be.a('function');
    });
    it('should have a getSchema method returning a Schema', function () {
        var session = new Session({});
        expect(session.getSchema()).to.exist.and.be.instanceof(Schema);
    });
});
