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
* Develop your pull request. Make sure you are aware of the requirements for the project (e.g. do not require Node.js 0.x if we are supporting Node.js 4.x and higher).
* Validate your pull request by including tests that sufficiently cover the functionality you are adding.
* Verify that the entire test suite passes with your code applied.
* Submit your pull request. While you can submit the pull request via [GitHub](https://github.com/mysql/mysql-connector-nodejs/pulls), you can also submit it directly via [bugs.mysql.com](https://bugs.mysql.com).

Thanks again for your wish to contribute to MySQL. We truly believe in the principles of open source development and appreciate any contributions to our projects.

## Setting Up a Development Environment

The following tips provide all the technical directions you should follow when writing code and before actually submitting your contribution.

### Executing the Test Suite

The test suite is composed of three different categories of automated tests:

* Unit tests
* Functional tests
* Compatibility tests

Each test suite can be executed individually or the entire set can be executed altogether. Unit tests can be executed standalone without any external dependencies by running the following command:

```sh
$ npm run test:unit
```

The functional test suite requires a running MySQL server instance (the latest version available) using the X Plugin. By default, if the server is initialized using `--initialize-insecure`, all that is needed to execute the tests is the following command:

```sh
$ npm run test:functional
```

If the server is initialized using custom configuration details, those can be provided to the test runner using the following environment variables:

* `NODE_TEST_MYSQL_HOST` (`localhost` by default)
* `NODE_TEST_MYSQL_PASSWORD` (empty by default)
* `NODE_TEST_MYSQL_PORT` (`33060` by default)
* `NODE_TEST_MYSQL_SOCKET` (`${os.tmpdir()}/mysqlx.sock` by default)
* `NODE_TEST_MYSQL_SCHEMA` (`nodejsmysqlxtest` by default)

For example:

```sh
$ NODE_TEST_MYSQL_USER=foo NODE_TEST_MYSQL_USER=bar NODE_TEST_MYSQL_PORT=33061 npm run test:functional
```

The two test suites can be executed together using the following command:

```sh
$ npm run test:latest
```

Additionally, there is a test suite which is meant to test compatibility of certain features using older or specific MySQL server versions. This test suite requires [`docker`](https://docs.docker.com/install/) and [`docker-compose`](https://docs.docker.com/compose/install/) to setup those server instances in the test environment.

After the additional external components are installed, the test suite can be executed via the following command:

```sh
$ npm run test:compatibility
```

The same applies when executing the entire set of test suites, which can be done using one of the following commands and any of the environment commands mentioned above:

```sh
$ npm t
$ npm test
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
$ npm run coverage:compatibility
$ npm run coverage:latest
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

## Getting Help

If you need help or just want to get in touch with us, please use the following resources:

* [MySQL Connector/Node.js Documentation](https://dev.mysql.com/doc/dev/connector-nodejs/)
* [`#connectors` channel in MySQL Community Slack](https://mysqlcommunity.slack.com/messages/connectors) ([Sign-up](https://lefred.be/mysql-community-on-slack/) required if you do not have an Oracle account)
* [MySQL Connector/Node.js forum](http://forums.mysql.com/list.php?44)
* [InsideMySQL.com Connectors Blog](https://insidemysql.com/category/mysql-development/connectors/)
