"use strict";

var chai = require('chai'),
    should = chai.should(),
    spies = require('chai-spies');
var expect = require('chai').expect;
var mysqlx = require('../../'),
    Session = require('../../lib/DevAPI/BaseSession'),
    Schema = require('../../lib/DevAPI/Schema'),
    Client = require('../../lib/Protocol/Client'),
    NullAuth = require('../../lib/Authentication/NullAuth');

describe('XSession', function () {
    it('should have a getSchema method', function () {
        var session = new Session({});
        expect(session.getSchema).to.exist.and.be.a('function');
    });
    it('should have a getSchema method returning a Schema', function () {
        var session = new Session({});
        expect(session.getSchema()).to.exist.and.be.instanceof(Schema);
    });
    describe('Tests using executing SQL', function() {
        var session, spy, origExecSql;

        var nullStream = {
            on: function () {},
            write: function () {}
        };

        var NullStreamFactory = {
            createSocket: function () {
                return new Promise(function (resolve) {
                    resolve(nullStream);
                });
            }
        };

        beforeEach('get Session', function (done) {
            return mysqlx.getSession({
                authMethod: "NULL",
                socketFactory: NullStreamFactory
            }).then(function (s) {
                session = s;
                done();
            }).catch(function (err) {
                done(err);
            });
        });

        beforeEach('create spy', function () {
            spy = chai.spy(Client.prototype.sqlStmtExecute);
            origExecSql = Client.prototype.sqlStmtExecute;
            Client.prototype.sqlStmtExecute = spy;
        });

        afterEach('reset spy', function () {
            if (origExecSql) {
                Client.prototype.sqlStmtExecute = origExecSql;
            }
        });

        it('should query the server for schemas', function () {
            session.getSchemas().should.be.an.instanceof(Promise);
            spy.should.be.called.once;
        });
        it('should tell server to create a schema', function () {
            session.createSchema("foo").should.be.an.instanceof(Promise);
            spy.should.be.called.once;
        });
        it('should tell server to drop a schema', function () {
            session.dropSchema("foo").should.be.an.instanceof(Promise);
            spy.should.be.called.once;
        });
    })
});
