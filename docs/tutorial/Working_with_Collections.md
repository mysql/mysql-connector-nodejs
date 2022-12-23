The X DevAPI includes methods for working with NoSQL collections and relational tables. This tutorial presents the Connector/Node.js implementation of the X DevAPI.

Some of the examples assume a session was created and a `session` object exists. There is a [section]{@tutorial Connecting_to_a_Server} that describes in detail how to connect to the database and create an X Protocol session. Additionally, the API also provides utility methods for working with [single documents]{@tutorial Working_with_Documents}.

#### Creating collections

A collection is a special-purpose table for storing documents. For creating a collection the user only has to provide a name to {@link module:Schema#createCollection}:

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.getSchema('mySchema').createCollection('myCollection');
    })
    .then(collection => {
        // Use the Collection instance.
    })
    .catch(err => {
        // Something went wrong.
    });
```

The `createColletion` function returns a Promise which resolves to a {@link module:Collection|Collection} object on success.

If a given collection already exists in the database, the `createCollection` call will fail unless the `reuseExisting` property is defined in an additional options object such as the following:

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(sesion => {
        return session.getSchema('mySchema').createCollection('myCollection', { reuseExisting: true })
    });
```

This options object can be used to, for instance, create a server-side document validation schema. For that, one can include a `schema` property matching a valid [JSON Schema](https://json-schema.org/) definition within an outer {@link module:Schema.SchemaValidationOptions|`validation`} object. The {@link ValidationLevel|`level`} property, used to effectively enable (`'STRICT'`) or disable (`'OFF'`) a schema, should also be included.

```javascript
const mysqlx = require('@mysql/xdevapi');
const validation = { schema: { type: 'object', properties: { name: { type: 'string' } } }, level: mysqlx.Schema.ValidationLevel.STRICT };

mysqlx.getSession('mysqlx://localhost:33060')
    .then(sesion => {
        return session.getSchema('mySchema').createCollection('myCollection', { validation })
    });
```

When trying to insert a document that violates the schema definition for the collection, an error is thrown:

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060/mySchema')
    .then(sesion => {
        return session.getDefaultSchema().getCollection('myCollection').add({ name: 1 }).execute();
    })
    .catch(err => {
        console.log(err.message); // Document is not valid according to the schema assigned to collection. The JSON document location '#/name' failed requirement 'type' at JSON Schema location '#/properties/name'.
    });
```

The schema is created but not enabled when the {@link ValidationLevel|`level`} property is absent or set to `'OFF'`, and any document will end up being inserted in that case.

```javascript
const mysqlx = require('@mysql/xdevapi');
const validation = { schema: { type: 'object', properties: { name: { type: 'string' } } } };

mysqlx.getSession('mysqlx://localhost:33060')
    .then(sesion => {
        return session.getSchema('mySchema').createCollection('myCollection', { validation })
    })
    .then(collection => {
        // the following will work fine
        return collection.add({ name: 1 }).execute();
    });
```

```javascript
const mysqlx = require('@mysql/xdevapi');
const validation = { schema: { type: 'object', properties: { name: { type: 'string' } } }, level: mysqlx.Schema.ValidationLevel.OFF };

mysqlx.getSession('mysqlx://localhost:33060')
    .then(sesion => {
        return session.getSchema('mySchema').createCollection('myCollection', { validation })
    })
    .then(collection => {
        // the following will work fine
        return collection.add({ name: 1 }).execute();
```

The `modifyCollection()` method is used to enable a JSON Schema on an existing collection (or to update it if it already exists).

```javascript
const mysqlx = require('@mysql/xdevapi');
const validation = { schema: { type: 'object', properties: { name: { type: 'string' } } }, level: mysqlx.Schema.ValidationLevel.STRICT };

mysqlx.getSession('mysqlx://localhost:33060')
    .then(sesion => {
        return session.getSchema('mySchema').modifyCollection('myCollection', { validation })
    });
```

Disabling the JSON schema on an existing collection can be done by setting the {@link ValidationLevel|`level`} property to `'OFF'` under the {@link module:Schema.SchemaValidationOptions|`validation`} options object.

```javascript
const mysqlx = require('@mysql/xdevapi');
const validation = { level: mysqlx.Schema.ValidationLevel.OFF }

mysqlx.getSession('mysqlx://localhost:33060')
    .then(sesion => {
        return session.getSchema('mySchema').modifyCollection('myCollection', { validation })
    });
```

Re-enabling the JSON schema can be some by setting the {@link ValidationLevel|`level`} property back to `'STRICT'`.

```javascript
const mysqlx = require('@mysql/xdevapi');
const validation = { level: mysqlx.Schema.ValidationLevel.STRICT }

mysqlx.getSession('mysqlx://localhost:33060')
    .then(sesion => {
        return session.getSchema('mySchema').modifyCollection('myCollection', { validation })
    });
```

#### Listing all the existing collections

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const schema = session.getSchema('foo');

        return Promise.all([schema.createCollection('bar'), schema.createCollection('baz')])
            .then(() => {
                return schema.getCollections();
            });
    })
    .then(collections => {
        console.log(collections[0].getName()); // 'bar'
        console.log(collections[1].getName()); // 'baz'
    });
```

#### Dropping a collection

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const schema = session.getSchema('foo');

        return schema.createCollection('bar')
            .then(() => {
                return schema.dropCollection('bar');
            });
    });
```

#### Handling documents in existing collections

Considering a collection `mySchema.myCollection` containing the following documents:

```json
[{
    "_id": 1,
    "name": "foo",
    "meta": {
        "nested": "bar"
    }
}, {
    "_id": 2,
    "name": "bar",
    "meta": {
        "nested": "baz"
    }
}]
```

These documents can be modified or removed under some specific conditions, as shown below.

To modify/remove specific documents from a collection, one should provide the appropriate filtering condition when calling `modify()` or `remove()`. For more details about the expression format, please check the [user guide](https://dev.mysql.com/doc/x-devapi-userguide/en/crud-ebnf-other-definitions.html#crud-ebnf-searchconditionstr).

To modify/remove all documents from a collection, one should provide any expression that evaluates to `true` (if no expression is provided, executing the operation will result in an error) when calling `modify()` or `remove()`.

#### Removing documents that match a given criteria

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection
            // The criteria is defined through the expression.
            .remove('name = :name')
            .bind('name', 'foo')
            .execute()
            .then(() => {
                return collection.find()
                    .execute();
            })
            .then(result => {
                console.log(result.fetchAll()); // [{ _id: 2, name: 'bar', meta: { nested: 'baz' } }]
            });
    });
```

#### Removing all documents

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection
            // The expression should evaluate to `true`.
            .remove('true')
            .execute()
            .then(() => {
                return collection.find()
                    .execute();
            })
            .then(result => {
                console.log(result.fetchAll()); // []
            });
    });
```

#### Modifying documents that match a given criteria

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection
            // The criteria is defined through the expression.
            .modify('_id = :id')
            .bind('id', 1)
            .set('name', 'baz')
            .execute()
            .then(() => {
                return collection.find()
                    .execute();
            })
            .then(result => {
                console.log(result.fetchAll());
                // [
                //      { _id: 1, name: 'baz', meta: { nested: 'bar' } },
                //      { _id: 2, name: 'bar', meta: { nested: 'baz' } }
                // ]
            });
    });
```

#### Modifying all documents

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection
            // The expression should evaluate to `true`.
            .modify('true')
            .set('name', 'baz')
            .set('meta.nested', 'quux')
            .execute()
            .then(() => {
                return collection.find()
                    .execute();
            })
            .then(result => {
                console.log(result.fetchAll());
                // [
                //      { _id: 1, name: 'baz', meta: { nested: 'quux' } },
                //      { _id: 2, name: 'baz', meta: { nested: 'quux' } }
                // ]
            });
    });
```

#### Bulk-updating multiple document properties

Additionaly, besides explicitly updating individual document properties with `set()`, the `patch()` method allows to update multiple properties in a single call.

Using `patch()` will remove properties containing a `null` value, add previously nonexisting properties and update the existing ones. This behavior also applies to nested properties.

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.modify('_id = 1')
            .patch({ name: 'qux', meta: { nested: null, other: 'quux' } })
            .execute()
            .then(() => {
                return collection.find()
                    .execute();
            })
            .then(result => {
                console.log(result.fetchAll());
                // [
                //      { _id: 1, name: 'qux', meta: { other: 'quux' } },
                //      { _id: 2, name: 'bar', meta: { nested: 'baz' } }
                // ]
            });
    });
```

Note: the criteria expression string provided via `modify()` establishes the filtering rules, thus any `_id` value provided as part of the properties to be updated will simply be ignored (and will not be updated).

#### Retrieving the collection size

The `count()` method retrieves the collection size at a given point in time.

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        return session.getSchema('mySchema').getCollection('myCollection').count();
    })
    .then(count => {
        console.log(count); // 2
    });
```

### Cursors

The `fetchAll()` method to retrieve the entire result set originated by each `find()` query. This method pulls the data from memory and flushing it subsequently. There are, however, two alternive APIs for consuming result set entries individually using a cursor. One API uses a regular pull-based cursor via an additional `fetchOne()` method available in the {@link module:Result|Result} instance. The other is a pull-based API that works with a callback function provided in the `execute()` method, which totally disables buffering at the connector-level and leaves that responsability to the application.

#### Pull-based approach

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.find()
            .execute()
            .then(result => {
                console.log(result.fetchOne()); // { _id: 1, name: 'qux', meta: { other: 'quux' } }
                console.log(result.fetchOne()); // { _id: 2, name: 'bar', meta: { nested: 'baz' } }
            });
    });
```

#### Push-based approach

```javascript
const mysqlx = require('@mysql/xdevapi');
const docs = [];

mysqlx.getSession('mysqlx://localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.find()
            .execute(doc => docs.push(doc))
            .then(() => {
                console.log(docs);
                // [
                //      { _id: 1, name: 'qux', meta: { other: 'quux' } },
                //      { _id: 2, name: 'bar', meta: { nested: 'baz' } }
                // ]
            });
    });
```

### Unsafe numeric values

It is important to understand the difference in how a numeric values are represented both in a JSON string and the corresponding plain JavaScript object. The JSON specification does not enforce any limitation with regards to the size and precision of a numeric value. Traditionally, all numeric values in a JSON string are converted to a corresponding JavaScript `number` when the string is parsed as a plain JavaScript object (`JSON.parse()`). This means that an integer lower than `Number.MIN_SAFE_INTEGER` or higher than `Number.MAX_SAFE_INTEGER` will lose precision on the type conversion. Additionally, decimal numbers will also lose precision depending on the total number of digits and the size of the fractional part.

Given this limitation, the connector uses a 3rd-party JSON parser that allows to specify the type into which a given numeric value will be converted. In this case, by default, when a numeric value risks loosing precision, it is converted into a JavaScript `string`.

For integer values in particular, an application can customize this behaviour by selecting from one of the following alternatives instead:

- all integers are preseved as a `string`
- all integers are preserved as a `BigInt`
- only unsafe integers are preserved as a `BigInt`

Selecting the appropriate strategy for handling unsafe integers in a result set can be done via a corresponding connection option.

Assuming a collection `c` within an existing schema `s` that contains the following document:

```json
{
    "safeNegative": -123,
    "safePositive": 123,
    "unsafeNegative": -9223372036854775808,
    "unsafePositive": 18446744073709551615
}
```

**Convert all integers in the result set to a JavaScript `string`**

```javascript
mysqlx.getSession({ integerType: mysqlx.IntegerType.STRING, host: 'localhost', user: 'root', schema: 's' })
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .find('unsafeNegative = :un and unsafePositive = :up')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808') or '-9223372036854775808'
            .bind('up', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // { safeNegative: '-123', safePositive: '123', unsafeNegative: '-9223372036854775808', unsafePositive: '18446744073709551615' }
    });

mysqlx.getSession('mysqlx://root@localhost/s?integer-type=string')
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .find('unsafeNegative = :un and unsafePositive = :up')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808') or '-9223372036854775808'
            .bind('up', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // { safeNegative: '-123', safePositive: '123', unsafeNegative: '-9223372036854775808', unsafePositive: '18446744073709551615' }
    });
```

**Convert only unsafe integers in the result set to a JavaScript `string` (DEFAULT)**

```javascript
mysqlx.getSession({ integerType: mysqlx.IntegerType.UNSAFE_STRING, host: 'localhost', user: 'root', schema: 's' })
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .find('unsafeNegative = :un and unsafePositive = :up')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808') or '-9223372036854775808'
            .bind('up', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // { safeNegative: -123, safePositive: 123, unsafeNegative: '-9223372036854775808', unsafePositive: '18446744073709551615' }
    });

mysqlx.getSession('mysqlx://root@localhost/s?integer-type=unsafe_string')
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .find('unsafeNegative = :un and unsafePositive = :up')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808') or '-9223372036854775808'
            .bind('up', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // { safeNegative: -123, safePositive: 123, unsafeNegative: '-9223372036854775808', unsafePositive: '18446744073709551615' }
    });
```

**Convert all integers in the result set to a JavaScript `BigInt`**

```javascript
mysqlx.getSession({ integerType: mysqlx.IntegerType.BIGINT, host: 'localhost', user: 'root', schema: 's' })
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .find('unsafeNegative = :un and unsafePositive = :up')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808') or '-9223372036854775808'
            .bind('up', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // { safeNegative: -123n, safePositive: 123n, unsafeNegative: -9223372036854775808n, unsafePositive: 18446744073709551615n }
    });

mysqlx.getSession('mysqlx://root@localhost/s?integer-type=bigint')
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .find('unsafeNegative = :un and unsafePositive = :up')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808') or '-9223372036854775808'
            .bind('up', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // { safeNegative: -123n, safePositive: 123n, unsafeNegative: -9223372036854775808n, unsafePositive: 18446744073709551615n }
    });
```

**Convert only unsafe integers in the result set to a JavaScript `BigInt`**

```javascript
mysqlx.getSession({ integerType: mysqlx.IntegerType.UNSAFE_BIGINT, host: 'localhost', user: 'root', schema: 's' })
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .find('unsafeNegative = :un and unsafePositive = :up')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808') or '-9223372036854775808'
            .bind('up', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // { safeNegative: -123, safePositive: 123, unsafeNegative: -9223372036854775808n, unsafePositive: 18446744073709551615n }
    });

mysqlx.getSession('mysqlx://root@localhost/s?integer-type=unsafe_bigint')
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .find('unsafeNegative = :un and unsafePositive = :up')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808') or '-9223372036854775808'
            .bind('up', 18446744073709551615n) // BigInt('18446744073709551615') or '18446744073709551615'
            .execute();
    })
    .then(res => {
        console.log(res.fetchOne()); // { safeNegative: -123, safePositive: 123, unsafeNegative: -9223372036854775808n, unsafePositive: 18446744073709551615n }
    });
```

Statements created and executed by an application that operate on JSON fields containing unsafe numeric values can also be specified with a JavaScript `string` or `BigInt` (if it is an integer, as depicted in the examples above). This is possible not only on placeholder assignments using the `bind()` method, but also on every other method and API used as a CRUD statement building block, like in the following examples:

**Add unsafe integers to a document**

```javascript
mysqlx.getSession({ user: 'root', host: 'localhost', schema: 's' })
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .add({ unsafePositive: 18446744073709551615n /* or BigInt('18446744073709551615') */ })
            .execute();
    });
```

**Update an unsafe integer in one or more documents**

```javascript
mysqlx.getSession({ user: 'root', host: 'localhost', schema: 's' })
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .modify('unsafeNegative = :un')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808')
            .set('up', 9223372036854775807n) // BigInt('9223372036854775807')
            .execute();
    });

mysqlx.getSession({ user: 'root', host: 'localhost', schema: 's' })
    .then(session => {
        return session.getDefaultSchema().getCollection('c')
            .modify('unsafeNegative = :un')
            .bind('un', -9223372036854775808n) // BigInt('-9223372036854775808')
            .set('up', 9223372036854775807n) // BigInt('9223372036854775807')
            .execute();
    });
```

### Collection indexes

Collection indexes are ordinary MySQL indexes on virtual columns that extract data from JSON document. To create an index, both the index name and the index definition are required.

The index definition contains the following properties:
```text
{string} [type] - index type, INDEX (default) or SPATIAL
{array} fields - the list of field definitions, each with the following properties:
    {string} field - the path of the underlying document field
    {string} type - the index type (see list of available types below)
    {boolean} required - whether the generated column will be created as NOT NULL
    {boolean} array - whether the underlying document field is an array, which requires a multi-value index
    {number} [options] - describes how to handle GeoJSON documents that contain geometries with coordinate dimensions higher than 2
    {number} [srid] - unique value used to unambiguously identify projected, unprojected, and local spatial coordinate system definitions
```

An index can be created using one of the following types:
```text
INT [UNSIGNED]
TINYINT [UNSIGNED]
SMALLINT [UNSIGNED]
MEDIUMINT [UNSIGNED]
INTEGER [UNSIGNED]
BIGINT [UNSIGNED]
REAL [UNSIGNED]
FLOAT [UNSIGNED]
DOUBLE [UNSIGNED]
DECIMAL [UNSIGNED]
NUMERIC [UNSIGNED]
DATE
TIME
TIMESTAMP
DATETIME
CHAR[(length)]
TEXT[(length)]
GEOJSON (extra options: options, srid)
```

Additional details about spacial indexes can be found [here](https://dev.mysql.com/doc/refman/8.0/en/spatial-geojson-functions.html).

#### Creating a regular index

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root@localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.createIndex('zip', {
            fields: [{
                field: '$.zip',
                type: 'TEXT(10)',
                required: false
            }]
        });
    })
    .then(status => {
        console.log(status); // true
    })
    .catch(err => {
        // the operation failed
    });
```

#### Creating a multi-value index

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root@localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.createIndex('tags', {
            fields: [{
                field: '$.tags',
                type: 'CHAR(50)',
                array: true
            }]
        });
    })
    .then(status => {
        console.log(status); // true
    })
    .catch(err => {
        // the operation failed
    });
```

#### Creating a spatial index

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root@localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.createIndex('coords', {
            fields: [{
                field: '$.coords',
                type: 'GEOJSON',
                required: true,
                options: 1234,
                srid: 1234
            }],
            type: 'SPATIAL'
        });
    })
    .then(status => {
        console.log(status); // true
    })
    .catch(err => {
        // the operation failed
    });
```

#### Dropping an index

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root@localhost:33060')
    .then(session => {
        const collection = session.getSchema('mySchema').getCollection('myCollection');

        return collection.dropIndex('zip');
    })
    .then(status => {
        console.log(status); // true
    })
    .catch(err => {
        // the operation failed
    });
```

#### Gotchas

Unique indexes are currently not supported by the X Plugin.

Due to other limitations of the X Plugin, `SPATIAL` indexes for `GEOJSON` fields and `NOT NULL` indexes for `DATE` and/or `DATETIME` fileds cannot be created.

Index definitions for document fields containing arrays should explicitly specify a multi-value option (`array: true`).
