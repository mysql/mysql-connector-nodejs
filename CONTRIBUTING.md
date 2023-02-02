# Contributing Guidelines

We love getting feedback from our users. Bugs and code contributions are great forms of feedback and we thank you for any bugs you report or code you contribute.

## Reporting Issues

Before reporting a new bug, please [check first](https://bugs.mysql.com/search.php) to see if a similar bug already exists.

Bug reports should be as complete as possible. Please try and include the following:

* Complete steps to reproduce the issue.
* Any information about platform and environment that could be specific to the bug.
* Specific version of the product you are using.
* Specific version of the server being used.
* Sample code to help reproduce the issue, if possible.

## Contributing Code

Contributing to MySQL projects is easy. You just need to follow these steps.

* Make sure you have a user account at [bugs.mysql.com](https://bugs.mysql.com). You will need to reference this user account when you submit your Oracle Contributor Agreement (OCA).
* Sign the Oracle Contributor Agreement. You can find instructions for doing that at the [OCA Page](https://oca.opensource.oracle.com/).
* Develop your pull request. Make sure you are aware of the requirements for the project (e.g. do not require Node.js 0.x when we are supporting Node.js 14.x and higher).
* Validate your pull request by including tests that sufficiently cover the functionality you are adding.
* Verify that the entire test suite passes with your code applied.
* Submit your pull request. While you can submit the pull request via [GitHub](https://github.com/mysql/mysql-connector-nodejs/pulls), you can also submit it directly via [bugs.mysql.com](https://bugs.mysql.com).

Thanks again for your wish to contribute to MySQL. We truly believe in the principles of open source development and appreciate any contributions to our projects.

## Setting Up a Development Environment

The following tips provide all the technical directions you should follow when writing code and before actually submitting your contribution.

### Executing the Test Suite

The test suite is composed of two different categories of automated tests:

* Unit tests
* Functional tests

Each test suite can be executed individually or the entire set can be executed altogether. Unit tests can be executed standalone without any external dependencies by running the following command:

```sh
$ npm run test:unit
```

By omission, the functional test suite assumes there is a server running on the same host (`localhost`) at the default X Plugin's 33060 port, and that a `root` user account without a password exists in that server. This is basically what happens if you initialize the server using the following sequence of commands:

```sh
$ mysqld --initialize-insecure
$ mysqld
```

Running the test suite can be done like the following:

```sh
$ npm run test:functional
```

If the server is not running on the same machine, is available only via a local UNIX socket, or if it is initialized using other custom configuration details, those can be provided to the test runner using the following environment variables:

* `MYSQLX_HOST` (`'localhost'` by default)
* `MYSQLX_DEFAULT_SCHEMA` (`'nodejsmysqlxtest'` by default)
* `MYSQLX_PASSWORD` (empty by default)
* `MYSQLX_PORT` (`33060` by default)
* `MYSQLX_SOCKET` (`undefined` by default)
* `MYSQLX_USER` (`root` by default)

For example:

```sh
$ MYSQLX_USER=foo MYSQLX_PASSWORD=bar MYSQLX_SOCKET=/tmp/mysqlx.sock npm run test:functional
```

The unit test suite and the default functional test suite encompass the basic set of tests that should be able to run regardless of the environment and platform. So, the default `npm test` script only runs tests from those two test suites. This means the following commands are exactly the same:

```sh
$ npm t
$ npm test
$ npm run test
$ npm run test:unit && npm run test:functional
```

#### Using Docker

Alternatively, for Linux or macOS users, there is a script that builds and launches a group of Docker containers as an environment where the automated test suite can execute without any additional dependency (apart from a Docker-based container engine).

There are three different set of containers. One, built on top of a Node.js Docker image, is responsible to execute the test suite and contains the source tree and all the required 3rd-party dependencies. Another one launches a small DNS proxy with service discovery capabilities that allows to test among other things, DNS SRV connections in a dynamic network. The DNS proxy is also responsible for linking an additional set of multiple containers running MySQL server instances using different versions and/or configuration options. These allow to run specific tests against older versions to check for regressions, ensure compatibility between authentication mechanisms and deprecated server-side authentication plugins, setup TLS certificate chains between client and server, and test multi-host capabilities and connection failover, end-to-end.

The script uses the environment variables described previously and introduces a few new ones. These are mostly meant to be used for configuring the Docker containers. They allow to specify the base Node.js and MySQL Docker images, the network proxy setup, and the URL of the NPM registry to use.

* `BASE_IMAGE` (`container-registry.oracle.com/graalvm/nodejs:latest` by default)
* `HTTP_PROXY` (value of the environment variable in the host by default)
* `HTTPS_PROXY` (value of the environment variable in the host by default)
* `MYSQL_IMAGE` (`mysql/mysql-server` by default)
* `MYSQL_VERSION` (`latest` by default)
* `NO_PROXY` (value of the environment variable in the host by default)
* `NPM_REGISTRY` (`https://registry.npmjs.org/` by default)

There is one additional environment variable called `TEST_PATTERN` which can be used to provide a string or a regular expression that is applied for filtering one or more matching tests to execute.

Ultimately, the script allows an argument which identifies the underlying NPM script that gets executed. So, in theory, any of the available NPM scripts can be executed in the container, but by default, it will execute the `test` script.

```sh
 # executing the default test script with the default environment
$ ./test/docker/run.sh
# executing the unit test suite
$ ./test/docker/run.sh test:unit
# executing all TCP-based functional tests whose description matches the given pattern
$ MYSQLX_HOST='<hostname_or_IP_address>' TEST_PATTERN='using CRUD' ./test/docker/run.sh test:functional
# executing all functional tests (Linux only)
$ MYSQLX_SOCKET='/path/to/socket' ./test/docker/run.sh test:functional
```

Users are still able to run the default functional test suite using their own MySQL server instance. Similar to when the tests run on a local environment, the `MYSQLX_HOST` variable is only relevant for the functional tests. The variable is optional and the tests running in the Docker container assume the MySQL server is listening on the host machine and is reachable via `host.docker.internal`. If the MySQL server instance is not running in the host machine, the `MYSQLX_HOST` variable can specify the appropriate hostname or IP address. There is a fallback server instance running in one of the Docker containers which is reachable via `mysql.docker.internal`.

```sh
# executing the extended functional tests in the Docker environment
$ ./test/docker/run.sh test:functional:extended
# executing the default functional tests in the Docker environment
$ MYSQLX_HOST='mysql.docker.internal' ./test/docker/run.sh test:functional
# executing the default functional tests with a local MySQL server instance and the extended tests in the Docker environment
$ ./test/docker/run.sh test:functional:all
# executing all tests in the Docker environment
$ MYSQLX_HOST='mysql.docker.internal' ./test/docker/run.sh test:all
```

Due to some [know limitations](https://github.com/docker/for-mac/issues/483) on the macOS Docker architecture, Unix socket tests can only run on Linux. In that case, if the `MYSQLX_SOCKET` variable is explicitely specified, a shared volume between the host and the container will be created as a mount point from the socket file path in the host and an internal container directory specified as a volume, where the socket file path becomes available.

### Test Coverage

When submitting a patch that introduces changes to the source code, you need to make sure that those changes are be accompanied by a proper set of tests that cover 100% of the affected code paths. This is easily auditable by generating proper test coverage HTML and stdout reports using the following command:

```sh
$ npm run coverage
```

Just like the regular test script counterparts, you can generate code coverage reports for individual test suites, groups of test suites or the entire set of test suites.

```sh
$ npm run coverage:unit
$ npm run coverage:functional
```

As a formal rule, a patch should not lead to a decrease of the overall code coverage below 75%. The scripts will result in an error if that happens. The unwritten rule says that the patch should not lead to any decrease at all of the overall code coverage.

Besides looking at the content generated via the standard output of your command line, you can also check the report available at `coverage/index.html` using a web browser.

Code coverage reports can also be generated in the Docker environment using the same set of NPM scripts.

```sh
# generate code coverage reports using the default test suite
$ ./test/docker/run.sh coverage
# generate code coverage reports using the unit test suite
$ ./test/docker/run.sh coverage:unit
# generate code coverage reports using the default functional test suite
$ ./test/docker/run.sh coverage:functional
# generate code coverage reports using the extended functional test suite
$ ./test/docker/run.sh coverage:functional:extended
# generate code coverage reports using the full test suite
$ ./test/docker/run.sh coverage:functional:all
```

A `coverage` folder will be created in the project root directory containing the artifacts generated by the container, which are copied using a bind mount. If the folder already exists, the contents will be replaced.

### Code Style and Convention

Any change to the project's source code must also follow the standard set of code style/convention rules enforced by the existing tooling infrastructure. So, before submitting a patch, you can check if it violates any of those rules using the following:

```sh
$ npm run lint:lib
$ npm run lint:types
```

Some categories of problems can easily be addressed and automatically fixed by running:

```sh
$ npm run fix:lib
$ npm run fix:types
```

The project maintainers reserve the right, of course, to further extend or amend any change in order to enforce additional informal rules.

### Making Changes to the Source Code

The project provides some utilities you can use in a proper hook for your Git workflow when making changes to the source code. These will increase the chance of a contribution to accepted as is and decrease the time it takes to actually merge the work into the main branch and release it as part of future product versions.

You can go as far as executing test or code coverage scripts, but we recommend to, at least, check for code style and update/fix copyright header notices. This can be done (after installing the project dependencies), for instance, by adding the following to a `pre-commit` script (in this case, a bash script) under `.git/hooks`.

```bash
# lint implementation files
node_modules/.bin/standardx --verbose | node_modules/.bin/snazzy
if [[ $? -ne 0 ]]; then
  echo 'JavaScript code style errors were detected. Aborting commit.'
  exit 1
fi

# lint type definition files
node_modules/.bin/eslint -c types/.eslintrc.js .
if [[ $? -ne 0 ]]; then
  echo 'TypeScript definition style errors were detected. Aborting commit.'
  exit 1
fi

# check copyright headers
node bin/precommit.js
if [[ $? -ne 0 ]]; then
  echo 'Copyright header changes were detected. Aborting commit to verify changes.'
  exit 1
fi
```

### Debug Mode

Running your app in debug mode using the `NODE_DEBUG` environment variable allows to log and inspect some low-level details of your app. Connector/Node.js provides support for this feature and uses it, in particular, for logging information about the protocol messages (inbound and outbound) that are effectively exchanged with the MySQL server.

Messages sent by the client are available under the `protocol:outbound` scope, whereas messages sent by the server are available under the `protocol:inbound` scope.

As an example, the following would write to `stderr` a textual protobuf representation of every `Mysqlx.Crud.Find` and `Mysqlx.Resultset.Row` messages.

```sh
$ NODE_DEBUG='protocol:outbound:Mysqlx.Crud.Find,protocol:inbound:Mysqlx.Resultset.Row' node app.js
```

Recent Node.js versions (`v10` and later) support the use of wildcard pattern matching via `NODE_DEBUG`, which means you can more easily do things such as:

- filtering inbound messages only (`NODE_DEBUG='protocol:inbound:*'`)
- filtering outbound messages only (`NODE_DEBUG='*:outbound:*'`)
- filtering all protocol messages (`NODE_DEBUG='protocol:*'`)
- show all logs (`NODE_DEBUG='*'`)

### Documentation

The API reference documentation and tutorials are available at the [website](https://dev.mysql.com/doc/dev/connector-nodejs/). It is also possible to generate these locally. To do that, use [JSDoc](https://jsdoc.app/) and [`ink-docstrap`](https://www.npmjs.com/package/ink-docstrap). Then execute the following command in the project root directory:

```sh
# assuming both jsdoc and ink-docstrap were installed globally
$ jsdoc -c .jsdocrc.json -t $(npm config get prefix)/lib/node_modules/ink-docstrap/template -R docs/Intro.md .
```

The command will generate the output files in the `docs/ref` directory.

## Getting Help

If you need help or just want to get in touch with us, please use the following resources:

* [MySQL Connector/Node.js Documentation](https://dev.mysql.com/doc/dev/connector-nodejs/)
* [`#connectors` channel in MySQL Community Slack](https://mysqlcommunity.slack.com/messages/connectors) ([Sign-up](https://lefred.be/mysql-community-on-slack/) required if you do not have an Oracle account)
* [MySQL Connector/Node.js forum](http://forums.mysql.com/list.php?44)
* [InsideMySQL.com Connectors Blog](https://insidemysql.com/category/mysql-development/connectors/)
