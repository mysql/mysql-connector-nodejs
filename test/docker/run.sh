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

#!/bin/sh

image=mysql-connector-nodejs
version=${MYSQL_VERSION:-latest}
input_test_script=$1
test_script=${input_test_script:-test}
basedir=$(dirname $0)

# The BASE_IMAGE, HTTPS_PROXY, HTTP_PROXY, NO_PROXY and NPM_REGISTRY
# environment variables are used as build arguments. Unless they are
# explicitly specified, the script will use their system-wide values.
# It should be possible to run script from anywhere in the file system. So,
# the absolute Dockerfile and context paths should be specified.
docker build \
    --build-arg BASE_IMAGE \
    --build-arg HTTP_PROXY \
    --build-arg HTTPS_PROXY \
    --build-arg NO_PROXY \
    --build-arg NPM_REGISTRY \
    --tag $image:$version \
    --file $basedir/Dockerfile \
    $basedir/../../

# If MYSQLX_HOST is empty, "localhost" should be used by default.
# The variable needs to be re-assigned in order to determine if it contains a
# loopback address (implicitly or explicitly).
if [ -z "$MYSQLX_HOST" ]
then
    MYSQLX_HOST="localhost"
fi

# If MYSQLX_HOST is a loopback address, a new flag is created. This flag
# allows to determine the network mode in which the Docker container will
# run. The container should run in "host" mode if MYSQLX_HOST is a loopback
# address and should run in "bridge" mode (default) if MYSQLX_HOST is
# a different host name or IP address.
if [ "$MYSQLX_HOST" == "localhost" ] || [ "$MYSQLX_HOST" == "127.0.0.1" ]
then
    MYSQL_LOCALHOST=$MYSQLX_HOST
fi

# If MYSQLX_SOCKET is not empty, the corresponding path to the Unix socket
# file should be shared with the container using a Docker volume.
# Additionally, the variable should be assigned the appropriate absolute
# file path from the container standpoint.
# If MYSQL_LOCALHOST is not empty, the container should run using the "host"
# network mode. If it is empty, the container should run using the "bridge"
# network mode, which is what happens by default.
docker run \
    --rm \
    --interactive \
    --tty \
    ${MYSQL_LOCALHOST:+ --network host} \
    ${MYSQLX_SOCKET:+ --volume $MYSQLX_SOCKET:/shared/mysqlx.sock} \
    --env MYSQLX_HOST \
    --env MYSQLX_PASSWORD \
    --env MYSQLX_PORT \
    ${MYSQLX_SOCKET:+ --env MYSQLX_SOCKET=/shared/mysqlx.sock} \
    --env MYSQLX_USER \
    --env TEST_PATTERN \
    $image:$version \
    npm run $test_script -- -- --grep "$TEST_PATTERN"
