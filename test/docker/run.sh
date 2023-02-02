# Copyright (c) 2022, 2023, Oracle and/or its affiliates.
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

# If MYSQLX_HOST is empty, it is assumed a MySQL server instance is available
# in the host machine. On the other hand, the same should be the case if
# MYSQLX_HOST is equal to "localhost" or "127.0.0.1" (loopback addresses).
# On Linux this works fine, but on VM-based Docker implementations on macOS
# and Windows, this is not the case. As a standard, these VM-based Docker
# implementations use "host.docker.internal" as a symbolic address for the
# host machine. On Linux, we can create that link manually using the
# "extra_hosts" definition (see docker-compose.Linux.yml).
if [ -z "$MYSQLX_HOST" ] || [ "$MYSQLX_HOST" == "localhost" ] || [ "$MYSQLX_HOST" == "127.0.0.1" ]
then
    MYSQLX_HOST="host.docker.internal"
fi

# Given what has been described, and to avoid a bunch of conditionals in
# this script, there should be a different compose file for Linux and macOS
# (Windows is currently not supported). On Unix systems, an easy way to
# distinguish between platforms is by using the native "uname" command. In
# this case, the command will either yield "Linux" or "Darwin".
DOCKER_PLATFORM=$(uname)

# The platform specific compose files should be merged with a base global
# compose file that contains the common configuration setup.
# The Dockerfile path needs to passed as an environment variable to
# compose because the script is not running in the project directory.
# In case the $MYSQL_VERSION environment variable is not defined, it should
# contain a default value (using the $version variable from this script).
# Some service definitions only exist to aggregate common functionality
# used by multiple services. These are abstract in nature, and they should
# not be created. Concrete services use the "enabled" profile.
DOCKERFILE=$basedir/Dockerfile MYSQL_VERSION=$version docker compose \
    --profile enabled \
    --file $basedir/docker-compose.yml \
    --file $basedir/docker-compose.$DOCKER_PLATFORM.yml \
    --project-directory $basedir/../../ \
    up \
    -d \
    --build

# The platform-specific compose files are only needed in the build stage
# because they inherit existing services in the main compose file.
# In the run stage, compose only needs to know which services are being used,
# not how they were created.
# Any Unix socket is copied to the container, at this stage, using a bind
# mount, so, we need to load an additional compose file that specifies the
# bind mount, only when the socket path is provided.
docker compose \
    --profile enabled \
    --file $basedir/docker-compose.yml \
    ${MYSQLX_SOCKET:+ --file $basedir/docker-compose.local.yml} \
    --project-directory $basedir/../../ \
    run \
    --rm \
    --interactive \
    --env MYSQLX_HOST=$MYSQLX_HOST \
    --env MYSQLX_PASSWORD \
    --env MYSQLX_SOCKET \
    --env MYSQLX_USER \
    --env TEST_PATTERN \
    mysql-connector-nodejs \
    npm run $test_script -- -- --grep "$TEST_PATTERN"

# After the run stage is done, the containers, volumes and networks used
# should be stopped and removed in order to avoid dangling resources.
docker compose \
    --profile all \
    --file $basedir/docker-compose.yml \
    --project-directory $basedir/../../ \
    down \
    --volumes
