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
* Sign the Oracle Contributor Agreement. You can find instructions for doing that at the [OCA Page](https://www.oracle.com/technetwork/community/oca-486395.html).
* Develop your pull request. Make sure you are aware of the requirements for the project (e.g. do not require Node.js 0.x if we are supporting Node.js 12.x and higher).
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
* `MYSQLX_PASSWORD` (empty by default)
* `MYSQLX_PORT` (`33060` by default)
* `MYSQLX_SOCKET` (`undefined` by default)
* `MYSQLX_DEFAULT_SCHEMA` (`'nodejsmysqlxtest'` by default)

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

### Code Style and Convention

Any change to the project's source code must also follow the standard set of code style/convention rules enforced by the existing tooling infrastructure. So, before submitting a patch, you can check if it violates any of those rules using the following:

```sh
$ npm run linter:checks
```

Some categories of problems can easily be addressed and automatically fixed by running:

```sh
$ npm run linter:fixes
```

The project maintainers reserve the right, of course, to further extend or amend any change in order to enforce additional informal rules.

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

## Getting Help

If you need help or just want to get in touch with us, please use the following resources:

* [MySQL Connector/Node.js Documentation](https://dev.mysql.com/doc/dev/connector-nodejs/)
* [`#connectors` channel in MySQL Community Slack](https://mysqlcommunity.slack.com/messages/connectors) ([Sign-up](https://lefred.be/mysql-community-on-slack/) required if you do not have an Oracle account)
* [MySQL Connector/Node.js forum](http://forums.mysql.com/list.php?44)
* [InsideMySQL.com Connectors Blog](https://insidemysql.com/category/mysql-development/connectors/)
