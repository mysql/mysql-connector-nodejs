'use strict';

/* eslint-env node, mocha */

const Mysqlx = require('../../../../lib/Protocol/Protobuf/Adapters/Mysqlx');
const Ok = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_pb').Ok;
const expect = require('chai').expect;

describe('Protobuf', () => {
    context('Mysqlx', () => {
        context('decodeOk()', () => {
            it('returns an object containing an existing message', () => {
                const ok = new Ok();
                ok.setMsg('foo');

                // eslint-disable-next-line node/no-deprecated-api
                const data = new Buffer(ok.serializeBinary());
                expect(Mysqlx.decodeOk(data)).to.deep.equal({ message: 'foo' });
            });

            it('returns an empty object if there is no message', () => {
                const ok = new Ok();

                // eslint-disable-next-line node/no-deprecated-api
                const data = new Buffer(ok.serializeBinary());
                expect(Mysqlx.decodeOk(data)).to.deep.equal({});
            });
        });
    });
});
