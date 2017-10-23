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
    // TODO(Rui): tests should be fixed when the fragmentation logic is refactored.
    context.skip('fragmentation', () => {
        it('should handle fragmented after the header', () => {
            const protocol = new Client(nullStream);
            const promise = protocol.crudModify('schema', 'collection', Client.dataModel.DOCUMENT, '', []);
            const complete = Encoding.encodeMessage(Messages.ServerMessages.ERROR, {
                code: 1,
                sql_state: '0000',
                msg: 'Unknown error'
            }, Encoding.serverMessages);

            protocol.handleNetworkFragment(complete.slice(0, 14));
            protocol.handleNetworkFragment(complete.slice(14));

            return expect(promise).to.eventually.be.rejected;
        });

        it('should handle fragmented within the header', () => {
            const protocol = new Client(nullStream);
            const promise = protocol.crudModify('schema', 'collection', Client.dataModel.DOCUMENT, '', []);
            const complete = Encoding.encodeMessage(Messages.ServerMessages.ERROR, {
                code: 1,
                sql_state: '0000',
                msg: 'Unknown error'
            }, Encoding.serverMessages);

            protocol.handleNetworkFragment(complete.slice(0, 1));
            protocol.handleNetworkFragment(complete.slice(1));

            return expect(promise).to.eventually.be.rejected;
        });

        it('should handle complete package after fragmented package', () => {
            const protocol = new Client(nullStream);
            const promise = Promise.all([
                protocol.crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, { rows: [[{ _id: 123 }]] }),
                protocol.crudInsert('schema', 'collection', Client.dataModel.DOCUMENT, { rows: [[{ _id: 456 }]] })
            ]);

            const complete = Encoding.encodeMessage(Messages.ServerMessages.SQL_STMT_EXECUTE_OK, {}, Encoding.serverMessages);

            protocol.handleNetworkFragment(complete.slice(0, 1));
            protocol.handleNetworkFragment(Buffer.concat([complete.slice(1), complete]));

            return expect(promise).to.eventually.deep.equal([{}, {}]);
        });
    });
});
