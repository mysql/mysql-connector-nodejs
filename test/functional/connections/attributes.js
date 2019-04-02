'use strict';

/* eslint-env node, mocha */

const config = require('../../properties');
const expect = require('chai').expect;
const mysqlx = require('../../../');
const os = require('os');
const pkg = require('../../../package.json');

describe('connection attributes', () => {
    const schemalessConfig = Object.assign({}, config, { schema: undefined });

    it('sets the default attributes', () => {
        const expected = [ '_client_license', '_client_name', '_client_version', '_os', '_pid', '_platform', '_source_host' ];
        const actual = [];

        return mysqlx.getSession(schemalessConfig)
            .then(session => {
                return session
                    .getSchema('performance_schema')
                    .getTable('session_connect_attrs')
                    .select(['ATTR_NAME'])
                    .where('CONNECTION_ID() = PROCESSLIST_ID')
                    .orderBy('ATTR_NAME')
                    .execute(attribute => {
                        actual.push(attribute[0]);
                    })
                    .then(() => {
                        return expect(actual).to.deep.equal(expected);
                    })
                    .then(() => {
                        return session.close();
                    });
            });
    });

    it('sets the default attributes, even when custom ones are set', () => {
        const options = Object.assign({}, schemalessConfig, { connectionAttributes: { foo: 'bar' } });
        const expected = [ '_client_license', '_client_name', '_client_version', '_os', '_pid', '_platform', '_source_host', 'foo' ];

        let actual = [];

        return mysqlx.getSession(options)
            .then(session => {
                return session
                    .getSchema('performance_schema')
                    .getTable('session_connect_attrs')
                    .select(['ATTR_NAME'])
                    .where('CONNECTION_ID() = PROCESSLIST_ID')
                    .orderBy('ATTR_NAME')
                    .execute(attribute => {
                        actual.push(attribute[0]);
                    })
                    .then(() => {
                        return expect(actual).to.deep.equal(expected);
                    })
                    .then(() => {
                        return session.close();
                    });
            });
    });

    it('sends our name, version, license, pid and host', () => {
        const expected = [ pkg.license, 'mysql-connector-nodejs', pkg.version, process.pid.toString(), os.hostname() ];
        const actual = [];

        return mysqlx.getSession(schemalessConfig)
            .then(session => {
                return session
                    .getSchema('performance_schema')
                    .getTable('session_connect_attrs')
                    .select(['ATTR_VALUE'])
                    .where('CONNECTION_ID() = PROCESSLIST_ID AND ATTR_NAME IN ("_client_license", "_client_name", "_client_version", "_pid", "_source_host")')
                    .orderBy('ATTR_NAME')
                    .execute(attribute => {
                        actual.push(attribute[0]);
                    })
                    .then(() => {
                        return expect(actual).to.deep.equal(expected);
                    })
                    .then(() => {
                        return session.close();
                    });
            });
    });

    it('does not send anything if we turn attributes off', () => {
        const options = Object.assign({}, schemalessConfig, { connectionAttributes: false });
        const expected = [];
        const actual = [];

        return mysqlx.getSession(options)
            .then(session => {
                return session
                    .getSchema('performance_schema')
                    .getTable('session_connect_attrs')
                    .select(['ATTR_NAME'])
                    .where('CONNECTION_ID() = PROCESSLIST_ID')
                    .execute(attribute => {
                        actual.push(attribute[0]);
                    })
                    .then(() => {
                        return expect(actual).to.deep.equal(expected);
                    })
                    .then(() => {
                        return session.close();
                    });
            });
    });

    it('sets custom attributes', () => {
        const options = Object.assign({}, schemalessConfig, { connectionAttributes: { foo: 'bar', baz: 42 } });
        const expected = { foo: 'bar', baz: '42' };

        let actual = {};

        return mysqlx.getSession(options)
            .then(session => {
                return session
                    .getSchema('performance_schema')
                    .getTable('session_connect_attrs')
                    .select(['ATTR_NAME', 'ATTR_VALUE'])
                    .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) != "_"')
                    .execute(attribute => {
                        actual[attribute[0]] = attribute[1];
                    })
                    .then(() => {
                        return expect(actual).to.deep.equal(expected);
                    })
                    .then(() => {
                        return session.close();
                    });
            });
    });
});
