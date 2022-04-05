This package is implemented using pure JavaScript but provides TypeScript type declarations for the relevant parts of the public API. These are specified by proper type definition files under the `types` directory and should be automatically accessible to TypeScript-enabled IDEs and applications.

All the top-level types should be available under the `mysqlx.*` namespace. Everything else should be automatically inferred by the TypeScript engine.

> **IMPORTANT**<br />
> In order to encourage users to be up-to-date and protected from future breaking changes, deprecated client APIs and options in JavaScript do not have any corresponding TypeScript definitions and/or type declarations, and thus, are not allowed to be used.

The following are some basic examples of how to leverage the existing TypeScript declarations:

#### Adding documents to a collection

```javascript
import * as mysqlx from '@mysql/xdevapi';

let client: mysqlx.Client;
let session: mysqlx.Session;

let config: mysqlx.ConnectionOptions = {
    user: 'root',
    host: 'localhost'
};

try {
    client = mysqlx.getClient(config);
    session = await client.getSession();

    let schema = session.getSchema('ts_schema');

    if (!(await schema.existsInDatabase())) {
        schema = await session.createSchema('ts_schema');
    }

    let validationOptions: mysqlx.ValidationOptions = {
        level: mysqlx.Schema.ValidationLevel.OFF
    }

    let collectionOptions: mysqlx.CreateCollectionOptions = {
        reuseExisting: true,
        validation: validationOptions
    };

    let collection = await schema.createCollection('ts_collection', collectionOptions);

    let document: mysqlx.DocumentOrJSON = {
        name: 'foo'
    };

    let documents: mysqlx.CollectionDocuments = [document];

    let res = await collection.add(documents).execute();
    let affectedItems = res.getAffectedItemsCount();

    console.log(`${affectedItems} document(s) where added to ts.schema.ts_collection.`);
} finally {
    if (session) {
        await session.dropSchema('ts_schema');
        await session.close();
    }

    if (client) {
        await client.close();
    }
}
```

#### Parsing an X DevAPI expression

```javascript
import * as mysqlx from '@mysql/xdevapi';

let parserOptions: mysqlx.ParserOptions = {
    mode: mysqlx.Mode.TABLE
};

let expression: mysqlx.Expr = mysqlx.expr('name = "foo"')
```
