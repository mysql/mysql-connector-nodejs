'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const path = require('path');

describe('connecting to the MySQL server in the right port', () => {
    it('logs the X Protocol greeting message', () => {
        const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

        return fixtures.collectLogs('protocol:inbound:Mysqlx.Notice.Frame', script)
            .then(proc => {
                // there are other notices sent by the server, namely a LOCAL CLIENT_ID_ASSIGNED
                expect(proc.logs).to.have.length.above(0);
                // but, we are looking for the first one
                expect(proc.logs[0]).to.contain.keys(['type', 'scope']);
                expect(proc.logs[0].type).to.equal('SERVER_HELLO');
                expect(proc.logs[0].scope).to.equal('GLOBAL');
            });
    });
});
