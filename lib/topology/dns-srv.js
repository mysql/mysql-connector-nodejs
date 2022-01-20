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

const dns = require('dns').promises;
const errors = require('../constants/errors');
const util = require('util');
const { isValidBoolean } = require('../validator');

/**
 * @private
 * @typedef {Object} ServiceRecord
 * @prop {string} host - service hostname
 * @prop {number} priority - priority relative to other services
 * @prop {number} port - service port
 * @prop {number} weight - service preference under the same priority
 */

/**
 * Perform a DNS SRV lookup.
 * @private
 * @param {string} serviceDefinition - service definition to lookup
 * @return {ServiceRecord[]}
 */
exports.lookup = function (serviceDefinition) {
    return dns.resolveSrv(serviceDefinition)
        .then(endpoints => {
            // We want to rename "name" to "host". Also, since DNS SRV does
            // not work with local Unix sockets, we do not have to worry about
            // the "socket" property.
            return endpoints.map(({ name, port, priority, weight }) => ({ host: name, priority, port, weight }));
        })
        .catch(err => {
            // We want a custom error message in this case.
            err.message = util.format(errors.MESSAGES.ER_DEVAPI_SRV_RECORDS_NOT_AVAILABLE, serviceDefinition);
            throw err;
        });
};

/**
 * Sort DNS SRV records.
 * @private
 * @param {Object[]} endpoints
 * @return {Object[]}
 */
exports.sort = function (endpoints = []) {
    return Array.from(endpoints).sort((a, b) => {
        // In DNS SRV records, the lower the priority of an endpoint, the more
        // important it is. There is a chance that a record does not have a
        // priority (e.g. on Consul), but in that case, the core Node.js API
        // simply returns a default value of 1, so we do not have to worry
        // about the values being undefined.
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }

        // On the other hand, a higher weight means more importance.
        if (a.weight !== b.weight) {
            return b.weight - a.weight;
        }

        // For endpoints with the same priority and weigth, the order
        // is determined via random weighted selection.
        return [-1, 1][Math.floor(Math.random() * 2)];
    });
};

/**
 * Validate the DNS SRV property setup.
 * @private
 * @param {Object} params
 * @param {Array<Endpoint>} [endpoints] - any list of endpoints provided as a connection option
 * @param {string} [host] - the value of "host" property provided as a connection option
 * @param {number} [port] - the value of "port" provided as a connection option
 * @param {boolean} [resolveSrv] - wether the connection will be using DNS SRV or not
 * @param {string} [socket] - the value of "socket" provided as a connection option
 * @returns {boolean} Returns true if all options and values are valid.
 * @throws when "resolveSrv" is badly specified, when there are multiple endpoints
 * or when an endpoint definition contains a port or a socket.
 */
exports.validate = function ({ endpoints, host, port, resolveSrv, socket }) {
    // Validate SRV and multi-host options.
    if (!isValidBoolean({ value: resolveSrv })) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_BAD_SRV_LOOKUP_OPTION);
    }

    // DNS SRV and multi-host connections are two alternative solutions for
    // the same problem. They are mutualy exclusive because the connection
    // does specify DNS server addresses, only MySQL endpoints. In the case of
    // DNS SRV, those endpoints are returned by the DNS server picked by the
    // system where the application is running.
    // resolveSrv should be true or false by this point.
    if (resolveSrv && endpoints && endpoints.length > 1) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_MULTIPLE_ENDPOINTS);
    }

    // If the endpoint list is not defined, we look at the plain
    // endpoint properties.
    const endpoint = endpoints && endpoints.length ? endpoints[0] : { host, port, socket };

    // The lookup happens via port 53 (the default) using the DNS servers
    // configured in the machine where the application is running.
    // Additionally, it should only include the service, the protocol and the
    // domain (e.g. _mysql._tcp.example.com).
    if (resolveSrv && endpoint.port) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_PORT);
    }

    // The DNS SRV RR also does not support local paths, so we should not
    // allow local socket addresses.
    if (resolveSrv && endpoint.socket) {
        throw new Error(errors.MESSAGES.ER_DEVAPI_SRV_LOOKUP_NO_UNIX_SOCKET);
    }

    return true;
};
