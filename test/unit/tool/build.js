/*
 * Copyright (c) 2018, 2021, Oracle and/or its affiliates.
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

const expect = require('chai').expect;
const path = require('path');
const pkg = require('../../../package.json');
const td = require('testdouble');

describe('build tools', () => {
    afterEach('reset fakes', () => {
        td.reset();
    });

    context('generateSourceMetadataFile()', () => {
        let exec, writeFile, build;

        beforeEach('setup fakes', () => {
            exec = td.function();
            writeFile = td.function();

            td.replace('child_process', { exec });
            td.replace('fs', { promises: { writeFile } });

            build = require('../../../lib/tool/build');

            td.when(writeFile(), { ignoreExtraArgs: true }).thenResolve();
        });

        context('specific build environment', () => {
            beforeEach('setup environment', () => {
                process.env.BRANCH_NAME = 'trunk';
                process.env.PUSH_REVISION = '0123456789abcdef';
            });

            afterEach('reset environment', () => {
                delete process.env.BRANCH_NAME;
                delete process.env.PUSH_REVISION;
            });

            it('creates a valid metadata file when git is not available', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\nbranch: trunk\ncommit: 0123456789abcdef\nshort: 0123456\n`;

                td.when(exec(cmd)).thenCallback(new Error());

                return build.generateSourceMetadataFile()
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });

            it('creates a valid metadata file when the git command throws an error', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\nbranch: trunk\ncommit: 0123456789abcdef\nshort: 0123456\n`;

                td.when(exec(cmd)).thenCallback(null, null, 'error');

                return build.generateSourceMetadataFile()
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });

            it('creates a valid metadata file when the git command works', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\nbranch: foo\ncommit: baz\nshort: qux\ndate: bar\n`;

                td.when(exec(cmd)).thenCallback(null, 'branch=HEAD -> foo&date=bar&commit=baz&short=qux');

                return build.generateSourceMetadataFile()
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });
        });

        context('general build environment', () => {
            it('creates a valid metadata file when git is not available', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\n`;

                td.when(exec(cmd)).thenCallback(new Error());

                return build.generateSourceMetadataFile()
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });

            it('creates a valid metadata file when the git command throws an error', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\n`;

                td.when(exec(cmd)).thenCallback(null, null, 'error');

                return build.generateSourceMetadataFile()
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });

            it('creates a valid metadata file when the git command works', () => {
                const cmd = "git log -n 1 --date=format:'%F %T' --pretty=format:'branch=%D&date=%ad&commit=%H&short=%h'";
                const file = path.join('docs', 'INFO_SRC');
                const content = `version: ${pkg.version}\nbranch: foo\ndate: bar\ncommit: baz\nshort: qux\n`;

                td.when(exec(cmd)).thenCallback(null, 'branch=HEAD -> foo&date=bar&commit=baz&short=qux');

                return build.generateSourceMetadataFile()
                    .then(() => {
                        expect(td.explain(writeFile).callCount).to.equal(1);
                        expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                        expect(td.explain(writeFile).calls[0].args[1]).to.equal(content);
                    });
            });
        });
    });

    context('generatePackageMetadataFile()', () => {
        let arch, build, release, type, writeFile;

        beforeEach('setup fakes', () => {
            writeFile = td.function();
            type = td.function();
            release = td.function();
            arch = td.function();

            td.replace('os', { arch, type, release });
            td.replace('fs', { promises: { writeFile } });

            build = require('../../../lib/tool/build');
        });

        it('creates a valid metadata file', () => {
            const file = path.join('docs', 'INFO_BIN');
            const content = /^build-date: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\nos-info: foo bar.baz\n$/;

            td.when(type()).thenReturn('foo');
            td.when(release()).thenReturn('bar');
            td.when(arch()).thenReturn('baz');
            td.when(writeFile(), { ignoreExtraArgs: true }).thenResolve();

            return build.generatePackageMetadataFile()
                .then(() => {
                    expect(td.explain(writeFile).callCount).to.equal(1);
                    expect(td.explain(writeFile).calls[0].args[0]).to.equal(file);
                    expect(td.explain(writeFile).calls[0].args[1]).to.match(content);
                });
        });
    });
});
