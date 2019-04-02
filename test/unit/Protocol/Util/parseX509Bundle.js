'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const parseX509Bundle = require('../../../../lib/Protocol/Util/parseX509Bundle');

describe('parseX509Bundle', () => {
    it('returns an array of certificates from a bundle', () => {
        const bundle = [
            '-----BEGIN CERTIFICATE-----',
            'bar',
            '-----END CERTIFICATE-----',
            '-----BEGIN CERTIFICATE-----',
            'baz',
            '-----END CERTIFICATE-----'
        ].join('\n');

        expect(parseX509Bundle(bundle)).to.deep.equal([
            '-----BEGIN CERTIFICATE-----\nbar\n-----END CERTIFICATE-----',
            '-----BEGIN CERTIFICATE-----\nbaz\n-----END CERTIFICATE-----'
        ]);
    });

    it('throws an error if the bundle is not valid', () => {
        [[], {}, 0].forEach(invalid => {
            expect(() => parseX509Bundle(invalid)).to.throw('invalid bundle format');
        });
    });
});
