/*
 * Copyright (c) 2023, Oracle and/or its affiliates.
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

const DNS = require('dns2');
const dns = require('dns').promises;
const loadServices = require('./discovery/loadServices');
const getActiveServices = require('./discovery/getActiveServices');

const { Packet } = DNS;

const dnsClient = new DNS({ nameServers: dns.getServers() });
const dnsServer = DNS.createServer({ udp: true });

dnsServer.on('request', async (request, send) => {
    const response = Packet.createResponseFromRequest(request);
    const [question] = request.questions;
    const { type, name } = question;

    let answers = [];

    if (type !== Packet.TYPE.SRV || name !== '_mysqlx._tcp.example.com') {
        // We forward the DNS query to the embedded Docker DNS server.
        const rrtype = Object.keys(Packet.TYPE).find(k => Packet.TYPE[k] === type);
        const authoritativeResponse = await dnsClient.resolve(name, rrtype);
        answers = authoritativeResponse.answers;
    } else {
        const records = await getActiveServices();
        answers = records.map(record => ({ ...record, class: Packet.CLASS.IN, type }));
    }

    response.answers = answers;

    send(response);
});

dnsServer.listen({ udp: { port: 53 } })
    .then(async () => {
        await loadServices();
    });
