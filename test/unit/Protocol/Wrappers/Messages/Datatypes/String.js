'use strict';

/* eslint-env node, mocha */

const StringStub = require('../../../../../../lib/Protocol/Stubs/mysqlx_datatypes_pb').Scalar.String;
const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let str = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/String');

describe('Mysqlx.Datatypes.Scalar.String wrapper', () => {
    let bytes, collations;

    beforeEach('create fakes', () => {
        bytes = td.replace('../../../../../../lib/Protocol/Wrappers/ScalarValues/bytes');
        collations = td.replace('../../../../../../lib/Protocol/Collations');
        str = require('../../../../../../lib/Protocol/Wrappers/Messages/Datatypes/String');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('getCharset()', () => {
        it('returns the charset of the underlying string', () => {
            const proto = new StringStub();
            proto.setCollation(1);

            td.when(collations.find(1)).thenReturn({ charset: 'foo' });

            expect(str(proto).getCharset()).to.equal('foo');
        });

        it('returns undefined if the underlying string charset is unknown', () => {
            const proto = new StringStub();
            proto.setCollation(1);

            td.when(collations.find(1)).thenReturn();

            return expect(str(proto).getCharset()).to.not.exist;
        });

        it('returns undefined if the underlying string does not reference the charset', () => {
            const proto = new StringStub();

            td.when(collations.find()).thenReturn();

            return expect(str(proto).getCharset()).to.not.exist;
        });
    });

    context('getCollationId()', () => {
        it('returns the specified collation id', () => {
            const proto = new StringStub();
            proto.setCollation(1);

            return expect(str(proto).getCollationId()).to.equal(1);
        });

        it('returns undefined if the collation id is not valid', () => {
            return expect(str(new StringStub()).getCollationId()).to.not.exist;
        });
    });

    context('toJSON()', () => {
        it('returns a textual representation of a Mysqlx.Datatypes.Scalar.Octets stub instance', () => {
            const toString = td.function();
            const proto = new StringStub();
            proto.setValue('foo');
            proto.setCollation(1);

            td.when(toString()).thenReturn('bar');
            td.when(bytes('foo')).thenReturn({ toString });

            expect(str(proto).toJSON()).to.deep.equal({ collation: 1, value: 'bar' });
        });
    });

    context('toString()', () => {
        context('when the charset is binary', () => {
            it('returns the output of the byte wrapper toString method in the right encoding', () => {
                const toString = td.function();
                const proto = new StringStub();
                proto.setValue('foo');
                proto.setCollation(1);

                td.when(collations.find(1)).thenReturn({ charset: 'binary' });
                td.when(toString('base64')).thenReturn('bar');
                td.when(bytes('foo')).thenReturn({ toString });

                expect(str(proto).toString()).to.equal('bar');
            });
        });

        context('when the charset is not binary', () => {
            it('returns the output of the byte wrapper toString method in the right encoding', () => {
                const toString = td.function();
                const proto = new StringStub();
                proto.setValue('foo');
                proto.setCollation(1);

                td.when(collations.find(1)).thenReturn({ charset: 'utf8mb4' });
                td.when(toString()).thenReturn('bar');
                td.when(bytes('foo')).thenReturn({ toString });

                expect(str(proto).toString()).to.equal('bar');
            });
        });

        context('when the charset is not available', () => {
            it('returns the output of the byte wrapper toString method in the right encoding', () => {
                const toString = td.function();
                const proto = new StringStub();
                proto.setValue('foo');

                td.when(toString()).thenReturn('bar');
                td.when(bytes('foo')).thenReturn({ toString });

                expect(str(proto).toString()).to.equal('bar');
            });
        });
    });
});
