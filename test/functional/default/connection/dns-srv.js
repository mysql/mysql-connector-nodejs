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
const mysqlx = require('../../../../');
const os = require('os');

context('connecting to the MySQL server using DNS SRV', () => {
    const baseConfig = { host: '_mysqlx._tcp.example.com', port: undefined, resolveSrv: true };

    context('using a configuration object', () => {
        it('fails if the host is not a DNS SRV interface', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { host: config.host, socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Unable to locate any hosts for ${config.host}`));
        });

        it('fails if a port is provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { port: 33060, socket: undefined });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying a port number with DNS SRV lookup is not allowed.'));
        });

        it('fails if a UNIX socket path is provided', function () {
            const srvConfig = Object.assign({}, config, baseConfig, { port: undefined, socket: '/path/to/unix/socket.sock' });

            if (!srvConfig.socket || os.platform() === 'win32') {
                this.skip();
            }

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Using Unix domain sockets with DNS SRV lookup is not allowed.'));
        });

        it('fails if multiple endpoints with explicit priority are provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: baseConfig.host, port: 33060, priority: 99 }, { host: baseConfig.host, port: 33061, priority: 100 }] });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
        });

        it('fails if multiple endpoints without explicit priority are provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { endpoints: [{ host: baseConfig.host, port: 33060 }, { host: baseConfig.host, port: 33061 }] });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
        });

        it('fails if an invalid option value is provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { resolveSrv: 'foo' });

            return mysqlx.getSession(srvConfig)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('SRV resolution can only be toggled using a boolean value (true or false).'));
        });
    });

    context('using a URI', () => {
        it('fails if the host is not a DNS SRV interface', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { host: config.host, socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal(`Unable to locate any hosts for ${config.host}`));
        });

        it('fails if a port is provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig, { port: 33060, socket: undefined });
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@${srvConfig.host}:${srvConfig.port}`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying a port number with DNS SRV lookup is not allowed.'));
        });

        it('fails if a UNIX socket path is provided', function () {
            const srvConfig = Object.assign({}, config, baseConfig, { host: undefined, port: undefined, socket: '/path/to/unix/socket.sock' });

            if (!srvConfig.socket || os.platform() === 'win32') {
                this.skip();
            }

            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@(${srvConfig.socket})`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Using Unix domain sockets with DNS SRV lookup is not allowed.'));
        });

        it('fails if multiple endpoints with explicit priority are provided', () => {
            const srvConfig = Object.assign({}, config, baseConfig);
            const hosts = [`${srvConfig.host}:${srvConfig.port + 1}`, `${srvConfig.host}:${srvConfig.port}`];
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
        });

        it('fails if multiple endpoints without explicit priority are provided', () => {
            const srvConfig = Object.assign({}, config);
            const hosts = [`(address=${srvConfig.host}:${srvConfig.port}, priority=99), (address=${srvConfig.host}:${srvConfig.port}, priority=100)`];
            const uri = `mysqlx+srv://${srvConfig.user}:${srvConfig.password}@[${hosts.join(', ')}]`;

            return mysqlx.getSession(uri)
                .then(() => expect.fail())
                .catch(err => expect(err.message).to.equal('Specifying multiple hostnames with DNS SRV lookup is not allowed.'));
        });
    });
});
