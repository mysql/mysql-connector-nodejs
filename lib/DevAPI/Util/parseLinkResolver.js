/*
 * Copyright (c) 2015, 2016, Oracle and/or its affiliates. All rights reserved.
 *
 * MySQL Connector/Node.js is licensed under the terms of the GPLv2
 * <http://www.gnu.org/licenses/old-licenses/gpl-2.0.html>, like most
 * MySQL Connectors. There are special exceptions to the terms and
 * conditions of the GPLv2 as it is applied to this software, see the
 * FLOSS License Exception
 * <http://www.mysql.com/about/legal/licensing/foss-exception.html>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; version 2 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301  USA
 */

"use strict";

const joinOperations = require('../../Protocol/Client').joinOperatios;

/**
 * Link resolver
 * @typedef {object} ResolvedLinks
 * @property {string} alias
 * @property {Array.<ResolvedLink>} links
 * @private
 */

/**
 * Link resolver
 * @typedef {object} ResolvedLink
 * @property {string} linkname
 * @property {string} alias
 * @property {string} operation
 * @private
 */

const STATE = {
    INITIAL: 0,
    QUOTED_IDENTIFIER: 2
};

const linkType = {
    '-->': joinOperations.LEFT,
    '==>': joinOperations.INNER
};

/**
 * Parse a Link Resolve string
 * @param {string} expr
 * @return {ResolvedLinks}
 * @private
 */
function parseLinkResolver(expr) {
    let state = STATE.INITIAL,
        tokens = [],
        ident = '';
    const len = expr.length,
        retval = { links: [] };

    if (len === 0) {
        throw new Error("Empty resolve expression provided");
    }

    for (let position = 0; position < len; ++position) {
        const current = expr[position];

        switch (state) {
            case STATE.INITIAL:
                if (current.match(/^\s$/)) {
                    /* ignore whitespace */
                    break;
                } else if (!!(ident = expr.substr(position).match(/^([0-9a-zA-Z$_\u0080-\uFFFF]+)/))) {
                    tokens.push(ident[0]);
                    position += ident[0].length - 1;
                    break;
                } else if (current === '`') {
                    ident = '';
                    state = STATE.QUOTED_IDENTIFIER;
                    break;
                } else if (current === '-' && expr[position + 1] === '-' && expr[position + 2] === '>') {
                    tokens.push('-->');
                    position += 2;
                    break;
                } else if (current === '=' && expr[position + 1] === '=' && expr[position + 2] === '>') {
                    tokens.push('==>');
                    position += 2;
                    break;
                } else if (current === ',') {
                    tokens.push(',');
                    break;
                }

                throw new Error("Unexpected " + current + " at position " + position + " while parsing link resolve expression");

            case STATE.QUOTED_IDENTIFIER:
                if (current === '`') {
                    if (expr[position + 1] === '`') {
                        ident += '`';
                        position++;
                        break;
                    } else {
                        tokens.push(ident);
                        state = STATE.INITIAL;
                        break;
                    }
                }

                ident += current;
                break;
        }
    }

    if (state === STATE.QUOTED_IDENTIFIER) {
        throw new Error("Unterminated quoted identifier while parsing resolve expression");
    } else if (state !== STATE.INITIAL) {
        throw new Error("Internal error: Invalid state after parsing resolve expression. Please file a bug");
    }

    if (tokens.length === 1) {
        return {
            links: [
                {
                    "link": tokens[0]
                }
            ]
        };
    }

    if (!linkType[tokens[1]]) {
        retval.alias = tokens.shift();
    }


    do {
        const currentlink = {};

        // A link might start with an optional type (--> or ==>)
        if (linkType[tokens[0]] !== undefined) {
            currentlink.operation = linkType[tokens.shift()];
        }

        // Now we have the linkname and an optional alias
        currentlink.linkname = tokens[0];
        const has_as = !!(tokens[1] && tokens[1].length === 2 && tokens[1].toLowerCase() === 'as');
        let alias = tokens[1 + has_as];

        // We don't want to treat --> and ==> as alias name
        if (alias && linkType[alias] === undefined) {
            currentlink.alias = alias;
        } else {
            alias = false;
        }

        retval.links.push(currentlink);
        tokens.splice(0, 1 + has_as + !!alias);

    } while (tokens.length);
    
    return retval;
}

module.exports = parseLinkResolver;
