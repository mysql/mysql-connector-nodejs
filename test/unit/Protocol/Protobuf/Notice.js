'use strict';

/* eslint-env node, mocha */

const Frame = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_notice_pb').Frame;
const Notice = require('../../../../lib/Protocol/Protobuf/Adapters/Notice');
const Scalar = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_datatypes_pb').Scalar;
const SessionStateChanged = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_notice_pb').SessionStateChanged;
const SessionVariableChanged = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_notice_pb').SessionVariableChanged;
const Warning = require('../../../../lib/Protocol/Protobuf/Stubs/mysqlx_notice_pb').Warning;
const expect = require('chai').expect;

describe('Protobuf', () => {
    context('Notice', () => {
        context('decodeFrame()', () => {
            it('decodes a Warning frame', () => {
                const type = Frame.Type.WARNING;
                const frame = new Frame();
                frame.setScope(Frame.Scope.LOCAL);
                frame.setType(type);

                const level = Warning.Level.NOTE;
                const warning = new Warning();
                warning.setLevel(level);
                warning.setCode(23);
                warning.setMsg('foo');

                frame.setPayload(warning.serializeBinary());

                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer(frame.serializeBinary());
                /* eslint-disable node/no-deprecated-api */

                expect(Notice.decodeFrame(data)).to.deep.equal({ scope: Frame.Scope.LOCAL, type, warning: { level, code: 23, message: 'foo' } });
            });

            it('decodes a SessionVariableChanged frame', () => {
                const type = Frame.Type.SESSION_VARIABLE_CHANGED;
                const frame = new Frame();
                frame.setScope(Frame.Scope.LOCAL);
                frame.setType(type);

                const scalar = new Scalar();
                scalar.setType(Scalar.Type.V_UINT);
                scalar.setVUnsignedInt(23);

                const warning = new SessionVariableChanged();
                warning.setParam('foo');
                warning.setValue(scalar);

                frame.setPayload(warning.serializeBinary());

                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer(frame.serializeBinary());
                /* eslint-disable node/no-deprecated-api */

                expect(Notice.decodeFrame(data)).to.deep.equal({ scope: Frame.Scope.LOCAL, type, variable: { name: 'foo', value: 23 } });
            });

            it('decodes a SessionStateChanged frame', () => {
                const type = Frame.Type.SESSION_STATE_CHANGED;
                const frame = new Frame();
                frame.setScope(Frame.Scope.LOCAL);
                frame.setType(type);

                const scalar = new Scalar();
                scalar.setType(Scalar.Type.V_UINT);
                scalar.setVUnsignedInt(2);

                const param = SessionStateChanged.Parameter.GENERATED_INSERT_ID;
                const warning = new SessionStateChanged();
                warning.setParam(param);
                warning.addValue(scalar);

                frame.setPayload(warning.serializeBinary());

                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer(frame.serializeBinary());
                /* eslint-disable node/no-deprecated-api */

                expect(Notice.decodeFrame(data)).to.deep.equal({ scope: Frame.Scope.LOCAL, state: { type: param, values: [2] }, type });
            });
        });

        context('decodeWarning()', () => {
            it('decodes a note', () => {
                const level = Warning.Level.NOTE;
                const warning = new Warning();
                warning.setLevel(level);
                warning.setCode(23);
                warning.setMsg('foo');

                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer(warning.serializeBinary());
                /* eslint-enable node/no-deprecated-api */

                expect(Notice.decodeWarning(data)).to.deep.equal({ code: 23, level: level, message: 'foo' });
            });

            it('decodes a server warning', () => {
                const level = Warning.Level.WARNING;
                const warning = new Warning();
                warning.setLevel(level);
                warning.setCode(23);
                warning.setMsg('foo');

                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer(warning.serializeBinary());
                /* eslint-enable node/no-deprecated-api */

                expect(Notice.decodeWarning(data)).to.deep.equal({ code: 23, level: level, message: 'foo' });
            });

            it('decodes a server error', () => {
                const level = Warning.Level.ERROR;
                const warning = new Warning();
                warning.setLevel(level);
                warning.setCode(23);
                warning.setMsg('foo');

                /* eslint-disable node/no-deprecated-api */
                const data = new Buffer(warning.serializeBinary());
                /* eslint-enable node/no-deprecated-api */

                expect(Notice.decodeWarning(data)).to.deep.equal({ code: 23, level: level, message: 'foo' });
            });
        });
    });
});
