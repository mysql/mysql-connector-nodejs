'use strict';

/* eslint-env node, mocha */

const ContentType = require('../../../../../../lib/Protocol/Stubs/mysqlx_resultset_pb').ContentType_BYTES;
const OctetsStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar.Octets;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let octets = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Octets');

describe('Mysqlx.Datatypes.Scalar.Octets wrapper', () => {
    let bytes;

    beforeEach('create fakes', () => {
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        octets = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/Octets');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getContentType()', () => {
        it('returns the name of the data Content-Type', () => {
            const proto = new OctetsStub();
            proto.setValue('foo');
            proto.setContentType(ContentType.JSON);

            expect(octets(proto).getContentType()).to.equal('JSON');
        });

        it('returns undefined if the Content-Type is not available', () => {
            return expect(octets(new OctetsStub()).getContentType()).to.not.exist;
        });
    });

    context('toBuffer()', () => {
        it('returns the output of the bytes wrapper toBuffer() method', () => {
            const toBuffer = td.function();
            const proto = new OctetsStub();
            proto.setValue('foo');

            td.when(toBuffer()).thenReturn('bar');
            td.when(bytes('foo')).thenReturn({ toBuffer });

            expect(octets(proto).toBuffer()).to.equal('bar');
        });
    });

    context('toJSON()', () => {
        let getContentType;

        context('when the Content-Type is available', () => {
            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.Octets stub instance', () => {
                const toJSON = td.function();
                const proto = new OctetsStub();
                proto.setValue('foo');

                const wrapper = octets(proto);
                getContentType = td.replace(wrapper, 'getContentType');

                td.when(getContentType()).thenReturn('bar');
                td.when(toJSON()).thenReturn('baz');
                td.when(bytes('foo')).thenReturn({ toJSON });

                expect(wrapper.toJSON()).to.deep.equal({ content_type: 'bar', value: 'baz' });
            });
        });

        context('when the Content-Type is not available', () => {
            it('returns a textual representation of a Mysqlx.Datatypes.Scalar.Octets stub instance', () => {
                const toJSON = td.function();
                const proto = new OctetsStub();
                proto.setValue('foo');

                const wrapper = octets(proto);
                getContentType = td.replace(wrapper, 'getContentType');

                td.when(getContentType()).thenReturn();
                td.when(toJSON()).thenReturn('bar');
                td.when(bytes(), { ignoreExtraArgs: true }).thenReturn({ toJSON });

                expect(wrapper.toJSON()).to.deep.equal({ content_type: undefined, value: 'bar' });
            });
        });
    });
});
