/*
 * Copyright (c) 2019, 2021, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is also distributed with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms,
 * as designated in a particular file or component or in included license
 * documentation.  The authors of MySQL hereby grant you an
 * additional permission to link the program and your derivative works
 * with the separately licensed software that they have included with
 * MySQL.
 *
 * Without limiting anything contained in the foregoing, this file,
 * which is part of MySQL Connector/Node.js, is also subject to the
 * Universal FOSS Exception, version 1.0, a copy of which can be found at
 * http://oss.oracle.com/licenses/universal-foss-exception.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License, version 2.0, for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA
 */

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
