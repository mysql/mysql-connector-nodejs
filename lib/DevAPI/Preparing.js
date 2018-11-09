/*
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
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

/**
 * Enum the current statement lifecycle stage.
 * @readonly
 * @private
 * @name STATEMENT_STATUS
 * @enum {number}
 */
const STATEMENT_STATUS = {
    TO_START: 1,
    TO_PREPARE: 2,
    TO_EXECUTE: 3,
    TO_REPREPARE: 4,
    TO_RESTART: 5,
    TO_SKIP: 6
};

/**
 * Preparing mixin.
 * @mixin
 * @private
 * @alias Preparing
 * @param {Object} state
 * @returns {Preparing}
 */
function Preparing (state) {
    state = Object.assign({ statementId: 0, stage: STATEMENT_STATUS.TO_START }, state);

    return {
        /**
         * Acquire a statement context.
         * @function
         * @private
         * @name Preparing#allocate
         * @return {Preparing} The statement instance.
         */
        allocate () {
            let statements = state.session._statements;
            let id = 0;

            while (statements[id]) {
                ++id;
            }

            statements[id] = true;
            state.statementId = id + 1;

            return this;
        },

        /**
         * Release a previously prepared statement.
         * @function
         * @private
         * @name Preparing#deallocate
         * @return {Preparing} The statement instance.
         */
        deallocate () {
            return state.session._client.deallocate(this)
                .then(() => {
                    if (state.stage === STATEMENT_STATUS.TO_RESTART) {
                        state.stage = STATEMENT_STATUS.TO_START;
                    } else if (state.stage === STATEMENT_STATUS.TO_REPREPARE) {
                        state.stage = STATEMENT_STATUS.TO_PREPARE;
                    }

                    state.session._statements[state.statementId - 1] = undefined;

                    return this;
                });
        },

        /**
         * Manage statement execution (prepared or plain) given the existing context.
         * @function
         * @private
         * @name Preparing#execute
         * @param {Function} fn - fallback function to execute when the server does not support prepared statements.
         * @param {Function} [dataCursor] - callback function used to process result set data
         * @param {Function} [metadataCursor] - callback function used to process result set metadata
         * @returns {Promise.<Object>}
         */
        execute (fn, dataCursor, metadataCursor) {
            if (state.stage === STATEMENT_STATUS.TO_RESTART || state.stage === STATEMENT_STATUS.TO_REPREPARE) {
                return this.deallocate().then(() => this.execute(fn, dataCursor, metadataCursor));
            }

            if (state.stage === STATEMENT_STATUS.TO_PREPARE) {
                return this.prepare().then(() => this.execute(fn, dataCursor, metadataCursor)).catch(err => this.handlePrepareError(err, fn));
            }

            if (state.stage === STATEMENT_STATUS.TO_EXECUTE) {
                return this.executePrepared(dataCursor, metadataCursor);
            }

            return this.executePlain(fn);
        },

        /**
         * Execute a plain statement wrapped inside an operation factory function.
         * @function
         * @private
         * @name Preparing#executePlain
         * @param {Function} fn - fallback function
         * @returns {Promise.<Object>}
         */
        executePlain (fn) {
            return fn()
                .then(res => {
                    if (state.stage !== STATEMENT_STATUS.TO_SKIP) {
                        state.stage = STATEMENT_STATUS.TO_PREPARE;
                    }

                    return res;
                });
        },

        /**
         * Execute a previously prepared statement.
         * @function
         * @private
         * @name Preparing#executePrepared
         * @param {module:CollectionFind~documentCursor|module:TableSelect~rowCursor} [rowcb]
         * @param {module:TableSelect~metadataCursor} [metacb]
         * @return {Promise.<Object>}
         */
        executePrepared (rowcb, metacb) {
            return state.session._client.prepareExecute(this, rowcb, metacb);
        },

        /**
         * Force statement to be re-prepared in the next execution.
         * @function
         * @private
         * @name Preparing#forceReprepare
         * @return {Preparing}
         */
        forceReprepare () {
            if (state.stage === STATEMENT_STATUS.TO_EXECUTE) {
                state.stage = STATEMENT_STATUS.TO_REPREPARE;
            }

            return this;
        },

        /**
         * Force statement lifecycle to be restarted in the next execution.
         * @function
         * @private
         * @name Preparing#forceRestart
         * @return {Preparing}
         */
        forceRestart () {
            if (state.stage === STATEMENT_STATUS.TO_EXECUTE) {
                state.stage = STATEMENT_STATUS.TO_RESTART;
            } else {
                state.stage = STATEMENT_STATUS.TO_START;
            }

            return this;
        },

        /**
         * Get the current statement lifecycle stage.
         * @function
         * @private
         * @name Preparing#getStage
         * @returns {}
         */
        getStage () {
            return state.stage;
        },

        /**
         * Retrieve the statement id.
         * @function
         * @private
         * @name Preparing#getStatementId
         * @returns {Number} The statement id.
         */
        getStatementId () {
            return state.statementId;
        },

        /**
         * Execute plain statement if the server does not support prepared statements.
         * @function
         * @private
         * @name Preparing#handlePrepareError
         * @param {Error} err - error to evaluate
         * @param {Function} fn - fallback function to execute when the server does not support prepared statements.
         */
        handlePrepareError (err, fn) {
            // non-fatal errors
            const errors = [1047, 1461];

            if (!err.info || errors.indexOf(err.info.code) === -1) {
                // Needs to return a failing Promise
                return Promise.reject(err);
            }

            state.session._canPrepareStatements = false;
            state.stage = STATEMENT_STATUS.TO_SKIP;

            return fn();
        },

        /**
         * Prepare a statement in the server.
         * @function
         * @private
         * @name Preparing#prepare
         * @return {Preparing} The statement instance.
         */
        prepare () {
            this.allocate();

            return state.session._client.prepare(this)
                .then(() => {
                    state.stage = STATEMENT_STATUS.TO_EXECUTE;

                    return this;
                });
        }
    };
}

Preparing.Stages = STATEMENT_STATUS;

module.exports = Preparing;
