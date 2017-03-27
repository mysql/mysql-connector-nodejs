'use strict';

/* eslint-env node, mocha */

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const os = require('os');
const path = require('path');
const proxyquire = require('proxyquire');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('DefaultPersistenceHandler', () => {
    let defaultPersistenceHandler;

    context('load()', () => {
        let readFile;

        beforeEach('create fakes', () => {
            readFile = td.function();
            defaultPersistenceHandler = proxyquire('lib/DevAPI/DefaultPersistenceHandler', {
                '../Adapters/fs': { readFile }
            });
        });

        afterEach('reset fakes', () => {
            td.reset();
        });

        context('@unix', () => {
            let platform, systemConfigFile, userConfigFile;

            beforeEach('set environment variables', () => {
                platform = process.platform;
                Object.defineProperty(process, 'platform', { value: 'unix' });
            });

            beforeEach('set scope variables', () => {
                const filename = 'sessions.json';

                systemConfigFile = path.resolve('/', 'etc', 'mysql', filename);
                userConfigFile = path.resolve(os.homedir(), '.mysql', filename);
            });

            afterEach('reset environment variables', () => {
                Object.defineProperty(process, 'platform', { value: platform });
            });

            it('should override system configuration details with matching user configuration details', () => {
                const systemConfig = { foo: 'bar' };
                const userConfig = { foo: 'baz' };
                const sessionName = 'qux';

                td.when(readFile(userConfigFile)).thenResolve(JSON.stringify({ [sessionName]: userConfig }));
                td.when(readFile(systemConfigFile), { times: 1 }).thenResolve(JSON.stringify({ [sessionName]: systemConfig }));

                return expect(defaultPersistenceHandler().load(sessionName)).to.be.fulfilled.then(result => {
                    expect(result).to.deep.equal(userConfig);
                });
            });

            it('should return the system configuration if no user configuration exists for a given session', () => {
                const config = { foo: 'bar' };
                const sessionName = 'qux';

                const error = new Error();
                error.code = 'ENOENT';

                td.when(readFile(userConfigFile)).thenReject(error);
                td.when(readFile(systemConfigFile), { times: 1 }).thenResolve(JSON.stringify({ [sessionName]: config }));

                return expect(defaultPersistenceHandler().load(sessionName)).to.be.fulfilled.then(result => {
                    expect(result).to.deep.equal(config);
                });
            });

            it('should return the user configuration if no system configuration exists for a given session', () => {
                const config = { foo: 'bar' };
                const sessionName = 'qux';

                const error = new Error();
                error.code = 'ENOENT';

                td.when(readFile(userConfigFile)).thenResolve(JSON.stringify({ [sessionName]: config }));
                td.when(readFile(systemConfigFile), { times: 1 }).thenReject(error);

                return expect(defaultPersistenceHandler().load(sessionName)).to.be.fulfilled.then(result => {
                    expect(result).to.deep.equal(config);
                });
            });
        });

        context('@windows', () => {
            let platform, systemConfigFile, userConfigFile;

            beforeEach('set environment variables', () => {
                platform = process.platform;
                Object.defineProperty(process, 'platform', { value: 'win32' });
            });

            beforeEach('set scope variables', () => {
                const filename = 'sessions.json';

                systemConfigFile = path.resolve(os.homedir(), 'PROGRAMDATA', 'MySQL', filename);
                userConfigFile = path.resolve(os.homedir(), 'APPDATA', 'MySQL', filename);
            });

            afterEach('reset environment variables', () => {
                Object.defineProperty(process, 'platform', { value: platform });
            });

            it('should override system configuration details with matching user configuration details', () => {
                const systemConfig = { foo: 'bar' };
                const userConfig = { foo: 'baz' };
                const sessionName = 'qux';

                td.when(readFile(userConfigFile)).thenResolve(JSON.stringify({ [sessionName]: userConfig }));
                td.when(readFile(systemConfigFile), { times: 1 }).thenResolve(JSON.stringify({ [sessionName]: systemConfig }));

                return expect(defaultPersistenceHandler().load(sessionName)).to.be.fulfilled.then(result => {
                    expect(result).to.deep.equal(userConfig);
                });
            });

            it('should return the system configuration if no user configuration exists for a given session', () => {
                const config = { foo: 'bar' };
                const sessionName = 'qux';

                const error = new Error();
                error.code = 'ENOENT';

                td.when(readFile(userConfigFile)).thenReject(error);
                td.when(readFile(systemConfigFile), { times: 1 }).thenResolve(JSON.stringify({ [sessionName]: config }));

                return expect(defaultPersistenceHandler().load(sessionName)).to.be.fulfilled.then(result => {
                    expect(result).to.deep.equal(config);
                });
            });

            it('should return the user configuration if no system configuration exists for a given session', () => {
                const config = { foo: 'bar' };
                const sessionName = 'qux';

                const error = new Error();
                error.code = 'ENOENT';

                td.when(readFile(userConfigFile)).thenResolve(JSON.stringify({ [sessionName]: config }));
                td.when(readFile(systemConfigFile), { times: 1 }).thenReject(error);

                return expect(defaultPersistenceHandler().load(sessionName)).to.be.fulfilled.then(result => {
                    expect(result).to.deep.equal(config);
                });
            });
        });

        it('should fail if no configuration file exists', () => {
            const error = new Error();
            error.code = 'ENOENT';

            td.when(readFile(), { ignoreExtraArgs: true }).thenReject(error);

            return expect(defaultPersistenceHandler().load('foo')).to.be.rejectedWith('No details are available for the given session');
        });

        it('should fail if the session details are not available in any of the configuration files', () => {
            td.when(readFile(), { ignoreExtraArgs: true }).thenResolve(JSON.stringify({}));

            return expect(defaultPersistenceHandler().load('foo')).to.be.rejectedWith('No details are available for the given session');
        });

        it('should fail if any configuration file contains invalid JSON', () => {
            td.when(readFile(), { ignoreExtraArgs: true }).thenResolve('foo');

            return expect(defaultPersistenceHandler().load('foo')).to.be.rejected;
        });
    });
});
