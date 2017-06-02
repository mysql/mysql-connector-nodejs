'use strict';

/* eslint-env node, mocha */

const config = require('test/properties');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const mysqlx = require('index');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('@functional authentication', () => {
    context('PLAIN authentication strategy', () => {
        it('should connect to the server with a user identified by a mysql native password', () => {
            // MySQL Native pluggable authentication enabled server is listening on the default port.
            const sha256Config = Object.assign({}, config, { authMethod: 'PLAIN', ssl: true });

            return expect(mysqlx.getSession(sha256Config)).to.eventually.be.fulfilled;
        });

        it('should connect to the server with a user identified by a SHA256 password', () => {
            // SHA256 enabled server is listening on port 33062.
            const sha256Config = Object.assign({}, config, { authMethod: 'PLAIN', port: 33062, ssl: true });

            return expect(mysqlx.getSession(sha256Config)).to.eventually.be.fulfilled;
        });
    });
});
