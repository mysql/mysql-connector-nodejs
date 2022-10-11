/*
 * Copyright (c) 2021, 2022, Oracle and/or its affiliates.
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

const dns = require('dns2');

const { Packet } = dns;

module.exports = function ({ host = '127.0.0.1', service, records = [] }) {
    const dnsServer = dns.createServer({ udp: true });

    dnsServer.on('request', (request, send) => {
        const response = Packet.createResponseFromRequest(request);
        const [question] = request.questions;
        const { name } = question;

        // If the service definition does not match, we should not
        // create any record.
        if (name !== service) {
            return send(response);
        }

        // Otherwise we create an entry for each record using the appropriate
        // format and return them in the DNS query answer.
        const answers = records.map(record => Object.assign({}, {
            class: Packet.CLASS.IN,
            name,
            type: Packet.TYPE.SRV
        }, record));

        response.answers = response.answers.concat(answers);
        send(response);
    });

    return dnsServer.listen({ udp: { address: host } })
        .then(() => dnsServer);
};
