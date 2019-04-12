# MySQL Connector/Node.js

[![Languages](https://img.shields.io/github/languages/top/mysql/mysql-connector-nodejs.svg?style=flat)](https://github.com/mysql/mysql-connector-nodejs) [![License: GPLv2 with FOSS exception](https://img.shields.io/badge/license-GPLv2_with_FOSS_exception-c30014.svg?style=flat)](https://github.com/mysql/mysql-connector-nodejs/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/@mysql/xdevapi.svg?style=flat)](https://www.npmjs.com/package/@mysql/xdevapi)

MySQL Connector/Node.js is a MySQL 8 driver for Node.js officially supported and maintained by Oracle. It contains an implementation of the [X DevAPI](https://dev.mysql.com/doc/x-devapi-userguide/en/), an Application Programming Interface for working with the [MySQL Document Store](https://dev.mysql.com/doc/refman/8.0/en/document-store.html) through CRUD-based, NoSQL operations.

For detailed information, please visit the official [MySQL Connector/Node.js documentation](https://dev.mysql.com/doc/dev/connector-nodejs/).

## Licensing

Please refer to the [README.txt](https://github.com/mysql/mysql-connector-nodejs/blob/master/README.txt) and [LICENSE](https://github.com/mysql/mysql-connector-nodejs/blob/master/LICENSE) files, available in this repository, for further details.

## Getting the Latest Release

MySQL Connector/Node.js is free for usage under the terms of the specified licensing and it runs on any Operating System that supports a Node.js 4.2.0 (or higher) runtime. Packages can and should be installed in your project using the npm CLI.

Since releases do **NOT** follow [Semantic Versioning](https://semver.org/) rules, it is advised to install a specific version of the package (the latest preferably) or by using an additional standard lockfile such as [`npm-shrinkwrap.json`](https://docs.npmjs.com/files/shrinkwrap.json.html) or [`package-lock.json`](https://docs.npmjs.com/files/package-lock.json) depending on the version of the npm CLI you are using.

### Installing from the npm registry

The recommended way for installing MySQL Connector/Node.js is by using the npm registry directly. That can be done by running following command in the project root directory:

```sh
$ npm install @mysql/xdevapi --save --save-exact
```

### Downloading and Installing manually

Alternatively, MySQL Connector/Node.js tarballs are also available in the [official download page](https://dev.mysql.com/downloads/connector/nodejs/). To install the package you can run the following command in the project root directory:

```sh
$ npm install /path/to/mysql-connector-nodejs-<version>.tar.gz --save --save-exact
```

### GitHub Repository

The GitHub repository contains the MySQL Connector/Node.js source code as per the latest release. No changes are published in the repository between releases.

## Contributing

There are a few ways to contribute to the Connector/Node.js code. Please refer to the [contributing guidelines](https://github.com/mysql/mysql-connector-nodejs/blob/master/CONTRIBUTING.md) for additional information.

## Additional Resources

* [MySQL Connector/Node.js Documentation](https://dev.mysql.com/doc/dev/connector-nodejs/)
* [MySQL X DevAPI User Guide](https://dev.mysql.com/doc/x-devapi-userguide/en/)
* [MySQL Document Store](https://dev.mysql.com/doc/refman/en/document-store.html)
* [MySQL Connector/Node.js forum](http://forums.mysql.com/list.php?44)
* [`#connectors` channel in MySQL Community Slack](https://mysqlcommunity.slack.com/messages/connectors) ([Sign-up](https://lefred.be/mysql-community-on-slack/) required if you do not have an Oracle account)
* [Twitter](https://twitter.com/mysql)
* [InsideMySQL.com Connectors Blog](https://insidemysql.com/category/mysql-development/connectors/)
* [MySQL Public Bug Tracker](https://bugs.mysql.com/)

For more information about this and other MySQL products, please visit [MySQL Contact & Questions](https://www.mysql.com/about/contact/).

[![Follow MySQL on Twitter](https://img.shields.io/twitter/follow/MySQL.svg?label=Follow%20%40MySQL&style=social)](https://twitter.com/intent/follow?screen_name=MySQL)
