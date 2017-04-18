### UUID generation

When adding documents to a collection, if a document does not contain an `_id`, it will be automatically assigned a UUID-like value. This value does not strictly follow the format described by [RFC 4222](http://www.ietf.org/rfc/rfc4122.txt), but instead adheres to the following convention.

```txt
RFC 4122 UUID: 5C99CDfE-48CB-11E6-94F3-4A383B7fCC8B

MySQL Document ID: 4A383B7FCC8B-94F3-11E6-48CB-5C99CDFE
```

One can however provide a static `_id` for each document, or even provide a custom function to generate them in using some sort of special convention.

#### Using automatically assigned values

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060/testSchema')
    .then(session => {
        return session
            .getSchema('testSchema')
            .createCollection('testCollection');
    })
    .then(collection => {
        let docs = [];

        return Promise
            .all([
                collection.add({ name: 'foo' }).execute(),
                collection.find().execute(doc => docs.push(doc))
            ])
            .then(() => docs);
    })
    .then(docs => {
        // the `_id` value is just an example in this case
        console.log(docs); // [{ _id: '4A383B7FCC8B-94F3-11E6-48CB-5C99CDFE', name: 'foo' }]
    })
```

#### Using static values

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060/testSchema')
    .then(session => {
        return session
            .getSchema('testSchema')
            .createCollection('testCollection');
    })
    .then(collection => {
        let docs = [];

        return Promise
            .all([
                collection.add({ _id: 1, name: 'foo' }).execute(),
                collection.find().execute(doc => docs.push(doc))
            ])
            .then(() => docs);
    })
    .then(docs => {
        console.log(docs); // [{ _id: 1, name: 'foo' }]
    })
```

#### Using a generator function

```js
const crypto = require('crypto');
const mysqlx = require('@mysqlx/xdevapi');

const options = {
    dbHost: 'localhost',
    dbPort: 33060,
    idGenerator: () => crypto.randomBytes(4).toString('hex'),
    schema: 'testSchema'
};

mysqlx
    .getSession(options)
    .then(session => {
        return session
            .getSchema('testSchema')
            .createCollection('testCollection');
    })
    .then(collection => {
        let docs = [];

        return Promise
            .all([
                collection.add({ name: 'foo' }).execute(),
                collection.find().execute(doc => docs.push(doc))
            ])
            .then(() => docs);
    })
    .then(docs => {
        // the `_id` value is just an example in this case
        console.log(docs); // [{ _id: 'ccdef991', name: 'foo' }]
    })
```

Node: the id generator function can only be provided through a session configuration object.
