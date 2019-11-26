'use strict';

/* eslint-env node, mocha */

const expect = require('chai').expect;
const td = require('testdouble');
const PassThrough = require('stream').PassThrough;

describe('TLS utilities', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('createCustomSecurityContext()', () => {
        let subject, context;

        beforeEach('create fakes', () => {
            context = td.replace('../../../../../lib/Protocol/Security/tls/context');

            subject = require('../../../../../lib/Protocol/Security/tls');
        });

        it('fails if there is an error while adding the certificate authority partial', () => {
            const error = new Error('foobar');
            const config = { ca: 'foo' };

            td.when(context.addCertificateAuthority(config.ca)).thenReject(error);

            return subject.createCustomSecurityContext(config)
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails if there is an error while adding the certificate revocation list partial', () => {
            const error = new Error('foobar');
            const config = { ca: 'foo', crl: 'bar' };

            td.when(context.addCertificateAuthority(config.ca)).thenResolve();
            td.when(context.addCertificateRevocationList(config.crl, config.ca)).thenReject(error);

            return subject.createCustomSecurityContext(config)
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails if there is an error while adding the secure protocol version partial', () => {
            const error = new Error('foobar');
            const config = { ca: 'foo', crl: 'bar', versions: ['baz'] };

            td.when(context.addCertificateAuthority(config.ca)).thenResolve();
            td.when(context.addCertificateRevocationList(config.crl, config.ca)).thenResolve();
            td.when(context.addSecureProtocol(config.versions)).thenReject(error);

            return subject.createCustomSecurityContext(config)
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('fails if there is an error while adding the ciphers partial', () => {
            const error = new Error('foobar');
            const config = { ca: 'foo', crl: 'bar', versions: ['baz'], ciphersuites: ['qux'] };

            td.when(context.addCertificateAuthority(config.ca)).thenResolve();
            td.when(context.addCertificateRevocationList(config.crl, config.ca)).thenResolve();
            td.when(context.addSecureProtocol(config.versions)).thenResolve();
            td.when(context.addCiphers(config.ciphersuites)).thenReject(error);

            return subject.createCustomSecurityContext(config)
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('returns an object containing the final security context extended by each step', () => {
            const config = { ca: 'foo', ciphersuites: ['bar', 'baz'], crl: 'qux', rejectUnauthorized: false, versions: ['quux'] };
            const expected = { ca: 'FOO', ciphers: ['BAR', 'BAZ'], crl: 'QUX', rejectUnauthorized: true, secureProtocol: 'QUUX' };

            td.when(context.addCertificateAuthority(config.ca)).thenResolve({ ca: 'FOO', rejectUnauthorized: true });
            td.when(context.addCertificateRevocationList(config.crl, config.ca)).thenResolve({ crl: 'QUX' });
            td.when(context.addSecureProtocol(config.versions)).thenResolve({ secureProtocol: 'QUUX' });
            td.when(context.addCiphers(config.ciphersuites)).thenResolve({ ciphers: ['BAR', 'BAZ'] });

            return subject.createCustomSecurityContext(config)
                .then(ctx => expect(ctx).to.deep.equal(expected));
        });
    });

    context('createSecureChannel', () => {
        let subject, tls;

        beforeEach('create fakes', () => {
            tls = td.replace('tls');
            subject = require('../../../../../lib/Protocol/Security/tls');
        });

        it('fails if there is an error while creating the TLS socket', () => {
            const context = { foo: 'bar' };
            const socket = new PassThrough();
            const error = new Error('foobar');

            td.when(tls.connect(context)).thenReturn(socket);

            setTimeout(() => socket.emit('error', error), 0);

            return subject.createSecureChannel(context)
                .then(() => expect.fail())
                .catch(err => expect(err).to.deep.equal(error));
        });

        it('returns the socket instance as soon as it is connected', () => {
            const context = { foo: 'bar' };
            const socket = new PassThrough();

            td.when(tls.connect(context)).thenReturn(socket);

            setTimeout(() => socket.emit('secureConnect'), 0);

            return subject.createSecureChannel(context)
                .then(secureSocket => expect(secureSocket).to.deep.equal(socket));
        });
    });
});
