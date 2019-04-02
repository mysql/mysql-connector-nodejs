'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const getServerCipherSuite = require('../../../../lib/Protocol/Util/getServerCipherSuite');

describe('getServerCipherSuite', () => {
    it('returns a list in OpenSSL cipher list format', () => {
        const suite = getServerCipherSuite();
        const entries = suite.split(':');

        expect(entries).to.have.length.above(2);
        expect(entries.filter(entry => entry[0] !== '!')).to.have.length.above(0);
        expect(entries.filter(entry => entry[0] === '!')).to.have.length.above(0);
    });

    it('includes the mandatory ciphers', () => {
        const suite = getServerCipherSuite();
        const mandatory = [
            'ECDHE-ECDSA-AES128-GCM-SHA256',
            'ECDHE-ECDSA-AES256-GCM-SHA384',
            'ECDHE-RSA-AES128-GCM-SHA256',
            'ECDHE-ECDSA-AES128-SHA256',
            'ECDHE-RSA-AES128-SHA256',
            'AES128-GCM-SHA256',
            'AES256-GCM-SHA384'
        ];

        mandatory.forEach(entry => expect(suite).to.have.string(entry));
    });

    it('excludes the unacceptable ciphers', () => {
        const suite = getServerCipherSuite();
        const unacceptable = [
            'aNULL',
            'eNULL',
            'EXPORT',
            'LOW',
            'MD5',
            'DES',
            'RC2',
            'RC4',
            'PSK'
            // 'SSLv3'
        ].map(cipher => `!${cipher}`);

        unacceptable.forEach(entry => expect(suite).to.have.string(entry));
    });

    it('includes additional approved ciphers', () => {
        const suite = getServerCipherSuite();
        const mandatory = [
            'ECDHE-ECDSA-AES128-GCM-SHA256',
            'ECDHE-ECDSA-AES256-GCM-SHA384',
            'ECDHE-RSA-AES128-GCM-SHA256',
            'ECDHE-ECDSA-AES128-SHA256',
            'ECDHE-RSA-AES128-SHA256',
            'AES128-GCM-SHA256',
            'AES256-GCM-SHA384'
        ];
        const unacceptable = [
            'aNULL',
            'eNULL',
            'EXPORT',
            'LOW',
            'MD5',
            'DES',
            'RC2',
            'RC4',
            'PSK'
            // 'SSLv3'
        ].map(cipher => `!${cipher}`);

        expect(suite).to.have.length.above(mandatory.length + unacceptable.length);
    });
});
