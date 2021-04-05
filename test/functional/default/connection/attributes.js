/*
 * Copyright (c) 2020, 2021, Oracle and/or its affiliates.
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

const config = require('../../../config');
const errors = require('../../../../lib/constants/errors');
const expect = require('chai').expect;
const fixtures = require('../../../fixtures');
const mysqlx = require('../../../../');
const path = require('path');
const pkg = require('../../../../lib/package');
const qs = require('querystring');
const system = require('../../../../lib/system');

describe('connection attributes', () => {
    const baseConfig = { schema: 'performance_schema' };
    const defaultAttributes = {
        _pid: system.pid(),
        _platform: system.platform(),
        _os: system.brand(),
        _source_host: system.hostname(),
        _client_name: pkg.name(),
        _client_version: pkg.version(),
        _client_license: pkg.license()
    };

    context('connecting with the default options', () => {
        context('using a configuration object', () => {
            it('sets the default client attributes when there are no connection attributes specified', () => {
                const attributesConfig = Object.assign({}, config, baseConfig);

                return mysqlx.getSession(attributesConfig)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('sets the default client attributes when there the connection attributes are an empty object', () => {
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: {} });

                return mysqlx.getSession(attributesConfig)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('sets the default client attributes when there the connection attributes are not defined', () => {
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: undefined });

                return mysqlx.getSession(attributesConfig)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('sets the default client attributes when there the connection attributes are true', () => {
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: true });

                return mysqlx.getSession(attributesConfig)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });
        });

        context('using a connection string', () => {
            it('sets the default client attributes when the connection attributes option does not exist', () => {
                const attributesConfig = Object.assign({}, config, baseConfig);
                const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('sets the default client attributes when the connection attributes option is not assigned a value', () => {
                const attributesConfig = Object.assign({}, config, baseConfig);
                const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('sets the default client attributes when the connection attributes option value is true', () => {
                const attributesConfig = Object.assign({}, config, baseConfig);
                const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes=true`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('sets the default client attributes when the connection attributes option is an empty list', () => {
                const attributesConfig = Object.assign({}, config, baseConfig);
                const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes=[]`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });
        });
    });

    context('connecting with custom application attributes', () => {
        context('using a configuration object', () => {
            it('sets the default client attributes', () => {
                const attributesConfig = Object.assign({}, config, baseConfig);

                return mysqlx.getSession(attributesConfig)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) = "_"')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('sets additional textual attributes', () => {
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: { foo: 'bar' } });

                return mysqlx.getSession(attributesConfig)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) != "_"')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal({ foo: 'bar' });
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('coerces additional non-textual attributes', () => {
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: { foo: 2, bar: ['baz', ['qux']], quux: { quuz: 'corge' } } });

                return mysqlx.getSession(attributesConfig)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) != "_"')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal({ foo: '2', bar: '["baz","[\\"qux\\"]"]', quux: '{"quuz":"corge"}' });
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('coerces null, undefined and empty strings', () => {
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: { foo: null, bar: undefined, baz: '' } });

                return mysqlx.getSession(attributesConfig)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) != "_"')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal({ foo: null, bar: null, baz: null });
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('fails to connect if the connection attributes are specified with an invalid type', () => {
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: 'foo' });

                return mysqlx.getSession(attributesConfig)
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
                    });
            });

            it('fails to connect if the additional attributes use the same naming convention as the default client attributes', () => {
                const customAttributes = { _foo: 'bar', _baz: 42 };
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: customAttributes });

                return mysqlx.getSession(attributesConfig)
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTE_NAME);
                    });
            });
        });

        context('using a connection string', () => {
            it('sets the default client attributes', () => {
                const attributesConfig = Object.assign({}, config, baseConfig);
                const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) = "_"')
                            .execute()
                            .then(res => {
                                return expect(res.fetchOne()[0]).to.deep.equal(defaultAttributes);
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('sets empty attributes', () => {
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: ['foo', 'bar='] });
                const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes=[${attributesConfig.connectionAttributes.join(',')}]`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) != "_"')
                            .execute()
                            .then(res => {
                                // connection attribute values are always stringified
                                return expect(res.fetchOne()[0]).to.deep.equal({ foo: null, bar: null });
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('sets non-empty attributes', () => {
                const customAttributes = { foo: 'bar', baz: 42 };
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: customAttributes });
                const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes=[${qs.stringify(attributesConfig.connectionAttributes, ',')}]`;

                return mysqlx.getSession(uri)
                    .then(session => {
                        const table = session.getDefaultSchema().getTable('session_connect_attrs');

                        return table.select('JSON_OBJECTAGG(ATTR_NAME, ATTR_VALUE)')
                            .where('CONNECTION_ID() = PROCESSLIST_ID AND SUBSTRING(ATTR_NAME, 1, 1) != "_"')
                            .execute()
                            .then(res => {
                                // connection attribute values are always stringified
                                return expect(res.fetchOne()[0]).to.deep.equal({ foo: 'bar', baz: '42' });
                            })
                            .then(() => {
                                return session.close();
                            });
                    });
            });

            it('fails to connect if the connection attributes are specified with an invalid type', () => {
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: 'foo' });
                const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes=${attributesConfig.connectionAttributes}`;

                return mysqlx.getSession(uri)
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTES_DEFINITION);
                    });
            });

            it('fails to connect if the additional attributes use the same naming convention as the default client attributes', () => {
                const customAttributes = { _foo: 'bar', _baz: 42 };
                const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: customAttributes });
                const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes=[${qs.stringify(attributesConfig.connectionAttributes, ',')}]`;

                return mysqlx.getSession(uri)
                    .then(() => {
                        return expect.fail();
                    })
                    .catch(err => {
                        return expect(err.message).to.equal(errors.MESSAGES.ER_DEVAPI_BAD_SESSION_ATTRIBUTE_NAME);
                    });
            });
        });
    });

    context('disabling the connection attributes', () => {
        it('does not set any attribute with a configuration object', () => {
            const attributesConfig = Object.assign({}, config, baseConfig, { connectionAttributes: false });

            return mysqlx.getSession(attributesConfig)
                .then(session => {
                    const table = session.getDefaultSchema().getTable('session_connect_attrs');

                    return table.select('ATTR_NAME')
                        .where('CONNECTION_ID() = PROCESSLIST_ID')
                        .execute()
                        .then(res => {
                            return expect(res.fetchOne()).to.not.exist;
                        })
                        .then(() => {
                            return session.close();
                        });
                });
        });

        it('does not set any attribute with a connection string', () => {
            const attributesConfig = Object.assign({}, config, baseConfig);
            const uri = `mysqlx://${attributesConfig.user}:${attributesConfig.password}@${attributesConfig.host}:${attributesConfig.port}/${attributesConfig.schema}?connection-attributes=false`;

            return mysqlx.getSession(uri)
                .then(session => {
                    const table = session.getDefaultSchema().getTable('session_connect_attrs');

                    return table.select('ATTR_NAME')
                        .where('CONNECTION_ID() = PROCESSLIST_ID')
                        .execute()
                        .then(res => {
                            return expect(res.fetchOne()).to.not.exist;
                        })
                        .then(() => {
                            return session.close();
                        });
                });
        });
    });

    context('when debug mode is enabled', () => {
        it('logs the connection attributes sent to the server', () => {
            const script = path.join(__dirname, '..', '..', '..', 'fixtures', 'scripts', 'connection', 'default.js');

            return fixtures.collectLogs('protocol:outbound:Mysqlx.Connection.CapabilitiesSet', script)
                .then(proc => {
                    expect(proc.logs).to.have.lengthOf(1);
                    expect(proc.logs[0]).to.contain.keys('capabilities');
                    expect(proc.logs[0].capabilities).to.contain.keys('capabilities');
                    expect(proc.logs[0].capabilities.capabilities).to.be.an('array').and.have.length.below(3);

                    // The capability should be the second in the list (capabilities[1]).
                    const connectionAttributes = proc.logs[0].capabilities.capabilities[1];

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
