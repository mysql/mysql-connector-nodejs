'use strict';

/* eslint-env node, mocha */
/* global nullStream */

const Client = require('lib/Protocol/Client');
const Encoding = require('lib/Protocol/Encoding');
const Messages = require('lib/Protocol/Messages');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Client', () => {
    context('close', () => {
        it('should throw if row callback is no function', () => {
            const protocol = new Client(nullStream);
            const promise = protocol.close();

            protocol.handleNetworkFragment(Encoding.encodeMessage(Messages.ServerMessages.OK, {}, Encoding.serverMessages));

            return expect(promise).to.be.fulfilled;
        });
    });
});
