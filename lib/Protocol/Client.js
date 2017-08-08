/*
 * Copyright (c) 2015, 2017, Oracle and/or its affiliates. All rights reserved.
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

'use strict';

const DataType = require('./Datatype');
const Expressions = require('../Expressions');
const Encoding = require('./Encoding');
const Messages = require('./Messages');
const WorkQueue = require('../WorkQueue');
const fs = require('../Adapters/fs');
const getServerCipherSuite = require('./Util/getServerCipherSuite');
const handlers = require('./ResponseHandler');
const parseX509Bundle = require('./Util/parseX509Bundle');
const tls = require('tls');

/**
 * Main Protocol class
 * @param stream {stream}
 * @constructor
 * @private
 */
function Client (stream) {
    this._stream = stream;
    this._workQueue = new WorkQueue();
    this._danglingFragment = false;

    _addSocketEventListeners.call(this, this._stream);
}

module.exports = Client;

function _addSocketEventListeners (stream) {
    stream.on('data', data => this.handleNetworkFragment(data));
    stream.on('close', () => this.handleServerClose());
}

Client.dataModel = {
    "DOCUMENT": Messages.enums.DataModel.DOCUMENT,
    "TABLE": Messages.enums.DataModel.TABLE
};

Client.updateOperations = {
    "SET": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.SET,
    "ITEM_REMOVE": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ITEM_REMOVE,
    "ITEM_SET": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ITEM_SET,
    "ITEM_REPLACE": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ITEM_REPLACE,
    "ITEM_MERGE": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ITEM_MERGE,
    "ARRAY_INSERT": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ARRAY_INSERT,
    "ARRAY_APPEND": Messages.messages['Mysqlx.Crud.UpdateOperation'].enums.UpdateType.ARRAY_APPEND
};

// TODO - This is a hack, see also TODO in ResponseHandler.prototype.sendMessage
Client.serverGoneMessageId = -1;

Client.prototype.enableSSL = function (options) {
    const config = Object.assign({}, options, {
        ciphers: getServerCipherSuite(),
        rejectUnauthorized: false,
        socket: this._stream
    });

    if (typeof config.ca === 'string' && !config.ca.length) {
        return Promise.reject(new Error('CA value must not be empty string'));
    }

    if (typeof config.crl === 'string' && !config.crl.length) {
        return Promise.reject(new Error('CRL value must not be empty string'));
    }

    return this
        .capabilitiesSet({ tls: true })
        .then((res) => {
            if (!config.ca) {
                return;
            }

            return fs.readFile(config.ca, 'ascii');
        })
        .then(ca => {
            if (!ca || !config.crl) {
                return { ca };
            }

            return fs.readFile(config.crl, 'ascii').then(crl => ({ ca, crl }));
        })
        .then(security => new Promise((resolve, reject) => {
            delete config.ca;
            delete config.crl;

            if (security && security.ca) {
                // A CA file might contain a certificate chain/bundle.
                config.ca = parseX509Bundle(security.ca);
                config.rejectUnauthorized = true;
            }

            if (security && security.crl) {
                // A CRL does not contain a certificate chain/bundle.
                config.crl = security.crl;
            }

            this._stream = tls.connect(config, () => resolve(this._stream));
            this._stream.on('error', err => reject(err));
        }))
        .then(stream => {
            _addSocketEventListeners.call(this, stream);
            return true;
        })
        .catch(err => {
            const data = err.info;

            if (!data || !data.code || data.code !== 5001) {
                throw err;
            }

            const message = `The server's X plugin version does not support SSL. Please refer to https://dev.mysql.com/doc/refman/5.7/en/x-plugin-ssl-connections.html for more details on how to enable secure connections.`;

            throw new Error(message);
        });
};

/**
 * Encode data using protobuf and add MySQLx protocol header
 * @param messageId
 * @param data
 */
Client.prototype.encodeMessage = function (messageId, data, messages) {
    messages = messages || Encoding.clientMessages;
    return Encoding.encodeMessage(messageId, data, messages);
};

Client.prototype.decodeMessage = function (data, offset, messages) {
    messages = messages || Encoding.serverMessages;
    try {
        return Encoding.decodeMessage(data, offset, messages);
    } catch (err) {
        if (offset === 0 && messages === Encoding.serverMessages) {
            // To help newcomers we try to detect old MySQL servers
            if (data.readInt32LE(0) + 4 <= data.length && // Package length
                data[3] === 0 && // Package number
                data[4] === 10 // Protocol version
            ) {
                const versionEnd = data.indexOf("\0", 5);
                const version = data.toString("ascii", 5, versionEnd);
                throw new Error("The server you're connected to is no MySQL server speaking X Protocol. It could be MySQL " + version + " speaking the classic protocol");
            }
        }
        throw err;
    }
};

/**
 * Handle an individual message
 *
 * The passed buffer must only contain the single message
 *
 * @param {Buffer} message
 */
Client.prototype.handleServerMessage = function (message) {
    const current = this.decodeMessage(message, 0);

    if (current.messageId === Messages.ServerMessages.NOTICE && current.decoded.scope === Messages.messages['Mysqlx.Notice.Frame'].enums.Scope.GLOBAL) {
        console.log("TODO: Need to handle out of band message");
        console.log(Encoding.decodeNotice(current.decoded));
    } else {
        this._workQueue.process(current);
    }

};

/**
 * This is the entry point for everything from the network
 *
 * Here we split multiple messages from one network packet and and reassemble
 * fragmented pieces. Each individual message is passed over to
 * handleServerMessage.
 *
 * @param {Buffer} fragment
 */
Client.prototype.handleNetworkFragment = function (fragment) {
    let offset = 0;

    if (this._danglingFragment) {
        let header = Encoding.decodeMessageHeader(this._danglingFragment, 0);
        if (!header) {
            // The dangling frame is too small for even having a header
            // try to get 5 bytes, the size of our header
            // If this fails somebody is fooling us and Buffer will
            // throw an Error
            header = Encoding.decodeMessageHeader(Buffer.concat([this._danglingFragment, fragment.slice(0, 5 - this._danglingFragment.length)], 5), 0);
        }

        offset = header.payloadLen - this._danglingFragment.length;

        // Now we build a Buffer with the complete message, which can be handled
        const message = Buffer.concat([
            this._danglingFragment,
            fragment.slice(0, offset)
        ], header.payloadLen);

        this.handleServerMessage(message);
        this._danglingFragment = false;
    }

    while (offset < fragment.length) {
        const header = Encoding.decodeMessageHeader(fragment, offset);

        if (header && fragment.length >= offset + header.payloadLen) {
            // All is fine we have the complete message
            this.handleServerMessage(fragment.slice(offset, offset + header.payloadLen));
        } else {
            this._danglingFragment = fragment.slice(offset);
        }
        offset += header ? header.payloadLen : fragment.length;
    }
};

Client.prototype.handleServerClose = function () {
    while (this._workQueue.hasMore()) {
        this._workQueue.process(Client.serverGoneMessageId);
    }
};


Client.prototype.capabilitiesGet = function () {
    const buffer = this.encodeMessage(Messages.ClientMessages.CON_CAPABILITIES_GET, {});
    const handler = new handlers.CapabilitiesGetHandler(this);

    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Client.prototype.capabilitiesSet = function (properties) {
    const data = {
        capabilities: {
            capabilities: []
        }
    };

    for (let key in properties) {
        data.capabilities.capabilities.push({
            name: key,
            value: DataType.encode(properties[key])
        });
    }

    const buffer = this.encodeMessage(Messages.ClientMessages.CON_CAPABILITIES_SET, data);

    const handler = new handlers.OkHandler(this);
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};


Client.prototype.authenticate = function (authenticator) {
    const data = {
        mech_name: authenticator.name,
        auth_data: authenticator.getInitialAuthData()
    };

    const buffer = this.encodeMessage(Messages.ClientMessages.SESS_AUTHENTICATE_START, data);

    const handler = new handlers.AuthenticationHandler(authenticator, this);
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Client.prototype.authenticateContinue = function (auth_data, handler) {
    const data = {
        auth_data: auth_data
    };
    const buffer = this.encodeMessage(Messages.ClientMessages.SESS_AUTHENTICATE_CONTINUE, data);
    handler.sendDirect(this._stream, buffer);
};

Client.prototype.close = function () {
    const buffer = this.encodeMessage(Messages.ClientMessages.CON_CLOSE),
        handler = new handlers.OkHandler();
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Client.prototype.crudInsert = function (schema, collection, model, data, options) {
    data = Object.assign({}, { columns: [], rows: [] }, data);
    options = Object.assign({}, { upsert: false }, options);

    const message = {
        collection: {
            schema: schema,
            name: collection
        },
        data_model: model,
        projection: data.columns,
        upsert: options.upsert
    };

    message.row = data.rows.map(row => ({
        field: row.map(field => ({
            type: Messages.messages['Mysqlx.Expr.Expr'].enums.Type.LITERAL,
            literal: DataType.encodeScalar(field)
        }))
    }));

    const protobuf = this.encodeMessage(Messages.ClientMessages.CRUD_INSERT, message);
    const handler = new handlers.SqlResultHandler();

    return handler.sendMessage(this._workQueue, this._stream, protobuf);
};

Client.prototype.crudFind = function (session, schema, collection, model, projection, criteria, group, having, order, limit, rowcb, metacb, bounds, joins, locking) {
    const data = {
        collection: {
            schema: schema,
            name: collection
        },
        data_model: model,
        projection: projection,
        order: [],
        grouping: [],
        limit
    };

    criteria = Expressions.parse(criteria);
    if (criteria && criteria.expr && (Object.keys(criteria.expr).length !== 0 || JSON.stringify(criteria.expr) !== JSON.stringify({}))) {
        data.criteria = criteria.expr;
    }

    // FIXME(ruiquelhas): parser should understand literal name
    // TODO(rui.quelhas): use default value after moving to support node >=v6.0.0 (LTS)
    data.grouping = (group || []).map(column => Expressions.parse(`\`${column}\``).expr);

    having = Expressions.parse(having);
    if (having && having.expr && (Object.keys(having.expr).length !== 0 || JSON.stringify(having.expr) !== JSON.stringify({}))) {
        data.grouping_criteria = having.expr;
    }

    if (order) {
        if (!Array.isArray(order)) {
            order = [ order ];
        }

        data.order = order.map(o => {
            let direction = 1;
            o = o.trim();
            if (o.match(/\s*DESC$/i)) {
                direction = 2;
                o = o.substring(0, o.length - "DESC".length);
            } else if (o.match(/\s*ASC$/i)) {
                direction = 1;
                o = o.substring(0, o.length - "ASC".length);
            }
            o = Expressions.parse("`" + o.trim() + "`");
            if (o) {
                return {
                    expr: o.expr,
                    direction: direction
                };
            }
        });
    }

    if (joins && joins.length) {
        data.join = joins.map(j => {
            const ret = {
                collection: j.collection,
                match: Expressions.parse(j.match).expr
            };
            if (j.operation) {
                ret.operation = j.operation;
            }
            return ret;
        });
    }

    if (locking) {
        data.locking = locking;
    }

    if (criteria && criteria.placeholders && criteria.placeholders.named.length) {
        data.args = criteria.placeholders.named.map(key => DataType.encodeScalar(bounds[key]));
    }

    const buffer = this.encodeMessage(Messages.ClientMessages.CRUD_FIND, data),
        handler = new handlers.SqlResultHandler(rowcb, metacb);

    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Client.prototype.crudModify = function (schema, collection, dataModel, criteria, operations, limit, bounds) {
    const data = {
        collection: {
            schema: schema,
            name: collection
        },
        data_model: dataModel,
        operation: operations,
        limit
    };

    criteria = Expressions.parse(criteria);
    if (criteria && criteria.expr && (Object.keys(criteria.expr).length !== 0 || JSON.stringify(criteria.expr) !== JSON.stringify({}))) {
        data.criteria = criteria.expr;
    }

    if (criteria && criteria.placeholders && criteria.placeholders.named.length) {
        data.args = criteria.placeholders.named.map(key => DataType.encodeScalar(bounds[key]));
    }

    const buffer = this.encodeMessage(Messages.ClientMessages.CRUD_UPDATE, data),
        handler = new handlers.SqlResultHandler();
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Client.prototype.crudRemove = function (schema, collection, model, criteria, limit, bounds) {
    const data = {
        collection: {
            schema: schema,
            name: collection
        },
        data_model: model,
        order: [],
        limit
    };

    criteria = Expressions.parse(criteria);
    if (criteria && criteria.expr && (Object.keys(criteria.expr).length !== 0 || JSON.stringify(criteria.expr) !== JSON.stringify({}))) {
        data.criteria = criteria.expr;
    }

    if (criteria && criteria.placeholders && criteria.placeholders.named.length) {
        data.args = criteria.placeholders.named.map(key => DataType.encodeScalar(bounds[key]));
    }

    const buffer = this.encodeMessage(Messages.ClientMessages.CRUD_DELETE, data),
        handler = new handlers.SqlResultHandler();
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};

Client.prototype.sqlStmtExecute = function (stmt, args, rowcb, metacb, namespace) {
    namespace = namespace || "sql";
    args = args || [];

    const data = {
        namespace: namespace,
        stmt: stmt
    };

    data.args = args.map(arg => DataType.encode(arg));

    const buffer = this.encodeMessage(Messages.ClientMessages.SQL_STMT_EXECUTE, data),
        handler = new handlers.SqlResultHandler(rowcb, metacb);
    return handler.sendMessage(this._workQueue, this._stream, buffer);
};
