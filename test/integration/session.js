'use strict';

/* eslint-env node, mocha */

const mysqlx = require('index');
const config = require('./properties');

describe('@integration server connection', () => {
    context('single server running the X plugin', () => {
        it('should connect to the server in a new session', () => {
            return mysqlx.getNodeSession(config).should.be.fulfilled;
        });

        it('should not connect if the credentials are invalid', () => {
            const invalidConfig = Object.assign({}, config, {
                dbUser: 'invalid user',
                dbPassword: 'invalid password'
            });

            return mysqlx.getNodeSession(invalidConfig).should.be.rejected;
        });
    });

    context('server cluster abstraction', () => {
        it('should connect to the server in a new session', () => {
            return mysqlx.getSession(config).should.be.fulfilled;
        });

        it('should not connect if the credentials are invalid', () => {
            const invalidConfig = Object.assign({}, config, {
                dbUser: 'invalid user',
                dbPassword: 'invalid password'
            });

            return mysqlx.getSession(invalidConfig).should.be.rejected;
        });
    });
});

