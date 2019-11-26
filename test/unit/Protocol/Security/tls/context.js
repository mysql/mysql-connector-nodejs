'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');
const tls = require('tls');

describe('TLS context builder', () => {
    let ciphers, fs, subject, util;

    beforeEach('create fakes', () => {
        ciphers = td.replace('../../../../../lib/Protocol/Security/tls/ciphers');
        fs = td.replace('../../../../../lib/Adapters/fs');
        util = td.replace('../../../../../lib/Protocol/Security/tls/util');

        subject = require('../../../../../lib/Protocol/Security/tls/context');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('addCertificateAuthority()', () => {
        it('returns an  security context if the CA PEM file path is not defined', () => {
            return subject.addCertificateAuthority()
                .then(context => expect(context).to.be.an.instanceOf(Object).and.to.be.empty);
        });

        it('returns a valid partial security context if the CA PEM file contains a valid X509 certificate chain', () => {
            const filePath = 'foo';
            const pem = 'bar';
            const chain = 'baz';

            td.when(fs.readFile(filePath, 'ascii')).thenResolve(pem);
            td.when(util.parseX509Bundle(pem)).thenReturn(chain);

            return subject.addCertificateAuthority(filePath)
                .then(context => expect(context).to.deep.equal({ ca: chain, rejectUnauthorized: true }));
        });

        it('fails if the CA PEM file path is neither a String nor undefined', () => {
            const error = 'The certificate authority (CA) file path is not valid.';

            return subject.addCertificateAuthority(null)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });

        it('fails if the CA PEM file path is empty', () => {
            const error = 'The certificate authority (CA) file path is not valid.';

            return subject.addCertificateAuthority('')
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });

        it('fails if the CA PEM file is not available', () => {
            const filePath = 'foo';
            const error = new Error('bar');

            td.when(fs.readFile(filePath, 'ascii')).thenThrow(error);

            return subject.addCertificateAuthority(filePath)
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails if the CA PEM file does not contain a valid X509 certificate chain', () => {
            const filePath = 'foo';
            const pem = 'bar';
            const error = new Error('baz');

            td.when(fs.readFile(filePath, 'ascii')).thenResolve(pem);
            td.when(util.parseX509Bundle(pem)).thenThrow(error);

            return subject.addCertificateAuthority(filePath)
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });
    });

    context('addCertificateRevocationList()', () => {
        it('returns an empty context if the CRL PEM file path is not defined', () => {
            return subject.addCertificateRevocationList()
                .then(context => expect(context).to.be.an.instanceOf(Object).and.to.be.empty);
        });

        it('returns an empty context if the CA PEM file path is not defined', () => {
            const crlFilePath = 'foo';

            return subject.addCertificateRevocationList(crlFilePath)
                .then(context => expect(context).to.be.an.instanceOf(Object).and.to.be.empty);
        });

        it('returns a valid context if the CRL PEM file contains a valid X509 certificate chain and a CA file is referenced', () => {
            const crlFilePath = 'foo';
            const caFilePath = 'bar';
            const pem = 'baz';

            td.when(fs.readFile(crlFilePath, 'ascii')).thenResolve(pem);

            return subject.addCertificateRevocationList(crlFilePath, caFilePath)
                .then(context => expect(context).to.deep.equal({ crl: pem }));
        });

        it('fails if the CRL PEM file path is neither a String nor undefined', () => {
            const caFilePath = 'foo';
            const error = 'The certificate revocation list (CRL) file path is not valid.';

            return subject.addCertificateRevocationList(null, caFilePath)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });

        it('fails if the CA PEM file path is empty', () => {
            const error = 'The certificate authority (CA) file path is not valid.';
            const caFilePath = 'foo';

            return subject.addCertificateAuthority('', caFilePath)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });
    });

    context('addSecureProtocol', () => {
        it('returns a partial security context with the specific TLS protocol version to use on older Node.js versions', function () {
            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const inputs = [
                ['TLSv1'],
                ['TLSv1.1'],
                ['TLSv1.2'],
                ['TLSv1', 'TLSv1.1'],
                ['TLSv1.1', 'TLSv1'],
                ['TLSv1.1', 'TLSv1.2'],
                ['TLSv1.2', 'TLSv1.1'],
                ['TLSv1', 'TLSv1.2'],
                ['TLSv1.2', 'TLSv1'],
                ['TLSv1', 'TLSv1.1', 'TLSv1.2'],
                ['TLSv1.2', 'TLSv1', 'TLSv1.1']
            ];

            const expected = [{
                secureProtocol: 'TLSv1_client_method'
            }, {
                secureProtocol: 'TLSv1_1_client_method'
            }, {
                secureProtocol: 'TLSv1_2_client_method'
            }, {
                secureProtocol: 'TLSv1_1_client_method'
            }, {
                secureProtocol: 'TLSv1_1_client_method'
            }, {
                secureProtocol: 'TLSv1_2_client_method'
            }, {
                secureProtocol: 'TLSv1_2_client_method'
            }, {
                secureProtocol: 'TLSv1_2_client_method'
            }, {
                secureProtocol: 'TLSv1_2_client_method'
            }, {
                secureProtocol: 'TLSv1_2_client_method'
            }, {
                secureProtocol: 'TLSv1_2_client_method'
            }];

            return Promise.all(inputs.map(input => subject.addSecureProtocol(input)))
                .then(actual => expect(actual).to.deep.equal(expected));
        });

        it('returns a partial security context with the TLS protocol version range to use on newer Node.js versions', function () {
            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION !== 'TLSv1.3') {
                return this.skip();
            }

            const inputs = [
                ['TLSv1.1'],
                ['TLSv1.2'],
                ['TLSv1.3'],
                ['TLSv1.1', 'TLSv1.2'],
                ['TLSv1.2', 'TLSv1.1'],
                ['TLSv1.1', 'TLSv1.3'],
                ['TLSv1.3', 'TLSv1.1'],
                ['TLSv1.2', 'TLSv1.3'],
                ['TLSv1.3', 'TLSv1.2'],
                ['TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
                ['TLSv1.2', 'TLSv1.3', 'TLSv1.1']
            ];

            const expected = [{
                minVersion: 'TLSv1.1',
                maxVersion: 'TLSv1.1'
            }, {
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.2'
            }, {
                minVersion: 'TLSv1.3',
                maxVersion: 'TLSv1.3'
            }, {
                minVersion: 'TLSv1.1',
                maxVersion: 'TLSv1.2'
            }, {
                minVersion: 'TLSv1.1',
                maxVersion: 'TLSv1.2'
            }, {
                minVersion: 'TLSv1.1',
                maxVersion: 'TLSv1.3'
            }, {
                minVersion: 'TLSv1.1',
                maxVersion: 'TLSv1.3'
            }, {
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3'
            }, {
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3'
            }, {
                minVersion: 'TLSv1.1',
                maxVersion: 'TLSv1.3'
            }, {
                minVersion: 'TLSv1.1',
                maxVersion: 'TLSv1.3'
            }];

            return Promise.all(inputs.map(input => subject.addSecureProtocol(input)))
                .then(actual => expect(actual).to.deep.equal(expected));
        });

        it('fails if the list of provided versions is neither an Array nor undefined', () => {
            const error = '"" is not a valid TLS protocol list format.';

            return subject.addSecureProtocol('')
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });

        it('fails if any TLS protocol version is not valid', () => {
            const error = '"foo" is not a valid TLS protocol version. Should be one of TLSv1, TLSv1.1, TLSv1.2, TLSv1.3.';

            return subject.addSecureProtocol(['foo', 'TLSv1'])
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });

        it('fails with older Node.js versions if the provided protocol list contains only TLSv1.3', function () {
            // runs on Node.js <= 12.0.0
            if (tls.DEFAULT_MAX_VERSION === 'TLSv1.3') {
                return this.skip();
            }

            const error = 'No supported TLS protocol version found in the provided list.';

            return subject.addSecureProtocol(['TLSv1.3'])
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });

        it('fails if the provided protocol list is empty', () => {
            const error = 'No supported TLS protocol version found in the provided list.';

            return subject.addSecureProtocol([])
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(error));
        });
    });

    context('addCiphers()', () => {
        it('returns a valid context with the default OpenSSL ciphersuite list string if no ciphersuite has been provided', () => {
            const ciphersuites = ['foo', 'bar'];

            td.when(ciphers.defaults()).thenReturn(ciphersuites);

            return subject.addCiphers()
                .then(openssl => expect(openssl).to.deep.equal({ ciphers: ciphersuites.join(':') }));
        });

        it('returns a valid context with an OpenSSL ciphersuite list string matching the valid ciphers that have been provided', () => {
            const ciphersuites = ['foo', 'bar', 'baz'];
            const overlapping = ciphersuites.slice(0, 2);

            td.when(ciphers.overlaps(ciphersuites)).thenReturn(overlapping);

            return subject.addCiphers(ciphersuites)
                .then(openssl => expect(openssl).to.deep.equal({ ciphers: overlapping.join(':') }));
        });

        it('fails if the provided ciphersuite list is empty', () => {
            return subject.addCiphers([])
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('No valid ciphersuite found in the provided list.'));
        });

        it('fails if there no ciphersuite in the list overlaps with any mandatory, approved or deprecated ciphers', () => {
            const ciphersuites = ['foo', 'bar'];

            td.when(ciphers.overlaps(ciphersuites)).thenReturn([]);

            return subject.addCiphers(ciphersuites)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('No valid ciphersuite found in the provided list.'));
        });
    });
});
