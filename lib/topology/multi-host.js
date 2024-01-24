/*
 * Copyright (c) 2021, 2024, Oracle and/or its affiliates.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2.0, as
 * published by the Free Software Foundation.
 *
 * This program is designed to work with certain software (including
 * but not limited to OpenSSL) that is licensed under separate terms, as
 * designated in a particular file or component or in included license
 * documentation. The authors of MySQL hereby grant you an additional
 * permission to link the program and your derivative works with the
 * separately licensed software that they have either included with
 * the program or referenced in the documentation.
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
 * 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 */

'use strict';

/**
 * Sort MySQL server endpoints based on priority.
 * @private
 * @param {Object[]} endpoints
 * @return {Object[]}
 */
exports.sort = function (endpoints = []) {
    return Array.from(endpoints).sort((a, b) => {
        // The priority could not be defined, in which case, endpoints with an
        // explicit "priority" should be more "important" than endpoints
        // without one.
        if (!Number.isInteger(a.priority) && Number.isInteger(b.priority)) {
            return 1;
        }

        if (Number.isInteger(a.priority) && !Number.isInteger(b.priority)) {
            return -1;
        }

        // In a X DevAPI multi-host setting, the higher the priority of an
        // endpoint, the more important it is.
        if (a.priority !== b.priority) {
            return b.priority - a.priority;
        }

        // For endpoints with the same priority, the order is determined via
        // random weighted selection.
        return [-1, 1][Math.floor(Math.random() * 2)];
    });
};
