'use strict';

/* eslint-env node, mocha */

const config = require('../../../config');
const expect = require('chai').expect;
const mysqlx = require('../../../../');
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
});
