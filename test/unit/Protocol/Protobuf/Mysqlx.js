'use strict';

/* eslint-env node, mocha */

// npm `test` script was updated to use NODE_PATH=.
const Mysqlx = require('lib/Protocol/Protobuf/Adapters/Mysqlx');
const Ok = require('lib/Protocol/Protobuf/Stubs/mysqlx_pb').Ok;
const expect = require('chai').expect;

describe('Protobuf', () => {
    context('Mysqlx', () => {
        context('decodeOk()', () => {
            it('should return an object containing an existing message', () => {
                const ok = new Ok();
                ok.setMsg('foo');

                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer(ok.serializeBinary());
                /* eslint-enable node/no-deprecated-api */

                expect(Mysqlx.decodeOk(data)).to.deep.equal({ message: 'foo' });
            });

            it('should return an empty object if there is no message', () => {
                const ok = new Ok();

                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer(ok.serializeBinary());
                /* eslint-enable node/no-deprecated-api */

                expect(Mysqlx.decodeOk(data)).to.deep.equal({});
            });
        });
    });
});
