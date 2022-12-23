/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const expect = require('chai').expect;
const td = require('testdouble');

// subject under test needs to be reloaded with replacement fakes
let SqlResultHandler = require('../../../../lib/Protocol/InboundHandlers/SqlResultHandler');

describe('SqlResultHandler inbound handler', () => {
    let NoticeStub, columnMetadata, fetchDone, fetchDoneMoreResultsets, info, logger, notice, row, stmtExecuteOk;

    beforeEach('create fakes', () => {
        info = td.function();

        NoticeStub = td.replace('../../../../lib/Protocol/Stubs/mysqlx_notice_pb');
        columnMetadata = td.replace('../../../../lib/Protocol/Wrappers/Messages/Resultset/ColumnMetadata');
        fetchDone = td.replace('../../../../lib/Protocol/Wrappers/Messages/Resultset/FetchDone');
        fetchDoneMoreResultsets = td.replace('../../../../lib/Protocol/Wrappers/Messages/Resultset/FetchDoneMoreResultsets');
        logger = td.replace('../../../../lib/logger');
        notice = td.replace('../../../../lib/Protocol/Wrappers/Messages/Notice/Frame');
        row = td.replace('../../../../lib/Protocol/Wrappers/Messages/Resultset/Row');
        stmtExecuteOk = td.replace('../../../../lib/Protocol/Wrappers/Messages/Sql/StmtExecuteOk');

        td.when(logger('protocol:inbound:Mysqlx')).thenReturn({ info });

        SqlResultHandler = require('../../../../lib/Protocol/InboundHandlers/SqlResultHandler');
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('when a Mysqlx.Resultset.ColumnMetada message is received', () => {
        it('keeps the column metadata of the current result set', () => {
            const handler = new SqlResultHandler();

            td.when(columnMetadata.deserialize('foo')).thenReturn('bar');

            handler[columnMetadata.MESSAGE_ID]('foo');

            expect(handler._currentResultsetMetadata).to.deep.equal(['bar']);
        });

        it('logs the column metadata protocol message', () => {
            const handler = new SqlResultHandler();

            td.when(columnMetadata.deserialize('foo')).thenReturn('bar');

            handler[columnMetadata.MESSAGE_ID]('foo');

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Resultset.ColumnMetaData');
            expect(td.explain(info).calls[0].args[1]).to.equal('bar');
        });
    });

    context('when a Mysqlx.Result.Row message is received', () => {
        context('and a data callback is not available', () => {
            it('creates a new list of result sets starting from the current row and result set', () => {
                const handler = new SqlResultHandler();
                handler._currentResultsetMetadata = ['bar'];

                const setColumnMetadata = td.function();

                td.when(row.deserialize('foo')).thenReturn({ setColumnMetadata });
                td.when(setColumnMetadata(['bar'])).thenReturn('baz');

                handler[row.MESSAGE_ID]('foo');

                expect(handler._results).to.deep.equal([['baz']]);
            });

            it('creates a new result set starting from the current row', () => {
                const handler = new SqlResultHandler();
                handler._currentResultsetMetadata = ['bar'];
                handler._results = [['baz']];
                handler._resultIndex = 1;

                const setColumnMetadata = td.function();

                td.when(row.deserialize('foo')).thenReturn({ setColumnMetadata });
                td.when(setColumnMetadata(['bar'])).thenReturn('qux');

                handler[row.MESSAGE_ID]('foo');

                expect(handler._results).to.deep.equal([['baz'], ['qux']]);
            });

            it('appends the current row to the list of cached rows of an existing result set', () => {
                const handler = new SqlResultHandler();
                handler._currentResultsetMetadata = ['bar'];
                handler._results = [['baz']];

                const setColumnMetadata = td.function();

                td.when(row.deserialize('foo')).thenReturn({ setColumnMetadata });
                td.when(setColumnMetadata(['bar'])).thenReturn('qux');

                handler[row.MESSAGE_ID]('foo');

                expect(handler._results).to.deep.equal([['baz', 'qux']]);
            });
        });

        context('and a data callback is available', () => {
            it('invokes the callback with the current row', () => {
                const dataCallback = td.function();
                const handler = new SqlResultHandler(dataCallback);
                handler._currentResultsetMetadata = ['bar'];

                const setColumnMetadata = td.function();

                td.when(row.deserialize('foo')).thenReturn({ setColumnMetadata });
                td.when(setColumnMetadata(['bar'])).thenReturn(['qux']);

                handler[row.MESSAGE_ID]('foo');

                expect(td.explain(dataCallback).callCount).to.equal(1);
                expect(td.explain(dataCallback).calls[0].args[0]).to.deep.equal(['qux']);
            });

            it('calls the metadata callback if it is also available and has not been called before for the same result set', () => {
                const dataCallback = td.function();
                const metadataCallback = td.function();

                const handler = new SqlResultHandler(dataCallback, metadataCallback);
                handler._currentResultsetMetadata = ['bar'];

                const setColumnMetadata = td.function();

                td.when(row.deserialize('foo')).thenReturn({ setColumnMetadata });
                td.when(setColumnMetadata(['bar'])).thenReturn(['qux']);

                handler[row.MESSAGE_ID]('foo');

                expect(td.explain(dataCallback).callCount).to.equal(1);
                expect(td.explain(dataCallback).calls[0].args[0]).to.deep.equal(['qux']);
                expect(td.explain(metadataCallback).callCount).to.equal(1);
                expect(td.explain(metadataCallback).calls[0].args[0]).to.deep.equal(['bar']);
            });

            it('does not call the metadata callback if it is available but has been called before for the same result set', () => {
                const dataCallback = td.function();
                const metadataCallback = td.function();

                const handler = new SqlResultHandler(dataCallback, metadataCallback);
                handler._currentResultsetMetadata = ['baz'];

                const setColumnMetadata = td.function();

                td.when(row.deserialize('foo')).thenReturn({ setColumnMetadata });
                td.when(row.deserialize('bar')).thenReturn({ setColumnMetadata });
                td.when(setColumnMetadata(['baz'])).thenReturn(['qux']);

                handler[row.MESSAGE_ID]('foo');
                handler[row.MESSAGE_ID]('bar');

                expect(td.explain(dataCallback).callCount).to.equal(2);
                expect(td.explain(metadataCallback).callCount).to.equal(1);
            });
        });

        it('logs the protocol message', () => {
            const handler = new SqlResultHandler();
            handler._currentResultsetMetadata = ['bar'];

            const setColumnMetadata = td.function();

            td.when(row.deserialize('foo')).thenReturn({ setColumnMetadata });
            td.when(setColumnMetadata(['bar'])).thenReturn('baz');

            handler[row.MESSAGE_ID]('foo');

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Resultset.Row');
            expect(td.explain(info).calls[0].args[1]).to.equal('baz');
        });
    });

    context('when a Mysqlx.Resultset.FetchDone message is received', () => {
        it('tracks the current result set column metadata alongside the column metadata for other result sets', () => {
            const handler = new SqlResultHandler();
            handler._currentResultsetMetadata = ['baz'];
            handler._metadataForAllResultsets = [['bar']];

            td.when(fetchDone.deserialize('foo')).thenReturn();

            handler[fetchDone.MESSAGE_ID]('foo');

            expect(handler._metadataForAllResultsets).to.deep.equal([['bar'], ['baz']]);
        });

        it('logs the protocol message', () => {
            const handler = new SqlResultHandler();

            td.when(fetchDone.deserialize('foo')).thenReturn('bar');

            handler[fetchDone.MESSAGE_ID]('foo');

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Resultset.FetchDone');
            expect(td.explain(info).calls[0].args[1]).to.equal('bar');
        });
    });

    context('when a Mysqlx.Resultset.StmtExecuteOk message is received', () => {
        it('resets the internal result set index', () => {
            const handler = new SqlResultHandler();
            handler._resolve = () => {};
            handler._resultIndex = 3;

            td.when(stmtExecuteOk.deserialize(), { ignoreExtraArgs: true }).thenReturn();

            handler[stmtExecuteOk.MESSAGE_ID]('foo', () => {});

            expect(handler._resultIndex).to.equal(0);
        });

        it('finishes the associated job in the queue', () => {
            const handler = new SqlResultHandler();
            handler._resolve = () => {};

            const queueDone = td.function();

            td.when(stmtExecuteOk.deserialize(), { ignoreExtraArgs: true }).thenReturn();

            handler[stmtExecuteOk.MESSAGE_ID]('foo', queueDone);

            expect(td.explain(queueDone).callCount).to.equal(1);
        });

        it('invokes the finishing handler with the relevant state', () => {
            const handler = new SqlResultHandler();
            handler._resolve = td.function();
            handler._results = [[['foo', 'bar'], ['baz']], ['qux']];
            handler._generated_document_ids = ['quux', 'quuz'];
            handler._generated_insert_id = 'corge';
            handler._messages = ['grault', 'garply'];
            handler._metadata = [['waldo'], ['fred']];
            handler._rows_affected = ['plugh'];
            handler._warnings = ['xyzzy'];

            td.when(stmtExecuteOk.deserialize(), { ignoreExtraArgs: true }).thenReturn();

            handler[stmtExecuteOk.MESSAGE_ID]('foo', () => {});

            expect(td.explain(handler._resolve).callCount).to.equal(1);
            expect(td.explain(handler._resolve).calls[0].args[0]).to.deep.equal({
                results: handler._results,
                generatedDocumentIds: handler._generated_document_ids,
                generatedInsertId: handler._generated_insert_id,
                messages: handler._messages,
                metadata: handler._metadataForAllResultsets,
                rowsAffected: handler._rows_affected,
                warnings: handler._warnings
            });
        });

        it('logs the protocol message', () => {
            const handler = new SqlResultHandler();
            handler._resolve = () => {};

            td.when(stmtExecuteOk.deserialize('foo')).thenReturn('bar');

            handler[stmtExecuteOk.MESSAGE_ID]('foo', () => {});

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Sql.StmtExecuteOk');
            expect(td.explain(info).calls[0].args[1]).to.equal('bar');
        });
    });

    context('when a Mysqlx.Resultset.FetchDoneMoreResultsets message is received', () => {
        it('tracks the current result set column metadata alongside the column metadata for other result sets', () => {
            const handler = new SqlResultHandler();
            handler._currentResultsetMetadata = ['baz'];
            handler._metadataForAllResultsets = [['bar']];

            td.when(fetchDoneMoreResultsets.deserialize('foo')).thenReturn();

            handler[fetchDoneMoreResultsets.MESSAGE_ID]('foo');

            expect(handler._metadataForAllResultsets).to.deep.equal([['bar'], ['baz']]);
        });

        it('clears the memory space used by the column metadata of the current result set', () => {
            const handler = new SqlResultHandler();
            handler._currentResultsetMetadata = ['baz'];

            td.when(fetchDoneMoreResultsets.deserialize('foo')).thenReturn();

            handler[fetchDoneMoreResultsets.MESSAGE_ID]('foo');

            return expect(handler._currentResultsetMetadata).to.be.an('array').and.be.empty;
        });

        it('BUG#31037211 creates a reference for the current result set in case it was empty', () => {
            const handler = new SqlResultHandler();

            td.when(fetchDoneMoreResultsets.deserialize('foo')).thenReturn();

            // with an empty list of result sets
            handler[fetchDoneMoreResultsets.MESSAGE_ID]('foo');
            expect(handler._results).to.deep.equal([[]]);

            // with one existing result set
            handler._results = [['bar']];
            handler._resultIndex = 1;

            handler[fetchDoneMoreResultsets.MESSAGE_ID]('foo');
            expect(handler._results).to.deep.equal([['bar'], []]);
        });

        it('increases the global result set index to track the remaining result sets', () => {
            const handler = new SqlResultHandler();
            handler._resultIndex = 3;

            td.when(fetchDoneMoreResultsets.deserialize('foo')).thenReturn();

            handler[fetchDoneMoreResultsets.MESSAGE_ID]('foo');

            return expect(handler._resultIndex).to.equal(4);
        });

        it('logs the protocol message', () => {
            const handler = new SqlResultHandler();

            td.when(fetchDoneMoreResultsets.deserialize('foo')).thenReturn('bar');

            handler[fetchDoneMoreResultsets.MESSAGE_ID]('foo');

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Resultset.FetchDoneMoreResultsets');
            expect(td.explain(info).calls[0].args[1]).to.equal('bar');
        });
    });

    context('when a Mysqlx.Notice.Frame message is received', () => {
        it('logs the protocol message', () => {
            const handler = new SqlResultHandler();
            const frame = { toObject: td.function() };

            td.when(notice.deserialize('foo')).thenReturn(frame);
            td.when(frame.toObject()).thenReturn({ type: NoticeStub.Frame.Type.UNKNOWN });

            handler[notice.MESSAGE_ID]('foo');

            expect(td.explain(info).callCount).to.equal(1);
            expect(td.explain(info).calls[0].args[0]).to.equal('Notice.Frame');
            expect(td.explain(info).calls[0].args[1]).to.equal(frame);
        });
    });
});
