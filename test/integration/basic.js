"use strict";

/*global
 describe, context, beforeEach, afterEach, it, chai
 */
chai.should();
const expect = require('chai').expect,
    mysqlx = require('../../'),
    properties = require('./properties');

describe('Basic Test with server', function () {

    it('should connect to server', function (done) {
        const session = mysqlx.getNodeSession(properties);
        expect(session).to.notify(done);
        // return session.should.be.fullfilled; !? Mocha ignored the promise ... strange
    });
    it('should reject a wrong password', function () {
        const wrongProperties = {
            dbUser: 'a user by this name should not exist, I hope',
            dbPassword: 'and if the user exists this password is wrong, I assume',
            host: properties.host,
            port: properties.port
        };
        return mysqlx.getNodeSession(wrongProperties).should.be.rejected;
    });
    it('should execute a simple query', function (done) {
        const rowcb = chai.spy();
        const promise = mysqlx.getNodeSession(properties).then(session => {
            return session.executeSql("SELECT 1").execute(rowcb).then(() => {
                rowcb.should.be.called.once;
            });
        });
        expect(promise).to.notify(done);
    });

});

