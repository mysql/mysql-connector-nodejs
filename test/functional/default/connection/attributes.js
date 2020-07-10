'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');
const tools = require('../../../../lib/Protocol/Util');

describe('connection attributes', () => {
    const baseConfig = { schema: 'performance_schema' };

    it('sets the default attributes using a configuration object', () => {
        const attributesConfig = Object.assign({}, config, baseConfig);
        const expected = ['_client_license', '_client_name', '_client_version', '_os', '_pid', '_platform', '_source_host'];

        return mysqlx.getSession(attributesConfig)
            .then(session => {
                return session.getDefaultSchema()
                    .getTable('session_connect_attrs')
                    .select('JSON_ARRAYAGG(ATTR_NAME)')
                    .where('CONNECTION_ID() = PROCESSLIST_ID')
                    .execute()
                    .then(res => expect(res.fetchOne()[0].sort()).to.deep.equal(expected))
                    .then(() => session.close());
            });
    });

    it('sets the default attributes using a URI', () => {
        const attributesConfig = Object.assign({}, config, baseConfig);
        const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}`;

        const expected = ['_client_license', '_client_name', '_client_version', '_os', '_pid', '_platform', '_source_host'];

        return mysqlx.getSession(uri)
            .then(session => {
                return session.getDefaultSchema()
                    .getTable('session_connect_attrs')
                    .select('JSON_ARRAYAGG(ATTR_NAME)')
                    .where('CONNECTION_ID() = PROCESSLIST_ID')
                    .execute()
                    .then(res => expect(res.fetchOne()[0].sort()).to.deep.equal(expected))
                    .then(() => session.close());
            });
    });

    it('sets the correct values for the default static client-defined attributes', () => {
        const attributesConfig = Object.assign({}, config, baseConfig);
        const expected = tools.getSystemAttributes();

        return mysqlx.getSession(attributesConfig)
            .then(session => {
                return session.getDefaultSchema()
                    .getTable('session_connect_attrs')
                    .select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                    .where('CONNECTION_ID() = PROCESSLIST_ID')
                    .execute()
                    .then(res => expect(res.fetchOne()[0]).to.deep.include(expected))
                    .then(() => session.close());
            });
    });

    it('sets custom attributes using a configuration object', () => {
        const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: { foo: 'bar', baz: 42 } });
        const expected = [['foo', 'bar'], ['baz', '42']];

        return mysqlx.getSession(attributesConfig)
            .then(session => {
                return session.getDefaultSchema()
                    .getTable('session_connect_attrs')
                    .select(['ATTR_NAME', 'ATTR_VALUE'])
                    .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) != "_"')
                    .execute()
                    .then(res => expect(res.fetchAll()).to.deep.equal(expected))
                    .then(() => session.close());
            });
    });

    it('sets custom attributes using a URI', () => {
        const attributesConfig = Object.assign({}, config, baseConfig);
        const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes=[foo=bar,baz=42]`;

        const expected = [['foo', 'bar'], ['baz', '42']];

        return mysqlx.getSession(uri)
            .then(session => {
                return session.getDefaultSchema()
                    .getTable('session_connect_attrs')
                    .select(['ATTR_NAME', 'ATTR_VALUE'])
                    .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) != "_"')
                    .execute()
                    .then(res => expect(res.fetchAll()).to.deep.equal(expected))
                    .then(() => session.close());
            });
    });

    it('sets the default attributes, even when custom ones are set', () => {
        const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: { foo: 'bar' } });
        const expected = [ '_client_license', '_client_name', '_client_version', '_os', '_pid', '_platform', '_source_host', 'foo' ];

        return mysqlx.getSession(attributesConfig)
            .then(session => {
                return session.getDefaultSchema()
                    .getTable('session_connect_attrs')
                    .select('JSON_ARRAYAGG(ATTR_NAME)')
                    .where('CONNECTION_ID() = PROCESSLIST_ID')
                    .execute()
                    .then(res => expect(res.fetchOne()[0].sort()).to.deep.equal(expected))
                    .then(() => session.close());
            });
    });

    context('disabling the connection attributes', () => {
        it('does not send anything while connecting with a configuration object', () => {
            const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: false });

            return mysqlx.getSession(attributesConfig)
                .then(session => {
                    return session.getDefaultSchema()
                        .getTable('session_connect_attrs')
                        .select('ATTR_NAME')
                        .where('CONNECTION_ID() = PROCESSLIST_ID')
                        .execute()
                        .then(res => expect(res.fetchOne()).to.not.exist)
                        .then(() => session.close());
                });
        });

        it('does not send anything while connecting with a URI', () => {
            const attributesConfig = Object.assign({}, config, baseConfig);
            const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes=false`;

            return mysqlx.getSession(uri)
                .then(session => {
                    return session.getDefaultSchema()
                        .getTable('session_connect_attrs')
                        .select('ATTR_NAME')
                        .where('CONNECTION_ID() = PROCESSLIST_ID')
                        .execute()
                        .then(res => expect(res.fetchOne()).to.not.exist)
                        .then(() => session.close());
                });
        });
    });

    context('when debug mode is enabled', () => {
        it('logs the connection attributes sent to the server', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');
            const defaultAttributes = tools.getSystemAttributes();

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Connection.CapabilitiesSet', script)
                .then(proc => {
                    // using TCP by omission will result in more CapabilitiesSet messages for enabling TLS
                    expect(proc.logs).to.have.length.above(0);
                    // for now, the message that sets connection attributes is the last one
                    expect(proc.logs[proc.logs.length - 1]).to.contain.keys('capabilities');
                    expect(proc.logs[proc.logs.length - 1].capabilities).to.contain.keys('capabilities');
                    expect(proc.logs[proc.logs.length - 1].capabilities.capabilities).to.be.an('array').and.have.lengthOf(1);

                    const connectionAttributes = proc.logs[proc.logs.length - 1].capabilities.capabilities[0];

                    expect(connectionAttributes.name).to.equal('session_connect_attrs');
                    expect(connectionAttributes.value).to.contain.keys('obj');
                    expect(connectionAttributes.value.obj).to.contain.keys('fld');

                    const fields = connectionAttributes.value.obj.fld;

                    expect(connectionAttributes.value.obj.fld).to.be.an('array').to.have.lengthOf(7);

                    fields.forEach(field => {
                        expect(field).to.contain.keys('key', 'value');
                        expect(field.value).to.contain.keys('scalar');
                        expect(field.value.scalar).to.contain.keys('v_string');
                        expect(field.value.scalar.v_string).to.contain.keys('value');
                    });

                    // The connection is created by the child process, which means
                    // the _pid value in the connection attributes should be replaced
                    defaultAttributes._pid = `${proc.id}`;

                    expect(fields.map(field => field.key)).to.deep.equal(Object.keys(defaultAttributes));
                    expect(fields.map(field => field.value.scalar.v_string.value)).to.deep.equal(Object.keys(defaultAttributes).map(k => defaultAttributes[k]));
                });
        });
    });
});
