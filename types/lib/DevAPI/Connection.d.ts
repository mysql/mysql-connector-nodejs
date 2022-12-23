/*
 * Copyright (c) 2022, Oracle and/or its affiliates.
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

import { checkServerIdentity } from 'tls';

/**
 * Connection configuration options.
 * ```
 * interface {
 *   auth?: string
 *   connectTimeout?: number
 *   connectionAttributes?: {
 *     [key: string]: string
 *   }
 *   endpoints?: [{
 *     host?: string
 *     port?: number
 *     socket?: string
 *   }]
 *   host?: string
 *   integerType?: string
 *   password?: string
 *   port?: number
 *   resolveSrv?: boolean
 *   schema?: string
 *   socket?: string
 *   tls?: {
 *     enabled?: boolean
 *     ca?: string | Buffer | Buffer[]
 *     checkServerIdentity?: function
 *     ciphersuites?: string[]
 *     crl?: string | Buffer | Buffer[]
 *     versions?: string[]
 *   }
 *   user: string
 * }
 * ```
 */
export interface Options {
    /**
     * Authentication mechanism to use.
     * @defaultValue `PLAIN`
     */
    auth?: string
    /**
     * Time (in milliseconds) until the client gives up on connecting to the sever.
     * @defaultValue `10000`
     */
    connectTimeout?: number
    /**
     * Connection attributes to be stored on a per-session basis.
     */
    connectionAttributes?: {
        [key: string]: string
    }
    /**
     * List of multi-host endpoints (including the primary).
     */
    endpoints?: [{
        host?: string
        port?: number
        socket?: string
    }]
    /**
     * The hostname or IP address of the primary MySQL server endpoint.
     * @defaultValue `'localhost'`
     */
    host?: string
    /**
     * The conversion mode for downstream integer values.
     * @defaultValue `'unsafe_string'`
     */
    integerType?: string
    /**
     * The MySQL account password.
     * @defaultValue `''` (empty string)
     */
    password?: string
    /**
     * The port where the MySQL server is bound to in the endpoint.
     * @defaultValue `33060`
     */
    port?: number
    /**
     * Whether the endpoint is an SRV service directory.
     * @defaultValue `false`
     */
    resolveSrv?: boolean
    /**
     * The default schema to associate to the resulting X DevAPI session.
     */
    schema?: string
    /**
     * Path to a local Unix socket where the MySQL server is bound.
     */
    socket?: string
    /**
     * TLS-related options.
     * ```
     * {
     *   enabled: boolean,
     *   ca: string | Buffer | [Buffer],
     *   ciphersuites: [string],
     *   crl: string | Buffer | [Buffer],
     *   versions: [string]
     * }
     * ```
     */
    tls?: {
        /**
         * Enable or disable TLS.
         * @defaultValue `true`
         */
        enabled?: boolean
        /**
         * Path to a PEM file containining the certificate authority chain, a pointer to the file content itself or an array of file pointers.
         */
        ca?: string | Buffer | Buffer[]
        /**
         * Custom function to assert the server identity using the name in the server certificate.
         */
        checkServerIdentity?: typeof checkServerIdentity
        /**
         * List of TLS ciphersuites allowed by the application.
         */
        ciphersuites?: string[]
        /**
         * Path to a PEM file containining the certificate revocation list, a pointer to the file content itself or an array of file pointers.
         */
        crl?: string | Buffer | Buffer[]
        /**
         * List of TLS versions allowed by the application.
         * @defaultValue `['TLSv1.2', 'TLSv1.3']`
         */
        versions?: string[]
    }
    /**
     * The MySQL username.
     */
    user: string
}
