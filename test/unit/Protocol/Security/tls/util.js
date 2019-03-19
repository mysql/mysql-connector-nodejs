'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const util = require('../../../../../lib/Protocol/Security/tls/util');

describe('TLS general utilities', () => {
    context('parseX509Bundle()', () => {
        it('returns an array of certificates from a bundle', () => {
            const bundle = [
                '-----BEGIN CERTIFICATE-----',
                'bar',
                '-----END CERTIFICATE-----',
                '-----BEGIN CERTIFICATE-----',
                'baz',
                '-----END CERTIFICATE-----'
            ].join('\n');

            expect(util.parseX509Bundle(bundle)).to.deep.equal([
                '-----BEGIN CERTIFICATE-----\nbar\n-----END CERTIFICATE-----',
                '-----BEGIN CERTIFICATE-----\nbaz\n-----END CERTIFICATE-----'
            ]);
        });

        it('throws an error if the bundle is not valid', () => {
            const error = 'The certificate file content is not in a valid X509 format.';

            expect(() => util.parseX509Bundle([])).to.throw(error);
            expect(() => util.parseX509Bundle({})).to.throw(error);
            expect(() => util.parseX509Bundle(0)).to.throw(error);
        });
    });
});
