# Copyright (c) 2022, Oracle and/or its affiliates.
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License, version 2.0, as
# published by the Free Software Foundation.
#
# This program is also distributed with certain software (including
# but not limited to OpenSSL) that is licensed under separate terms,
# as designated in a particular file or component or in included license
# documentation.  The authors of MySQL hereby grant you an
# additional permission to link the program and your derivative works
# with the separately licensed software that they have included with
# MySQL.
#
# Without limiting anything contained in the foregoing, this file,
# which is part of MySQL Connector/Node.js, is also subject to the
# Universal FOSS Exception, version 1.0, a copy of which can be found at
# http://oss.oracle.com/licenses/universal-foss-exception.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the GNU General Public License, version 2.0, for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin St, Fifth Floor, Boston, MA 02110-1301  USA

# By default, the container will use the latest GraalVM Node.js image
# from OCR. The BASE_IMAGE environment variable can be used to pull
# any other Node.js image from any other Docker registry.
ARG BASE_IMAGE=container-registry.oracle.com/graalvm/nodejs:latest
FROM ${BASE_IMAGE}

# In order to be able to run the tests within a private network, optional
# proxy configurations can be used.
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ENV HTTP_PROXY=${HTTP_PROXY} HTTPS_PROXY=${HTTPS_PROXY} NO_PROXY=${NO_PROXY}

WORKDIR /mysql-connector-nodejs

# The package.json file needs to exist before the 3rd-party dependencies
# are installed.
COPY package.json .

# It is possible to use a private NPM registry.
ARG NPM_REGISTRY=https://registry.npmjs.org/
RUN npm config set registry ${NPM_REGISTRY}
RUN npm install --quiet

# This volume can be used to share, among other things, the Unix socket file
# with the container.
VOLUME [ "/shared" ]

# Artifacts are copied according to how much they might change in the future
# to leverage layer caching.
COPY .eslintrc.js .
COPY bin bin
COPY index.js .
COPY types types
COPY test test
COPY lib lib
