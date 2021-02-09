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

const path = require('path');
const td = require('testdouble');
const { expect } = require('chai');

// subject under test needs to be reloaded with replacement fakes
let copyright = require('../../../lib/tool/copyright');

describe('copyright tooling', () => {
    context('createNotice()', () => {
        it('returns the correct copyright notice for the current year if no years are provided', () => {
            const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates.\n`);

            expect(copyright.createNotice()).to.match(regexp);
        });

        it('returns the correct copyright notice if only the original year is provided', () => {
            const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) 2015, ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates.\n`);

            expect(copyright.createNotice(2015)).to.match(regexp);
        });

        it('returns the correct copyright notice for the provided years', () => {
            // eslint-disable-next-line prefer-regex-literals, no-control-regex
            const regexp = new RegExp('^\\/\\*\n \\* Copyright \\(c\\) 2015, 2018, Oracle and\\/or its affiliates.\n');

            expect(copyright.createNotice(2015, 2018)).to.match(regexp);
        });

        it('returns the correct copyright notice if the original year is the same as the current year', () => {
            // eslint-disable-next-line prefer-regex-literals, no-control-regex
            const regexp = new RegExp('^\\/\\*\n \\* Copyright \\(c\\) 2020, Oracle and\\/or its affiliates.\n');

            expect(copyright.createNotice(2020, 2020)).to.match(regexp);
        });
    });

    context('fixHeaders()', () => {
        let exec, readFile, readdir, writeFile;

        beforeEach('create fakes', () => {
            const cp = td.replace('child_process');
            const util = td.replace('util');

            exec = td.function();
            readFile = td.function();
            readdir = td.function();
            writeFile = td.function();

            td.replace('fs', { promises: { readFile, readdir, writeFile } });

            td.when(util.promisify(cp.exec)).thenReturn(exec);

            copyright = require('../../../lib/tool/copyright');
        });

        context('ignores non JavaScript files', () => {
            it('in the root directory', () => {
                const file = { name: 'bar.md', isDirectory: () => false };

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);

                return copyright.fixHeaders('foo')
                    .then(filesChanged => expect(filesChanged).to.be.an('array').and.be.empty);
            });

            it('in a sub directory', () => {
                const directory = { name: 'bar', isDirectory: () => true };
                const file = { name: 'baz.md', isDirectory: () => false };

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([directory]);
                td.when(readdir(path.join('foo', 'bar'), { withFileTypes: true })).thenResolve([file]);

                return copyright.fixHeaders('foo')
                    .then(filesChanged => expect(filesChanged).to.be.an('array').and.be.empty);
            });
        });

        context('ignores specific directories in the ignore list', () => {
            it('within the root directory', () => {
                const directory = { name: 'bar', isDirectory: () => true };
                const file = { name: 'baz.js', isDirectory: () => false };

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([directory]);
                td.when(readdir(path.join('foo', 'bar'), { withFileTypes: true })).thenResolve([file]);

                return copyright.fixHeaders('foo', { ignore: [path.join('foo', 'bar')] })
                    .then(filesChanged => expect(filesChanged).to.be.an('array').and.be.empty);
            });

            it('inside a sub directory', () => {
                const directory = { name: 'bar', isDirectory: () => true };
                const subDirectory = { name: 'baz', isDirectory: () => true };
                const file = { name: 'qux.js', isDirectory: () => false };

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([directory]);
                td.when(readdir(path.join('foo', 'bar'), { withFileTypes: true })).thenResolve([subDirectory]);
                td.when(readdir(path.join('foo', 'bar', 'baz'), { withFileTypes: true })).thenResolve([file]);

                return copyright.fixHeaders('foo', { ignore: [path.join('foo', 'bar', 'baz')] })
                    .then(filesChanged => expect(filesChanged).to.be.an('array').and.be.empty);
            });
        });

        context('when git is not available', () => {
            it('prepends an header with the current year only if the file does not contain one', () => {
                const file = { name: 'bar.js', isDirectory: () => false };
                const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\nfoo\n$`);

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);
                td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar.js')}`)).thenReject();
                td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar.js')}`)).thenReject();
                td.when(readFile(path.join('foo', 'bar.js'), { encoding: 'utf8' })).thenResolve('foo\n');
                td.when(writeFile(path.join('foo', 'bar.js'), td.matchers.contains(regexp))).thenResolve();

                return copyright.fixHeaders('foo')
                    .then(filesChanged => {
                        return expect(filesChanged).to.deep.equal([path.join('foo', 'bar.js')]);
                    });
            });

            it('prepends an header with the current year only if the file does not contain one and starts with a comment', () => {
                const file = { name: 'bar.js', isDirectory: () => false };
                const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\n\\/\\* foo \\*\\/\n$`);

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);
                td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar.js')}`)).thenReject();
                td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar.js')}`)).thenReject();
                td.when(readFile(path.join('foo', 'bar.js'), { encoding: 'utf8' })).thenResolve('/* foo */\n');
                td.when(writeFile(path.join('foo', 'bar.js'), td.matchers.contains(regexp))).thenResolve();

                return copyright.fixHeaders('foo')
                    .then(filesChanged => {
                        return expect(filesChanged).to.deep.equal([path.join('foo', 'bar.js')]);
                    });
            });

            it('does nothing if the file contains a valid copyright header', () => {
                const file = { name: 'bar.js', isDirectory: () => false };
                const source = '/*\n * Copyright (c) 2015, 2018, Oracle and/or its affiliates.\n */\n\nfoo\n';

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);
                td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar.js')}`)).thenReject();
                td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar.js')}`)).thenReject();
                td.when(readFile(path.join('foo', 'bar.js'), { encoding: 'utf8' })).thenResolve(source);

                return copyright.fixHeaders('foo')
                    .then(filesChanged => {
                        return expect(filesChanged).to.be.an('array').and.be.empty;
                    });
            });
        });

        context('when git log does not return metadata', () => {
            it('prepends an header with the current year only if the file does not contain one', () => {
                const file = { name: 'bar.js', isDirectory: () => false };
                const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\nfoo\n$`);

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);
                td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: '' });
                td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: '' });
                td.when(readFile(path.join('foo', 'bar.js'), { encoding: 'utf8' })).thenResolve('foo\n');
                td.when(writeFile(path.join('foo', 'bar.js'), td.matchers.contains(regexp))).thenResolve();

                return copyright.fixHeaders('foo')
                    .then(filesChanged => {
                        return expect(filesChanged).to.deep.equal([path.join('foo', 'bar.js')]);
                    });
            });

            it('prepends an header with the current year only if the file does not contain one and starts with a comment', () => {
                const file = { name: 'bar.js', isDirectory: () => false };
                const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\n\\/\\* foo \\*\\/\n$`);

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);
                td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: '' });
                td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: '' });
                td.when(readFile(path.join('foo', 'bar.js'), { encoding: 'utf8' })).thenResolve('/* foo */\n');
                td.when(writeFile(path.join('foo', 'bar.js'), td.matchers.contains(regexp))).thenResolve();

                return copyright.fixHeaders('foo')
                    .then(filesChanged => {
                        return expect(filesChanged).to.deep.equal([path.join('foo', 'bar.js')]);
                    });
            });

            it('does nothing if the file contains a valid copyright header', () => {
                const file = { name: 'bar.js', isDirectory: () => false };
                const source = '/*\n * Copyright (c) 2015, 2018, Oracle and/or its affiliates.\n */\n\nfoo\n';

                td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);
                td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: '' });
                td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: '' });
                td.when(readFile(path.join('foo', 'bar.js'), { encoding: 'utf8' })).thenResolve(source);

                return copyright.fixHeaders('foo')
                    .then(filesChanged => {
                        return expect(filesChanged).to.be.an('array').and.be.empty;
                    });
            });
        });

        context('when git log returns metadata', () => {
            context('when a file is in the root directory', () => {
                const file = { name: 'bar.js', isDirectory: () => false };

                it('prepends an header with the first commit year and the current year if the file does not contain one', () => {
                    const origYear = 2015;
                    const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${origYear}, ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\nfoo\n$`);

                    td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);
                    td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: `Mon, 30 Mar ${origYear} 14:44:08 -0500\n` });
                    td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: 'Fri, 10 Jul 2018 10:49:36 +0100\n' });
                    td.when(readFile(path.join('foo', 'bar.js'), { encoding: 'utf8' })).thenResolve('foo\n');
                    td.when(writeFile(path.join('foo', 'bar.js'), td.matchers.contains(regexp))).thenResolve();

                    return copyright.fixHeaders('foo')
                        .then(filesChanged => {
                            return expect(filesChanged).to.deep.equal([path.join('foo', 'bar.js')]);
                        });
                });

                it('prepends an header with the first commit year and the current year if the file does not contain one and starts with a comment', () => {
                    const origYear = 2015;
                    const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${origYear}, ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\n\\/\\* foo \\*\\/\n$`);

                    td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);
                    td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: `Mon, 30 Mar ${origYear} 14:44:08 -0500\n` });
                    td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: 'Fri, 10 Jul 2018 10:49:36 +0100\n' });
                    td.when(readFile(path.join('foo', 'bar.js'), { encoding: 'utf8' })).thenResolve('/* foo */\n');
                    td.when(writeFile(path.join('foo', 'bar.js'), td.matchers.contains(regexp))).thenResolve();

                    return copyright.fixHeaders('foo')
                        .then(filesChanged => {
                            return expect(filesChanged).to.deep.equal([path.join('foo', 'bar.js')]);
                        });
                });

                it('replaces the header using the first commit year and the current year if the file contains one that is incorrect', () => {
                    const origYear = 2015;
                    const source = `/*\n * Copyright (c) ${origYear + 2}, 2018 Oracle and/or its affiliates.\n */\n\nfoo\n`;
                    const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${origYear}, ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\nfoo\n$`);

                    td.when(readdir('foo', { withFileTypes: true })).thenResolve([file]);
                    td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: `Mon, 30 Mar ${origYear} 14:44:08 -0500\n` });
                    td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar.js')}`)).thenResolve({ stdout: 'Fri, 10 Jul 2018 10:49:36 +0100\n' });
                    td.when(readFile(path.join('foo', 'bar.js'), { encoding: 'utf8' })).thenResolve(source);
                    td.when(writeFile(path.join('foo', 'bar.js'), td.matchers.contains(regexp))).thenResolve();

                    return copyright.fixHeaders('foo')
                        .then(filesChanged => {
                            return expect(filesChanged).to.deep.equal([path.join('foo', 'bar.js')]);
                        });
                });
            });

            context('when a file is in a sub-directory', () => {
                const directory = { name: 'bar', isDirectory: () => true };
                const file = { name: 'baz.js', isDirectory: () => false };

                it('prepends an header with the first commit year and the current year if the file does not contain one', () => {
                    const origYear = 2015;
                    const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${origYear}, ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\nfoo\n$`);

                    td.when(readdir('foo', { withFileTypes: true })).thenResolve([directory]);
                    td.when(readdir(path.join('foo', 'bar'), { withFileTypes: true })).thenResolve([file]);
                    td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar', 'baz.js')}`)).thenResolve({ stdout: `Mon, 30 Mar ${origYear} 14:44:08 -0500\n` });
                    td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar', 'baz.js')}`)).thenResolve({ stdout: 'Fri, 10 Jul 2018 10:49:36 +0100\n' });
                    td.when(readFile(path.join('foo', 'bar', 'baz.js'), { encoding: 'utf8' })).thenResolve('foo\n');
                    td.when(writeFile(path.join('foo', 'bar', 'baz.js'), td.matchers.contains(regexp))).thenResolve();

                    return copyright.fixHeaders('foo')
                        .then(filesChanged => {
                            return expect(filesChanged).to.deep.equal([path.join('foo', 'bar', 'baz.js')]);
                        });
                });

                it('prepends an header with the first commit year and the current year if the file does not contain one and starts with a comment', () => {
                    const origYear = 2015;
                    const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${origYear}, ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\n\\/\\* foo \\*\\/\n$`);

                    td.when(readdir('foo', { withFileTypes: true })).thenResolve([directory]);
                    td.when(readdir(path.join('foo', 'bar'), { withFileTypes: true })).thenResolve([file]);
                    td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar', 'baz.js')}`)).thenResolve({ stdout: `Mon, 30 Mar ${origYear} 14:44:08 -0500\n` });
                    td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar', 'baz.js')}`)).thenResolve({ stdout: 'Fri, 10 Jul 2018 10:49:36 +0100\n' });
                    td.when(readFile(path.join('foo', 'bar', 'baz.js'), { encoding: 'utf8' })).thenResolve('/* foo */\n');
                    td.when(writeFile(path.join('foo', 'bar', 'baz.js'), td.matchers.contains(regexp))).thenResolve();

                    return copyright.fixHeaders('foo')
                        .then(filesChanged => {
                            return expect(filesChanged).to.deep.equal([path.join('foo', 'bar', 'baz.js')]);
                        });
                });

                it('replaces the header using the first commit year and the current year if the file contains one that is incorrect', () => {
                    const origYear = 2015;
                    const source = `/*\n * Copyright (c) ${origYear + 2}, 2018 Oracle and/or its affiliates.\n */\n\nfoo\n`;
                    const regexp = new RegExp(`^\\/\\*\n \\* Copyright \\(c\\) ${origYear}, ${(new Date()).getUTCFullYear()}, Oracle and\\/or its affiliates\\.\n(\\*(?!\\/)|[^*])*\\*\\/\n\nfoo\n$`);

                    td.when(readdir('foo', { withFileTypes: true })).thenResolve([directory]);
                    td.when(readdir(path.join('foo', 'bar'), { withFileTypes: true })).thenResolve([file]);
                    td.when(exec(`git log --format=%aD --reverse ${path.join('foo', 'bar', 'baz.js')}`)).thenResolve({ stdout: `Mon, 30 Mar ${origYear} 14:44:08 -0500\n` });
                    td.when(exec(`git log --format=%aD --max-count=1 ${path.join('foo', 'bar', 'baz.js')}`)).thenResolve({ stdout: 'Fri, 10 Jul 2018 10:49:36 +0100\n' });
                    td.when(readFile(path.join('foo', 'bar', 'baz.js'), { encoding: 'utf8' })).thenResolve(source);
                    td.when(writeFile(path.join('foo', 'bar', 'baz.js'), td.matchers.contains(regexp))).thenResolve();

                    return copyright.fixHeaders('foo')
                        .then(filesChanged => {
                            return expect(filesChanged).to.deep.equal([path.join('foo', 'bar', 'baz.js')]);
                        });
                });
            });
        });
    });
});
