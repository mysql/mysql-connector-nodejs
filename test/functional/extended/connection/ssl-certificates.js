/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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

const config = require('../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../..');
const path = require('path');

describe('SSL certificate negotiation', () => {
    // container name as defined in docker-compose.yml
    const baseConfig = { host: 'mysql-with-key-and-cert', schema: undefined, socket: undefined };
    // Provide fake servername to avoid CN mismatch.
    const servername = 'MySQL_Server_nodejsmysqlxtest_Auto_Generated_Server_Certificate';
    // Fixtures base path
    const fixtures = path.join(__dirname, '..', '..', '..', 'fixtures', 'ssl', 'client');

    // TODO(Rui): this test is validating a certificate signed by a Root CA using the Root CA itself.
    // The main reason is that there are some issues with CRLs not signed by the Root CA.
    // This is not really a common practice, so, in the near future, the test must be changed to use
    // a certificate signed by an intermediate CA using the CA chain.
    it('connects to the server if the server certificate was issued by the given authority', () => {
        const ca = path.join(fixtures, 'ca.pem');
        const secureConfig = Object.assign({}, config, baseConfig, { ssl: true, sslOptions: { ca, servername } });

        return mysqlx.getSession(secureConfig)
            .then(session => {
                expect(session.inspect()).to.have.property('ssl', true);
                return session.close();
            });
    });

    // TODO(Rui): this test is validating a certificate signed by the Root CA using an intermediate CA.
    // This will result in a different error from the expected one. So, in the near future, one must
    // make sure it uses a certificate signed by an intermediate CA (a different one maybe), which will
    // result in the expected error.
    it('fails to connect if the server certificate was not issued by the given authority', () => {
        const ca = path.join(fixtures, 'non-authoritative-ca.pem');
        const secureConfig = Object.assign({}, config, baseConfig, { ssl: true, sslOptions: { ca, servername } });

        return mysqlx.getSession(secureConfig)
            .then(() => expect.fail())
            .catch(err => {
                // FIXME(Rui): with an intermediate CA, the error code should be 'UNABLE_TO_GET_ISSUER_CERT'.
                expect(err.code).to.equal('UNABLE_TO_VERIFY_LEAF_SIGNATURE');
            });
    });

    it('connects to the server if the server certificate is not revoked', () => {
        const ca = path.join(fixtures, 'ca.pem');
        const crl = path.join(fixtures, 'empty-crl.pem');
        const secureConfig = Object.assign({}, config, baseConfig, { ssl: true, sslOptions: { ca, crl, servername } });

        return mysqlx.getSession(secureConfig)
            .then(session => {
                expect(session.inspect()).to.have.property('ssl', true);
                return session.close();
            });
    });

    it('fails to connect if the server certificate is revoked', () => {
        const ca = path.join(fixtures, 'ca.pem');
        const crl = path.join(fixtures, 'crl.pem');
        const secureConfig = Object.assign({}, config, baseConfig, { ssl: true, sslOptions: { ca, crl, servername } });

        return mysqlx.getSession(secureConfig)
            .then(() => expect.fail())
            .catch(err => {
                expect(err.code).to.equal('CERT_REVOKED');
            });
    });
});
