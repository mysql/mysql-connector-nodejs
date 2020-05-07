'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../..');

describe('SSL/TLS support', () => {
    context('when the is it not enabled in the server', () => {
        // container as defined in docker-compose.yml
        const baseConfig = { host: 'mysql-with-ssl-disabled', schema: undefined, socket: undefined };

        it('fails to connect if the client requires it', () => {
            const secureConfig = Object.assign({}, config, baseConfig, { ssl: true });
            const error = 'The X Plugin version installed in the server does not support TLS. Check https://dev.mysql.com/doc/refman/8.0/en/x-plugin-ssl-connections.html for more details on how to enable secure connections.';

            return mysqlx.getSession(secureConfig)
                .then(() => expect.fail())
                .catch(err => {
                    expect(err.message).to.equal(error);
                });
        });
    });
});
