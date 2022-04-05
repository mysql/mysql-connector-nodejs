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

const cp = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const exec = util.promisify(cp.exec);

/**
 * Fix the copyright header in source files within a given directory and check if any files were changed.
 * @private
 * @param {string} directory - name of the directory to navigate
 * @param {Object} options - additional options, including files or subdirectories to ignore
 */
function fixHeaders (directory, options) {
    return getFilesChangedSinceLastCommit()
        .then(files => {
            return fixFilesInDirectory(directory, { changes: files, ...options });
        });
};

/**
 * Get the list of files that have changed since the last commit.
 * @private
 * @returns {string[]}
 */
function getFilesChangedSinceLastCommit () {
    return exec('git status --porcelain')
        .then(({ stdout }) => {
            return extractChangedFiles(stdout);
        })
        .catch(() => {
            // if git (for some reason) is not available we need to return something undefined
            // eslint-disable-next-line no-useless-return
            return;
        });
}

/**
 * Extract the full path of each file that changed since the last commit.
 * @private
 * @param {string} stdout - Output of the "git status --porcelain" command.
 */
function extractChangedFiles (stdout) {
    // "git status --porcelain" output is like:
    // "A /path/to/file\nM /path/to/file\n"
    // "A" means the file is new and "M" means it was modified.
    // "filter()" removes the empty newline at the end
    return stdout.split('\n').filter(c => c.length)
        // We can ignore these flags and extract only the file path (relative)
        // producing the absolute path with the current working directory.
        .map(c => path.join(process.cwd(), c.trim().slice(1).trim()));
}

/**
 * Navigate a given directory and fix the copyright header in source files (if needed).
 * @private
 * @param {string} directory - directory name
 * @param {Object} options - additional options, including files or subdirectories to ignore
 */
function fixFilesInDirectory (directory, options) {
    return fs.readdir(directory, { withFileTypes: true })
        .then(files => {
            return Promise.all(files.map(file => fixFileInDirectory(directory, file, options)));
        })
        .then(output => {
            // flatten the array
            return output.reduce((files, file) => !file ? files : files.concat(file), []);
        });
}

/**
 * Try to fix a file identified by a given file handle.
 * @private
 * @param {string} directory - directory name
 * @param {fs.Dirent} file - file handle
 * @param {Object} - additional options
 */
function fixFileInDirectory (directory, file, { changes = [], ignore = [] } = {}) {
    const filePath = path.join(directory, file.name);

    // if the file or directory should be ignored, there is nothing else to do
    if (ignore.indexOf(filePath) > -1) {
        return;
    }

    // we need to first check if is is a directory
    if (file.isDirectory()) {
        return fixFilesInDirectory(filePath, { changes, ignore });
    }

    // only then can we ensure to only work with files with the appropriate extension
    if (!file.name.match(/^.+(\.js|\.ts)$/)) {
        return;
    }

    return getFirstCommitYear(filePath)
        .then(firstCommit => {
            return getLastCommitYear(filePath)
                .then(lastCommit => ({ firstCommit, lastCommit }));
        })
        .then(({ firstCommit, lastCommit }) => {
            return fixFileContents(filePath, firstCommit, lastCommit, { changes });
        });
}

/**
 * Retrieve the year of the first git commit of a given file.
 * @private
 * @param {string} file - file path
 */
function getFirstCommitYear (file) {
    return exec(`git log --format=%aD --reverse ${file}`)
        .then(({ stdout }) => {
            return extractCommitYear(stdout);
        })
        .catch(() => {
            // if git (for some reason) is not available we need to return something undefined
            // eslint-disable-next-line no-useless-return
            return;
        });
}

/**
 * Retrieve the year of the last git commit of a given file.
 * @private
 * @param {string} file - file path
 */
function getLastCommitYear (file) {
    return exec(`git log --format=%aD --max-count=1 ${file}`)
        .then(({ stdout }) => {
            return extractCommitYear(stdout);
        })
        .catch(() => {
            // if git (for some reason) is not available we need to return something undefined
            return (new Date()).getUTCFullYear();
        });
}

/**
 * Extract a year from the output of a "git log" command.
 * @private
 * @param {string} stdout - Output of the "git log" command.
 */
function extractCommitYear (stdout) {
    // "filter()" removes the empty newline at the end
    const dates = stdout.split('\n').filter(t => t.length);

    // if there's no metadata available, return the current year
    if (!dates.length) {
        return;
    }

    return (new Date(dates[0])).getUTCFullYear();
}

/**
 * Fix the copyright notice header of a given source file (if needed).
 * @private
 * @param {string} file - file path
 * @param {number} origYear - Year when the first git commit happened.
 * @param {number} lastCommitYear - Year when the last git commit happened.
 */
function fixFileContents (file, firstCommitYear, lastCommitYear, { changes = [] }) {
    return fs.readFile(file, { encoding: 'utf8' })
        .then(source => {
            const matches = source.match(/^\/\*\n \* Copyright(\*(?!\/)|[^*])*\*\//g);

            const lastCorrectHeader = createNotice(firstCommitYear, lastCommitYear);
            const presentDayHeader = createNotice(firstCommitYear);

            if (!matches) {
                // prepends the correct header
                return updateFile(file, `${presentDayHeader}\n\n${source}`);
            }

            // if firstCommitYear is not defined, it means we don't have git metadata available
            if ((changes.indexOf(file) > -1 && matches[0] !== presentDayHeader) || (firstCommitYear && lastCommitYear && matches[0] !== lastCorrectHeader && matches[0] !== presentDayHeader)) {
                // replaces the incorrect header
                return updateFile(file, `${presentDayHeader}${source.slice(matches[0].length)}`);
            }

            return false;
        });
}

/**
 * Create a copyright notice header with a range defined by the provided years.
 * @private
 * @param {number} [origYear] - Year the file was created/changed for the first time (defaults to the current year).
 * @param {number} [currentYear] - Year the file was last changed (defaults to the current year).
 */
function createNotice (origYear = (new Date()).getUTCFullYear(), currentYear = (new Date()).getUTCFullYear()) {
    const range = origYear !== currentYear ? [origYear, currentYear].join(', ') : origYear;

    return `/*
 * Copyright (c) ${range}, Oracle and/or its affiliates.
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
`.trim();
}

/**
 * Update a given source file.
 * @private
 * @param {string} file - path of the file to write
 * @param {string} source - up-to-date file content
 */
function updateFile (file, source) {
    return fs.writeFile(file, source)
        .then(() => {
            return file;
        });
}

module.exports = { createNotice, fixHeaders };
