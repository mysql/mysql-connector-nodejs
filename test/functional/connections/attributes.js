'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const mysqlx = require('index');
const os = require('os');
const pkg = require('package');
const properties = require('test/properties');

chai.use(chaiAsPromised);

const expect = chai.expect;

const config = Object.assign({}, properties, { schema: undefined });

describe('@functional connection attributes', () => {
    it('should set the default attributes', () => {
        const options = Object.assign({}, config, { });
        const expected = [ '_client_license', '_client_name', '_client_version', '_os', '_pid', '_platform', '_source_host' ];

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

    it('should set the default attributes, even when custom ones are set', () => {
        const options = Object.assign({}, config, { connectionAttributes: { foo: 'bar' } });
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

    it('should send our name, version, license, pid and host', () => {
        const options = Object.assign({}, config, { });
        const expected = [ pkg.license, 'mysql-connector-nodejs', pkg.version, process.pid.toString(), os.hostname() ];

        let actual = [];

        return mysqlx.getSession(options)
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

    it('should not send anything if we turn attributes off', () => {
        const options = Object.assign({}, config, { connectionAttributes: false });
        const expected = [];

        let actual = [];

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

    it('should set custom attributes', () => {
        const options = Object.assign({}, config, { connectionAttributes: { foo: 'bar', baz: 42 } });
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
