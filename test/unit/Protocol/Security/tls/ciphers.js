'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const ciphers = require('../../../../../lib/Protocol/Security/tls/ciphers');
const cipherRef = require('../../../../../lib/Protocol/Security/tls/OSSA_CRB_TLSCiphersuites.json');

describe('Ciphers', () => {
    context('overlaps()', () => {
        it('returns the list of overlapping mandatory and approved OpenSSL cipher names for a given list of IANA cipher names', () => {
            const input = [
                'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', // mandatory
                'TLS_AES_128_CCM_SHA256' // approved
            ];

            const expected = [
                'ECDHE-ECDSA-AES256-GCM-SHA384',
                'TLS_AES_128_CCM_SHA256'
            ];

            expect(ciphers.overlaps(input)).to.deep.equal(expected);
        });

        it('returns deprecated OpenSSL cipher names that are requested in the provided ciphersuite', () => {
            const input = [
                'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', // mandatory
                'TLS_AES_128_CCM_SHA256', // approved
                'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA' // deprecated
            ];

            const expected = [
                'ECDHE-ECDSA-AES256-GCM-SHA384',
                'TLS_AES_128_CCM_SHA256',
                'ECDHE-ECDSA-AES256-SHA'
            ];

            expect(ciphers.overlaps(input)).to.deep.equal(expected);
        });

        it('excludes any provided unacceptable cipher', () => {
            const input = [
                'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384', // mandatory
                'TLS_AES_128_CCM_SHA256', // approved
                'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA', // deprecated
                'TLS_ECDHE_ECDSA_WITH_NULL_SHA' // unnaceptable
            ];

            const expected = [
                'ECDHE-ECDSA-AES256-GCM-SHA384',
                'TLS_AES_128_CCM_SHA256',
                'ECDHE-ECDSA-AES256-SHA'
            ];

            expect(ciphers.overlaps(input)).to.deep.equal(expected);
        });
    });

    context('defaults()', () => {
        it('returns the list containing the mandatory, approved and deprecated compatibility OpenSSL cipher names', () => {
            const totalSize = cipherRef.mandatory_tls_ciphersuites.length +
                cipherRef.approved_tls_ciphersuites.length + 3; // number of deprecated ciphersuites to include

            expect(ciphers.defaults()).to.have.lengthOf(totalSize);
            expect(ciphers.defaults()).to.include.members(['DHE-RSA-AES256-SHA', 'DHE-RSA-AES128-SHA', 'AES256-SHA']);
        });
    });
});
