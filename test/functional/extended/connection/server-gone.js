'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');

describe('handling disconnections originated by the server', () => {
    const baseConfig = { schema: undefined, socket: undefined };

    const waitForEndpointToBecomeAvailable = 30000; // (ms)
    const waitForEndpointToBecomeUnvailable = 10000; // (ms)

    afterEach('reset services', function () {
        const serverGoneConfig = Object.assign({}, config, baseConfig);

        this.timeout(this.timeout() + waitForEndpointToBecomeAvailable);

        return fixtures.enableEndpoint(serverGoneConfig.host);
    });

    it('triggers a proper error message', function () {
        const serverGoneConfig = Object.assign({}, config, baseConfig);

        this.timeout(this.timeout() + waitForEndpointToBecomeAvailable);

        return mysqlx.getSession(serverGoneConfig)
            .then(session => {
                return Promise.all([
                    session.sql(`SELECT SLEEP(${waitForEndpointToBecomeUnvailable * 2})`).execute(),
                    fixtures.disableEndpoint(serverGoneConfig.host, waitForEndpointToBecomeUnvailable)
                ]);
            })
            .then(() => expect.fail())
            .catch(err => {
                expect(err.message).to.equal('The server has gone away');
            });
    });
});
