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
    let defaultPersistenceHandler, readFile, writeFile;

    beforeEach('create fakes', () => {
        readFile = td.function();
        writeFile = td.function();

        defaultPersistenceHandler = proxyquire('lib/DevAPI/DefaultPersistenceHandler', {
            '../Adapters/fs': { readFile, writeFile }
        });
    });

    afterEach('reset fakes', () => {
        td.reset();
    });

    context('load()', () => {
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
                process.env.APPDATA = process.env.APPDATA || '%APPDATA%';
                process.env.PROGRAMDATA = process.env.PROGRAMDATA || '%PROGRAMDATA%';

                platform = process.platform;
                Object.defineProperty(process, 'platform', { value: 'win32' });
            });

            beforeEach('set scope variables', () => {
                const filename = 'sessions.json';

                systemConfigFile = path.join(process.env.PROGRAMDATA, 'MySQL', filename);
                userConfigFile = path.join(process.env.APPDATA, 'MySQL', filename);
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

    context('list()', () => {
        it('should return an array containing the names of the available persistent sessions', () => {
            const expected = ['foo', 'bar', 'baz', 'qux'];
            const systemConfig = JSON.stringify({ [expected[0]]: {}, [expected[1]]: {} });
            const userConfig = JSON.stringify({ [expected[2]]: {}, [expected[3]]: {} });

            td.when(readFile(), { ignoreExtraArgs: true }).thenResolve(userConfig);
            td.when(readFile(), { ignoreExtraArgs: true, times: 1 }).thenResolve(systemConfig);

            return expect(defaultPersistenceHandler().list()).to.be.fulfilled
                .then(sessions => expect(sessions).to.deep.equal(expected));
        });

        it('should not return duplicate names', () => {
            const expected = ['foo', 'bar'];
            const systemConfig = JSON.stringify({ [expected[0]]: {} });
            const userConfig = JSON.stringify({ [expected[1]]: {}, [expected[0]]: {} });

            td.when(readFile(), { ignoreExtraArgs: true }).thenResolve(userConfig);
            td.when(readFile(), { ignoreExtraArgs: true, times: 1 }).thenResolve(systemConfig);

            return expect(defaultPersistenceHandler().list()).to.be.fulfilled
                .then(sessions => expect(sessions).to.deep.equal(expected));
        });

        it('should return an empty array if no configuration file exists', () => {
            const error = new Error();
            error.code = 'ENOENT';

            td.when(readFile(), { ignoreExtraArgs: true }).thenReject(error);

            return expect(defaultPersistenceHandler().list()).to.be.fulfilled
                .then(sessions => expect(sessions).to.be.empty);
        });

        it('should return an empty array if the configuration files are empty', () => {
            const config = JSON.stringify({});

            td.when(readFile(), { ignoreExtraArgs: true }).thenResolve(config);

            return expect(defaultPersistenceHandler().list()).to.be.fulfilled
                .then(sessions => expect(sessions).to.be.empty);
        });
    });

    context('save()', () => {
        context('@unix', () => {
            let platform, userConfigFile;

            beforeEach('set environment variables', () => {
                platform = process.platform;
                Object.defineProperty(process, 'platform', { value: 'unix' });
            });

            beforeEach('set scope variables', () => {
                userConfigFile = path.resolve(os.homedir(), '.mysql', 'sessions.json');
            });

            afterEach('reset environment variables', () => {
                Object.defineProperty(process, 'platform', { value: platform });
            });

            context('using the in-memory cache', () => {
                it('should write the session details to the configuration file', () => {
                    const sessionName = 'foobar';
                    const old = { [sessionName]: { appdata: { baz: 'qux' }, uri: 'foo' } };
                    const fresh = { [sessionName]: { appdata: { biz: 'quux' }, uri: 'bar' } };

                    td.when(writeFile(userConfigFile, JSON.stringify(fresh))).thenResolve();

                    const handler = defaultPersistenceHandler({ cache: { user: old } });

                    return expect(handler.save(sessionName, fresh[sessionName])).to.be.fulfilled.then(() => {
                        td.verify(readFile(), { ignoreExtraArgs: true, times: 0 });
                    });
                });
            });

            context('not using the in-memory cache', () => {
                it('should write the session details to the configuration file', () => {
                    const sessionName = 'foobar';
                    const old = { [sessionName]: { appdata: { baz: 'qux' }, uri: 'foo' } };
                    const fresh = { [sessionName]: { appdata: { biz: 'quux' }, uri: 'bar' } };

                    td.when(readFile(userConfigFile)).thenResolve(JSON.stringify(old));
                    td.when(writeFile(userConfigFile, JSON.stringify(fresh))).thenResolve();

                    return expect(defaultPersistenceHandler().save(sessionName, fresh[sessionName])).to.be.fulfilled;
                });
            });
        });

        context('@windows', () => {
            let platform, userConfigFile;

            beforeEach('set environment variables', () => {
                process.env.APPDATA = process.env.APPDATA || '%APPDATA%';

                platform = process.platform;
                Object.defineProperty(process, 'platform', { value: 'win32' });
            });

            beforeEach('set scope variables', () => {
                userConfigFile = path.join(process.env.APPDATA, 'MySQL', 'sessions.json');
            });

            afterEach('reset environment variables', () => {
                Object.defineProperty(process, 'platform', { value: platform });
            });

            context('using the in-memory cache', () => {
                it('should write the session details to the configuration file', () => {
                    const sessionName = 'foobar';
                    const old = { [sessionName]: { appdata: { baz: 'qux' }, uri: 'foo' } };
                    const fresh = { [sessionName]: { appdata: { biz: 'quux' }, uri: 'bar' } };

                    td.when(writeFile(userConfigFile, JSON.stringify(fresh))).thenResolve();

                    const handler = defaultPersistenceHandler({ cache: { user: old } });

                    return expect(handler.save(sessionName, fresh[sessionName])).to.be.fulfilled.then(() => {
                        td.verify(readFile(), { ignoreExtraArgs: true, times: 0 });
                    });
                });
            });

            context('not using the in-memory cache', () => {
                it('should write the session details to the configuration file', () => {
                    const sessionName = 'foobar';
                    const old = { [sessionName]: { appdata: { baz: 'qux' }, uri: 'foo' } };
                    const fresh = { [sessionName]: { appdata: { biz: 'quux' }, uri: 'bar' } };

                    td.when(readFile(userConfigFile)).thenResolve(JSON.stringify(old));
                    td.when(writeFile(userConfigFile, JSON.stringify(fresh))).thenResolve();

                    return expect(defaultPersistenceHandler().save(sessionName, fresh[sessionName])).to.be.fulfilled;
                });
            });
        });
    });

    context('delete()', () => {
        context('@unix', () => {
            let platform, userConfigFile;

            beforeEach('set environment variables', () => {
                platform = process.platform;
                Object.defineProperty(process, 'platform', { value: 'unix' });
            });

            beforeEach('set scope variables', () => {
                userConfigFile = path.resolve(os.homedir(), '.mysql', 'sessions.json');
            });

            afterEach('reset environment variables', () => {
                Object.defineProperty(process, 'platform', { value: platform });
            });

            context('using the in-memory cache', () => {
                it('should remove the session details from the configuration file', () => {
                    const sessionName = 'foobar';
                    const old = { [sessionName]: { appdata: { baz: 'qux' }, uri: 'foo' }, other: { uri: 'quux' } };
                    const fresh = { other: { uri: 'quux' } };

                    td.when(writeFile(userConfigFile, JSON.stringify(fresh))).thenResolve();

                    const handler = defaultPersistenceHandler({ cache: { user: old } });

                    return expect(handler.delete(sessionName)).to.be.fulfilled
                        .then(() => {
                            // console.log(td.explain(writeFile).calls[0].args);
                            td.verify(readFile(), { ignoreExtraArgs: true, times: 0 });
                        });
                });
            });

            context('not using the in-memory cache', () => {
                it('should write the session details to the configuration file', () => {
                    const sessionName = 'foobar';
                    const old = { [sessionName]: { appdata: { baz: 'qux' }, uri: 'foo' }, other: { uri: 'baz' } };
                    const fresh = { other: { uri: 'baz' } };

                    td.when(readFile(userConfigFile)).thenResolve(JSON.stringify(old));
                    td.when(writeFile(userConfigFile, JSON.stringify(fresh))).thenResolve();

                    return expect(defaultPersistenceHandler().delete(sessionName)).to.be.fulfilled;
                });
            });
        });

        context('@windows', () => {
            let platform, userConfigFile;

            beforeEach('set environment variables', () => {
                process.env.APPDATA = process.env.APPDATA || '%APPDATA%';

                platform = process.platform;
                Object.defineProperty(process, 'platform', { value: 'win32' });
            });

            beforeEach('set scope variables', () => {
                userConfigFile = path.join(process.env.APPDATA, 'MySQL', 'sessions.json');
            });

            afterEach('reset environment variables', () => {
                Object.defineProperty(process, 'platform', { value: platform });
            });

            context('using the in-memory cache', () => {
                it('should remove the session details from the configuration file', () => {
                    const sessionName = 'foobar';
                    const old = { [sessionName]: { appdata: { baz: 'qux' }, uri: 'foo' }, other: { uri: 'quux' } };
                    const fresh = { other: { uri: 'quux' } };

                    td.when(writeFile(userConfigFile, JSON.stringify(fresh))).thenResolve();

                    const handler = defaultPersistenceHandler({ cache: { user: old } });

                    return expect(handler.delete(sessionName)).to.be.fulfilled
                        .then(() => {
                            td.verify(readFile(), { ignoreExtraArgs: true, times: 0 });
                        });
                });
            });

            context('not using the in-memory cache', () => {
                it('should write the session details to the configuration file', () => {
                    const sessionName = 'foobar';
                    const old = { [sessionName]: { appdata: { baz: 'qux' }, uri: 'foo' }, other: { uri: 'baz' } };
                    const fresh = { other: { uri: 'baz' } };

                    td.when(readFile(userConfigFile)).thenResolve(JSON.stringify(old));
                    td.when(writeFile(userConfigFile, JSON.stringify(fresh))).thenResolve();

                    return expect(defaultPersistenceHandler().delete(sessionName)).to.be.fulfilled;
                });
            });
        });
    });
});
