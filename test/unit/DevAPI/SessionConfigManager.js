'use strict';

/* eslint-env node, mocha */

const configManager = require('lib/DevAPI/SessionConfigManager');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const parseUri = require('lib/DevAPI/Util/URIParser');
const sessionConfig = require('lib/DevAPI/SessionConfig');
const td = require('testdouble');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('SessionConfigManager', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('get()', () => {
        let load;

        beforeEach('create fakes', () => {
            load = td.function();
        });

        context('without a registered password handler', () => {
            it('should return the configuration object of a given session', () => {
                const sessionName = 'foo';
                const uri = 'mysqlx://bar';

                td.when(load(sessionName)).thenResolve({ uri });

                const config = configManager().setPersistenceHandler({ load });

                return expect(config.get(sessionName)).to.be.fulfilled
                    .then(session => {
                        expect(session.getName()).to.equal(sessionName);
                        expect(session.getUri()).to.equal(uri);
                    });
            });
        });

        context('with a registered password handler', () => {
            it('should return the configuration object of a given session', () => {
                const address = 'baz:qux';
                const sessionName = 'foo';
                const username = 'bar';
                const password = 'quux';

                td.when(load(username, address)).thenResolve(password);
                td.when(load(sessionName), { times: 1 }).thenResolve({ uri: `mysqlx://${username}@${address}` });

                const config = configManager().setPersistenceHandler({ load }).setPasswordHandler({ load });

                return expect(config.get(sessionName)).to.be.fulfilled
                    .then(session => {
                        expect(session.getName()).to.equal(sessionName);
                        expect(session.getUri()).to.equal(`mysqlx://${username}:${password}@${address}`);
                        expect(parseUri(session.getUri()).dbPassword).to.equal(password);
                    });
            });

            it('should use the default port to identify the service when the URI does not contain it', () => {
                const host = 'baz';
                const address = `${host}:33060`;
                const sessionName = 'foo';
                const username = 'bar';
                const password = 'qux';

                td.when(load(username, address)).thenResolve(password);
                td.when(load(sessionName), { times: 1 }).thenResolve({ uri: `mysqlx://${username}@${host}` });

                const config = configManager().setPersistenceHandler({ load }).setPasswordHandler({ load });

                return expect(config.get(sessionName)).to.be.fulfilled
                    .then(session => {
                        expect(session.getName()).to.equal(sessionName);
                        expect(session.getUri()).to.equal(`mysqlx://${username}:${password}@${host}`);
                        expect(parseUri(session.getUri()).dbPassword).to.equal(password);
                    });
            });

            it('should not retrieve password from handler if no user is provided', () => {
                const uri = 'mysqlx://baz:qux';
                const sessionName = 'foo';

                td.when(load(sessionName), { times: 1 }).thenResolve({ uri });

                const config = configManager().setPersistenceHandler({ load }).setPasswordHandler({ load });

                return expect(config.get(sessionName)).to.be.fulfilled
                    .then(session => {
                        expect(td.explain(load).callCount).to.equal(1);
                        expect(session.getName()).to.equal(sessionName);
                        expect(session.getUri()).to.equal(uri);
                        expect(parseUri(session.getUri()).dbPassword).to.not.exist;
                    });
            });

            it('should not retrieve password from handler for password less users', () => {
                const uri = 'mysqlx://bar:@baz:qux';
                const sessionName = 'foo';

                td.when(load(sessionName), { times: 1 }).thenResolve({ uri });

                const config = configManager().setPersistenceHandler({ load }).setPasswordHandler({ load });

                return expect(config.get(sessionName)).to.be.fulfilled
                    .then(session => {
                        expect(td.explain(load).callCount).to.equal(1);
                        expect(session.getName()).to.equal(sessionName);
                        expect(session.getUri()).to.equal(uri);
                        expect(parseUri(session.getUri()).dbPassword).to.equal('');
                    });
            });
        });

        it('should return a configuration object containing application-specific data', () => {
            const sessionName = 'foo';
            const appdata = { bar: 'baz' };

            td.when(load(sessionName)).thenResolve({ appdata });

            const config = configManager().setPersistenceHandler({ load });

            return expect(config.get(sessionName)).to.be.fulfilled
                .then(session => {
                    expect(session.getAppData('bar')).to.equal('baz');
                });
        });

        it('should fail if no IPersistenceHandler implementation is available', () => {
            const config = configManager().setPersistenceHandler(undefined);

            return expect(config.get('foo')).to.be.rejectedWith('No IPersistenceHandler implementation available');
        });
    });

    context('list()', () => {
        let list;

        beforeEach('create fakes', () => {
            list = td.function();
        });

        it('should return an array containing the names of the available persistent sessions', () => {
            const expected = ['foo', 'bar'];

            td.when(list()).thenResolve(expected);

            const config = configManager().setPersistenceHandler({ list });

            return expect(config.list()).to.be.fulfilled
                .then(sessions => {
                    expect(sessions).to.deep.equal(expected);
                });
        });

        it('should fail if no IPersistenceHandler implementation is available', () => {
            const config = configManager().setPersistenceHandler(undefined);

            return expect(config.list()).to.be.rejectedWith('No IPersistenceHandler implementation available');
        });
    });

    context('save()', () => {
        let save;

        beforeEach('create fakes', () => {
            save = td.function();
        });

        context('using an object-based configuration', () => {
            it('should return the persistent session config that was saved', () => {
                const sessionName = 'foo';
                const host = 'bar';

                td.when(save(sessionName, { uri: `mysqlx://${host}?ssl-mode=DISABLED`, appdata: { baz: 'qux' } })).thenResolve();

                const config = configManager().setPersistenceHandler({ save });

                return expect(config.save(sessionName, { host, baz: 'qux', ssl: false })).to.be.fulfilled.then(result => {
                    expect(result.getUri()).to.equal(`mysqlx://${host}?ssl-mode=DISABLED`);
                    expect(result.getAppData('baz')).to.equal('qux');
                });
            });

            it('should not pass any user password to the IPersistenceHandler implementation', () => {
                const sessionName = 'foo';
                const host = 'bar';
                const dbUser = 'baz';
                const dbPassword = 'qux';

                td.when(save(sessionName, { uri: `mysqlx://${dbUser}@${host}`, appdata: {} })).thenResolve();

                const config = configManager();
                config.setPersistenceHandler({ save });

                return expect(config.save(sessionName, { dbPassword, dbUser, host })).to.be.fulfilled.then(result => {
                    expect(result.getUri()).to.equal(`mysqlx://${dbUser}:${dbPassword}@${host}`);
                });
            });

            it('should use an IPasswordHandler implementation to store the password if one is available', () => {
                const sessionName = 'foo';
                const host = 'bar';
                const port = 33060;
                const dbUser = 'baz';
                const dbPassword = 'qux';
                const address = `${host}:${port}`;

                td.when(save(dbUser, address, dbPassword)).thenResolve();
                td.when(save(sessionName, { uri: `mysqlx://${dbUser}@${address}`, appdata: {} }), { times: 1 }).thenResolve();

                const config = configManager().setPersistenceHandler({ save }).setPasswordHandler({ save });

                return expect(config.save(sessionName, { dbPassword, dbUser, host, port, ssl: true })).to.be.fulfilled
                    .then(result => {
                        expect(td.explain(save).callCount).to.equal(2);
                        expect(result.getUri()).to.equal(`mysqlx://${dbUser}:${dbPassword}@${address}`);
                    });
            });

            it('should not use an existing IPasswordHandler implementation if no password is provided', () => {
                const sessionName = 'foo';
                const host = 'bar';

                td.when(save(sessionName, { uri: `mysqlx://${host}?ssl-mode=DISABLED`, appdata: {} }), { times: 1 }).thenResolve();

                const config = configManager().setPersistenceHandler({ save }).setPasswordHandler({ save });

                return expect(config.save(sessionName, { host, ssl: false })).to.be.fulfilled
                    .then(result => {
                        expect(td.explain(save).callCount).to.equal(1);
                        expect(result.getUri()).to.equal(`mysqlx://${host}?ssl-mode=DISABLED`);
                    });
            });
        });

        context('using a JSON-based configuration', () => {
            it('should return the persistent session config that was saved', () => {
                const sessionName = 'foo';
                const host = 'bar';

                td.when(save(sessionName, { uri: `mysqlx://${host}?ssl-mode=DISABLED`, appdata: { baz: 'qux' } })).thenResolve();

                const config = configManager().setPersistenceHandler({ save });
                const json = JSON.stringify({ host, baz: 'qux', ssl: false });

                return expect(config.save(sessionName, json)).to.be.fulfilled
                    .then(result => {
                        expect(result.getUri()).to.equal(`mysqlx://${host}?ssl-mode=DISABLED`);
                        expect(result.getAppData('baz')).to.equal('qux');
                    });
            });

            it('should not pass any user password to the IPersistenceHandler implementation', () => {
                const sessionName = 'foo';
                const host = 'bar';
                const dbUser = 'baz';
                const dbPassword = 'qux';

                td.when(save(sessionName, { uri: `mysqlx://${dbUser}@${host}`, appdata: {} })).thenResolve();

                const config = configManager().setPersistenceHandler({ save });
                const json = JSON.stringify({ dbPassword, dbUser, host, ssl: true });

                return expect(config.save(sessionName, json)).to.be.fulfilled
                    .then(result => {
                        expect(result.getUri()).to.equal(`mysqlx://${dbUser}:${dbPassword}@${host}`);
                    });
            });

            it('should use an IPasswordHandler implementation to store the password if one is available', () => {
                const sessionName = 'foo';
                const host = 'bar';
                const port = 33060;
                const dbUser = 'baz';
                const dbPassword = 'qux';
                const address = `${host}:${port}`;

                td.when(save(dbUser, address, dbPassword)).thenResolve();
                td.when(save(sessionName, { uri: `mysqlx://${dbUser}@${address}`, appdata: {} }), { times: 1 }).thenResolve();

                const config = configManager().setPersistenceHandler({ save }).setPasswordHandler({ save });
                const json = JSON.stringify({ dbPassword, dbUser, host, port, ssl: true });

                return expect(config.save(sessionName, json)).to.be.fulfilled
                    .then(result => {
                        expect(td.explain(save).callCount).to.equal(2);
                        expect(result.getUri()).to.equal(`mysqlx://${dbUser}:${dbPassword}@${address}`);
                    });
            });

            it('should not use an existing IPasswordHandler implementation if no password is provided', () => {
                const sessionName = 'foo';
                const host = 'bar';

                td.when(save(sessionName, { uri: `mysqlx://${host}?ssl-mode=DISABLED`, appdata: {} }), { times: 1 }).thenResolve();

                const config = configManager().setPersistenceHandler({ save }).setPasswordHandler({ save });
                const json = JSON.stringify({ host, ssl: false });

                return expect(config.save(sessionName, json)).to.be.fulfilled
                    .then(result => {
                        expect(td.explain(save).callCount).to.equal(1);
                        expect(result.getUri()).to.equal(`mysqlx://${host}?ssl-mode=DISABLED`);
                    });
            });
        });

        context('using an URI', () => {
            it('should return the persistent session config that was saved', () => {
                const sessionName = 'foo';
                const uri = 'mysqlx://bar';

                td.when(save(sessionName, { uri, appdata: {} })).thenResolve();

                const config = configManager().setPersistenceHandler({ save });

                return expect(config.save(sessionName, uri)).to.be.fulfilled
                    .then(result => {
                        expect(result.getUri()).to.equal(uri);
                    });
            });

            it('should additionally support an appdata object', () => {
                const sessionName = 'foo';
                const uri = 'mysqlx://bar';
                const appdata = { baz: 'qux' };

                td.when(save(sessionName, { uri, appdata })).thenResolve();

                const config = configManager().setPersistenceHandler({ save });

                return expect(config.save(sessionName, uri, appdata)).to.be.fulfilled
                    .then(result => {
                        expect(result.getUri()).to.equal(uri);
                        expect(result.getAppData('baz')).to.equal('qux');
                    });
            });

            it('should additionally support an appdata JSON string', () => {
                const sessionName = 'foo';
                const uri = 'mysqlx://bar';
                const appdata = { baz: 'qux' };

                td.when(save(sessionName, { uri, appdata })).thenResolve();

                const config = configManager().setPersistenceHandler({ save });
                const json = JSON.stringify(appdata);

                return expect(config.save(sessionName, uri, json)).to.be.fulfilled
                    .then(result => {
                        expect(result.getUri()).to.equal(uri);
                        expect(result.getAppData('baz')).to.equal('qux');
                    });
            });

            it('should not pass any user password to the IPersistenceHandler implementation', () => {
                const sessionName = 'foo';
                const passwordUri = 'mysqlx://bar:baz@qux';

                td.when(save(sessionName, { uri: 'mysqlx://bar@qux', appdata: {} })).thenResolve();

                const config = configManager().setPersistenceHandler({ save });

                return expect(config.save(sessionName, passwordUri)).to.be.fulfilled
                    .then(result => {
                        expect(result.getUri()).to.equal(passwordUri);
                    });
            });

            it('should use an IPasswordHandler implementation to store the password if one is available', () => {
                const sessionName = 'foo';
                const address = 'bar:33060';
                const dbUser = 'baz';
                const dbPassword = 'qux';
                const uri = `mysqlx://${dbUser}:${dbPassword}@${address}`;

                td.when(save(dbUser, address, dbPassword)).thenResolve();
                td.when(save(sessionName, { uri: `mysqlx://${dbUser}@${address}`, appdata: {} }), { times: 1 }).thenResolve();

                const config = configManager().setPersistenceHandler({ save }).setPasswordHandler({ save });

                return expect(config.save(sessionName, uri)).to.be.fulfilled
                    .then(result => {
                        expect(td.explain(save).callCount).to.equal(2);
                        expect(result.getUri()).to.equal(uri);
                    });
            });

            it('should not use an existing IPasswordHandler implementation if no password is provided', () => {
                const sessionName = 'foo';
                const uri = 'mysqlx://bar';

                td.when(save(sessionName, { uri, appdata: {} }), { times: 1 }).thenResolve();

                const config = configManager().setPersistenceHandler({ save }).setPasswordHandler({ save });

                return expect(config.save(sessionName, uri)).to.be.fulfilled
                    .then(result => {
                        expect(td.explain(save).callCount).to.equal(1);
                        expect(result.getUri()).to.equal(uri);
                    });
            });

            it('should not use an existing IPasswordHandler implementation if the user does not have a password', () => {
                const sessionName = 'foo';
                const uri = 'mysqlx://bar:@baz';

                td.when(save(sessionName, { uri: 'mysqlx://bar@baz', appdata: {} }), { times: 1 }).thenResolve();

                const config = configManager().setPersistenceHandler({ save }).setPasswordHandler({ save });

                return expect(config.save(sessionName, uri)).to.be.fulfilled
                    .then(result => {
                        expect(td.explain(save).callCount).to.equal(1);
                        expect(result.getUri()).to.equal(uri);
                    });
            });
        });

        context('using a persistent session configuration instance', () => {
            it('should return the persistent session config that was saved', () => {
                const sessionName = 'foo';
                const uri = 'mysqlx://bar';

                td.when(save(sessionName, { uri, appdata: { baz: 'qux' } })).thenResolve();

                const session = sessionConfig(sessionName, uri).setAppData('baz', 'qux');
                const config = configManager().setPersistenceHandler({ save });

                return expect(config.save(session)).to.be.fulfilled
                    .then(result => {
                        expect(result.getUri()).to.equal(uri);
                        expect(result.getAppData('baz')).to.equal('qux');
                    });
            });

            it('should not pass any user password to the IPersistenceHandler implementation', () => {
                const sessionName = 'foo';
                const host = 'bar';
                const dbUser = 'baz';
                const uri = `mysqlx://${dbUser}:qux@${host}`;

                td.when(save(sessionName, { uri: `mysqlx://${dbUser}@${host}`, appdata: {} })).thenResolve();

                const session = sessionConfig(sessionName, uri);
                const config = configManager().setPersistenceHandler({ save });

                return expect(config.save(session)).to.be.fulfilled
                    .then(result => {
                        expect(result.getUri()).to.equal(uri);
                    });
            });

            it('should use an IPasswordHandler implementation to store the password if one is available', () => {
                const sessionName = 'foo';
                const host = 'bar';
                const port = 33060;
                const dbUser = 'baz';
                const dbPassword = 'qux';
                const address = `${host}:${port}`;
                const uri = `mysqlx://${dbUser}:${dbPassword}@${address}`;

                td.when(save(dbUser, address, dbPassword)).thenResolve();
                td.when(save(sessionName, { uri: `mysqlx://${dbUser}@${address}`, appdata: {} }), { times: 1 }).thenResolve();

                const session = sessionConfig(sessionName, uri);
                const config = configManager().setPersistenceHandler({ save }).setPasswordHandler({ save });

                return expect(config.save(session)).to.be.fulfilled
                    .then(result => {
                        expect(td.explain(save).callCount).to.equal(2);
                        expect(result.getUri()).to.equal(uri);
                    });
            });

            it('should not use an existing IPasswordHandler implementation if no password is provided', () => {
                const sessionName = 'foo';
                const uri = 'mysqlx://bar';

                td.when(save(sessionName, { uri, appdata: {} }), { times: 1 }).thenResolve();

                const session = sessionConfig('foo', uri);
                const config = configManager().setPersistenceHandler({ save }).setPasswordHandler({ save });

                return expect(config.save(session)).to.be.fulfilled
                    .then(result => {
                        expect(td.explain(save).callCount).to.equal(1);
                        expect(result.getUri()).to.equal(uri);
                    });
            });
        });

        it('should fail if no IPersistenceHandler implementation is available', () => {
            const config = configManager();
            config.setPersistenceHandler(undefined);

            return expect(config.save('foo')).to.be.rejectedWith('No IPersistenceHandler implementation available');
        });

        it('should have a `save` hook in the SessionConfig instance', () => {
            const sessionName = 'foo';
            const host = 'bar';
            const uri = `mysqlx://${host}`;

            td.when(save(sessionName, { uri, appdata: { baz: 'quux' } })).thenResolve();
            td.when(save(sessionName, { uri, appdata: { baz: 'qux' } }), { times: 1 }).thenResolve();

            const config = configManager().setPersistenceHandler({ save });

            return expect(config.save(sessionName, { host, ssl: true, baz: 'qux' })).to.be.fulfilled
                .then(result => {
                    return result.setAppData('baz', 'quux').save();
                })
                .then(result => {
                    expect(td.explain(save).callCount).to.equal(2);
                    expect(result.getUri()).to.equal(uri);
                    expect(result.getAppData('baz')).to.equal('quux');
                });
        });
    });

    context('delete()', () => {
        let exists, remove;

        beforeEach('create fakes', () => {
            exists = td.function();
            remove = td.function();
        });

        it('should delete a given session if it exists', () => {
            const sessionName = 'foo';

            td.when(exists(sessionName)).thenResolve(true);
            td.when(remove(sessionName)).thenResolve();

            const config = configManager().setPersistenceHandler({ delete: remove, exists });
            const session = sessionConfig(sessionName);

            return expect(config.delete(sessionName)).to.be.fulfilled
                .then(status => expect(status).to.be.true);
        });

        it('should delete a given session if it does not exist', () => {
            const sessionName = 'foo';

            td.when(exists(sessionName)).thenResolve(false);
            td.when(remove(sessionName)).thenResolve();

            const config = configManager().setPersistenceHandler({ delete: remove, exists });
            const session = sessionConfig(sessionName);

            return expect(config.delete(sessionName)).to.be.fulfilled
                .then(status => expect(status).to.be.false);
        });

        it('should fail if no IPersistenceHandler implementation is available', () => {
            const config = configManager().setPersistenceHandler(undefined);

            return expect(config.delete('foo')).to.be.rejectedWith('No IPersistenceHandler implementation available');
        });
    });
});
