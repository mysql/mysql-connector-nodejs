/*
 * Copyright (c) 2020, 2022, Oracle and/or its affiliates.
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

const copyright = require('../../../../lib/tool/copyright');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { expect } = require('chai');

describe('fixing copyright notice source file headers', () => {
    const directory = path.join(os.tmpdir(), 'nodejsmysqlxtest');
    const filename = path.join(directory, 'copyright-test.js');

    beforeEach('create a temporary directory', () => {
        return fs.mkdir(directory);
    });

    afterEach('delete file to make sure the directory can be deleted', () => {
        return fs.unlink(filename);
    });

    afterEach('delete temporary directory', () => {
        return fs.rmdir(directory);
    });

    context('when a file contains a copyright notice header', () => {
        beforeEach('create a file with the correct header', () => {
            return fs.writeFile(filename, `${copyright.createNotice()}\n\n'use strict'\n`);
        });

        it('keeps the file exactly as it was before', function () {
            const expected = `${copyright.createNotice()}\n\n'use strict'\n`;

            return copyright.fixHeaders(directory)
                .then(filesChanged => {
                    return expect(filesChanged).to.be.an('array').and.be.empty;
                })
                .then(() => {
                    return fs.readFile(filename, { encoding: 'utf8' });
                })
                .then(data => expect(data).to.equal(expected));
        });
    });

    context('when the file does not contain the header', () => {
        beforeEach('create a file without an header', () => {
            // eslint-disable-next-line quotes
            return fs.writeFile(filename, `'use strict'\n`);
        });

        it('prepends the correct header to the file', function () {
            const expected = `${copyright.createNotice()}\n\n'use strict'\n`;

            return copyright.fixHeaders(directory)
                .then(filesChanged => {
                    return expect(filesChanged).to.deep.equal([filename]);
                })
                .then(() => {
                    return fs.readFile(filename, { encoding: 'utf8' });
                })
                .then(data => expect(data).to.equal(expected));
        });
    });

    context('when the file does not contain the header but starts with a regular comment', () => {
        beforeEach('create a file without an header', () => {
            return fs.writeFile(filename, '/* foo */\n');
        });

        it('prepends the correct header to the file', function () {
            const expected = `${copyright.createNotice()}\n\n/* foo */\n`;

            return copyright.fixHeaders(directory)
                .then(filesChanged => {
                    return expect(filesChanged).to.deep.equal([filename]);
                })
                .then(() => {
                    return fs.readFile(filename, { encoding: 'utf8' });
                })
                .then(data => expect(data).to.equal(expected));
        });
    });
});
