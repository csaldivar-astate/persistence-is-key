# Persistence is Key

## Environment Variables

As you know, we should always avoid hard coding data. However, we did exactly that when we define the `PORT` number in our code. As we start adding more features to the app we will just keep hard coding more values. Instead we should use **environment variables**. This are variables that you can define in the command line before executing code and then access them in scripts. We can use env vars to remove hard coded data. This will be especially useful once you deploy final applications to a production server. You just need to edit the environment variables rather than the source code itself.

Instead of defining these variables on the command line explicitly we will use an **configuration file**. Then use code to read the file and create the variables. Fortunately, there is a node module for that called `dotenv`.

First create a file named `.env` in the root of your project directory and add the following:

```sh
PORT=8080
DB="wordle.db"
```

This defines an environment variable named `DB` that has the value `"wordle.db"` and a variable `PORT` that has the value `"8080"`. Notice how I wrote `"8080"` as string? **env vars are always strings!** However, this is won't be a problem for our current use case. 

Our code still can't access this data. You need to install the `dotenv` module. Then in `server.js` and `app.js` add the following line:

```js
"use strict";
require("dotenv").config();
```

You should **always** add this line to your project's entry point, `server.js` in this case. You also need to add it to `app.js` so the test cases will work. It should always be the 2nd line of your script (after `"use strict";`) because you want to make sure the variables exist before doing anything else.

Now you can access any of your environment variables by using the global `process` object like this:

```js
console.log(process.env.PORT);
console.log(process.env.DB);
```

## `server.js`

Your `server.js should now use the environment variable instead of a hardcoded port number.

```js
"use strict";
require("dotenv").config();

const app = require("./app");

app.listen(process.env.PORT, () => {
    console.log(`Listening on port: ${process.env.PORT}`);
});
```

## Making the database

First you'll need to create a file named `schema.sql` in your `Database` directory. Inside this file you should add the SQL code necessary to create the following table:

Table Name: `Dictionary`
Columns:

| name | data type | constraint
| :-: | :-: | :-: |
| word | text | primary key |

That's it! Just one column. We'll add more as we develop this app but this is all we need for now. Once that file is created you can set up your project to automate initializing the database. **Make sure you only create the table if it doesn't already exist**

## `db.js`

Don't forget to add `db.js` to your `Models` directory.

```js
"use strict";
const Database = require('better-sqlite3');
const db = new Database(`./Database/${process.env.db}`);

// Signal handlers to close the database when the code
// terminates (whether successfully or due to a signal)
process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));

module.exports = db;
```

## `init-db.js`

Now that we have a `schema.sql` file, we need a way of executing the SQL script. We could run it from the command line; however, this is brittle since it means we would have to remember to do it. It would be better if we could automate the process. We can do this using `npm` scripts inside of `package.json`, but first we need a JS file to set up the database.

Create the file `init-db.js` inside of your `Database` directory and copy these contents. Make sure you understand what's going on in this script before moving forward. We are using the `fs` module to read the `schema.sql` file. This module is part of Node's standard library so it's already installed.

```js
"use strict";
require('dotenv').config()          // Don't forget to set up environment variables
const fs = require("fs");           // fs module grants file system access
const db = require("../Models/db"); // We need our db connection

// Now read the schema.sql file into a string
// It is ok to do this synchronously since this script executes before loading the server
const schemaString = fs.readFileSync(__dirname + "/schema.sql", "utf-8");

// Now just run the sql file
db.exec(schemaString);
```

## `npm` scripts

Now we can create the `npm` script to initialize the database. `npm` scripts are just CLI commands that we add to `package.json`. So open your `package.json` you should already have a `"test"` and `"test:watch"` script that I've added. Now add a new script to the `"scripts"` object with the key `"init-db"` and the value `"node ./Database/init-db.js"` 

```json
  "scripts": {
        "test": "jest",
        "test:watch": "jest --watch",
        "init-db": "node ./Database/init-db.js"
    },
```

The `init-db` script will simply execute the `init-db.js` file you made previously. Now you can initialize the database by running the command `npm run init-db` in your terminal. However, we still have to remember to run the command *before* starting the server. Let's add another script that will do both.

Add the `"start-dev"` script like shown below. This script will initialize the database *and then* start the server. 

```json
  "scripts": {
        "test": "jest",
        "test:watch": "jest --watch",
        "init-db": "node ./Database/init-db.js",
        "start-dev": "npm run init-db && nodemon server.js"
    },
```

Now when you want to run your server during development you can just run the command `npm run start-dev`. This will handle db initialization and start nodemon for you.

Now that your environment is set up you can start dev. 

## The model

Now your database is set up and you need a way to interact with it. We are going to have a gentle introduction to the MVC design pattern. For now we'll just use **models**. Create a new directory in the root of your project called `Models`. Then add a new file called `dictionaryModel.js`. You'll need to create a few functions in this file.

You should `require` your `db` object from `db.js`.

For every function: Catch any errors and log them with `console.error()`.

### `addWord()`

Create a function called `addWord()` which will insert a new word into the `Dictionary` database. You must ensure that the word is exactly 5 letters before inserting into the database. Convert the word to all lower case **before** inserting into the database. There should be no return value.

### `addManyWords()`

Create a function called `addManyWords()` which takes an array of words and inserts each of them into the database using `addWord()`. There should be no return value

### `removeWord()`

Create a function called `removeWord()` which will take a single parameter `word` and delete it from the the `Dictionary` table. It should have no return value.

### `getRandomWord()`

Create a function called `getRandomWord()` which takes no parameters. It should retrieve a random word from the `Dictionary` table.

You can achieve this by using the `ORDER BY` clause, the SQL `RANDOM()` function and the `LIMIT` clause. 

```sql
-- This will select all rows from the specified table in a random order
-- then limit the output to only return one row
SELECT * FROM <insert_table_name_here> ORDER BY RANDOM() LIMIT 1;
```

### Exporting the Functions

Now that the four functions are created you need to export them so you can use them in `app.js`. The syntax is slightly different for exporting multiple things. 

Add the following to the end of `dictionaryModel.js`

```js
exports.addWord       = addWord;
exports.addManyWords  = addManyWords;
exports.removeWord    = removeWord;
exports.getRandomWord = getRandomWord;
```

## `app.js`

Now in `app.js` it's business as usual but don't forget to `require()` your model.

```js
const dictionaryModel = require("./Models/dictionaryModel");
```

You can use dot syntax to call the functions you exported. For example:

```js
// This is just a syntax example
dictionaryModel.addWords(words);
```

Now you can add your endpoints.

### `POST /api/dictionary`

This endpoint will accept a JSON encoded request body:

| key | type |
| :-: | :-:  |
| words | Array |

This object will contain a single key, `words`, which is an array of strings. If `words` is not present or if the array is empty then respond with status `400 Bad Request`. Add these to the database and respond with status `201 Created`.

### `DELETE /api/dictionary`

This endpoint will take a JSON encoded request body:

| key | type |
| :-: | :-:  |
| word | string |

If the `word` key is missing then respond with status `400 Bad Request`. If it is present then delete the word from the database and then respond with status `204 No Content`. 

You may be wondering "What if the word isn't in the database?" That's not a problem. The SQL just won't delete anything and you'll respond with `204 No Content` anyway. 

### `POST /api/word`

This endpoint will get a random word from the database and store it in a global variable. Respond with status `204 No Content`.

### `GET /api/word`

This endpoint is to support the test cases. The test cases need to know what the correct word is so they can validate the responses. So this endpoint will just send back the JSON encoded body:

```json
{
    "word": <whatever the word is>
}
```

### `POST /api/guess`

This endpoint will accept a JSON encoded request body:

| key | type |
| :-: | :-:  |
| guess | string |

If the correct word has not be set by the `POST /api/word` endpoint then you should respond with status `400 Bad Request`. If the guess is empty or not exactly `5` characters then respond with status `400 Bad Request`.

If the guessed word is not in the database then respond with status `404 Not Found`.

Now that the `guess` is validated you can check implement the game logic. Respond with a JSON encoded object with the following key:

| key | type |
| :-: | :-:  |
| result | string |

To generate the result of the guess you must create a new function called `checkWord()`. After calling this function this endpoint should then send back the response.

#### `checkWord()`

This function will take a single parameter, `guess`, and check it against the correct word set in the global scope. It will return a 5 character string containing the results for each position:

| character | meaning |
| :-: | :-:  |
| `"c"` | correct letter in the correct position |
| `"p"` | the letter is in the word but in the wrong position |
| `"w"` | the letter is not in the word |

For example, if the guess was `"mayor"` and the correct word was `"humor"`. Then the return value would be the string: `"pwwcc"`. 

You can iterate over a string using a simple `for` loop and subscript it like you would an array. You can also use the string's `.includes()` method. Check the [docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes) for examples.

## Bonus: IP based words & guess limits

We cannot limit how many guesses each user makes because we cannot who is sending each request. However, we can implement a rudimentary system by using IP addresses*.

Remove the single global variable that holds the correct word and replace it with a global object called `gameState`. This object will hold the correct word for each IP address and the current number of guess. It will work very similar to the last homework.

The keys for this object will be the IP addresses and the values will be another object. This nested object will contain the keys `word` and `numGuesses`. For example, `gameState` would look like this:

```js
{
    // "::1" is the IPv6 address for localhost; aka 127.0.0.1
    // this is probably what you will see if you console.log(req.ip);
    "::1": { 
        word: "prize",
        numGuesses: 2
    },
    "152.109.3.226": {
        word: "humor",
        numGuesses: 0
    },
    "209.81.136.46": {
        word: "siren",
        numGuesses: 4
    },
    "157.160.195.169": {
        word: "rocky",
        numGuesses: 1
    }
}
```

You should initialize `gameState` as an empty object. 

### Adding the user

Modify `POST /api/word`: you should first check if the user's IP address is already in the `gameState`. If so then immediately respond with status `409 Conflict`. 

Otherwise generate a random word like normal and add the user's IP to the `gameState` object along with the word and set `numGuesses` to zero.

You can access the user's IP by using `req.ip` which returns the IP address as a string.

### Tracking guesses

Modify `POST /api/guess`: you should check if the user's IP address is in the `gameState` object and if not then immediately respond with status `404 Not Found`.

If the user has more guessed 5 times then delete them from the `gameState` object. You can use the `delete` operator. Then respond with status `404 Not Found`

Otherwise check their word like normal but don't respond with the result yet. First, increment their guesses. If they have guessed 5 times or they guessed correctly then delete them from the `gameState`. Then send back the result like normal

*This is not a good system since multiple users can be on the same IP address. We will solve this issue by using session management later. 

## Final Directory Structure

By the end of the assignment this should be your directory structure (`package-lock.json`, `node_modules/`, `tests/`, `.git/` and `.vscode/` are not listed)

```
.
├── .env
├── .gitignore
├── Database
│   ├── .keep
│   ├── init-db.js
│   ├── schema.sql
│   └── wordle.db
├── Models
│   ├── db.js
│   └── dictionaryModel.js
├── README.md
├── app.js
├── package.json
├── server.js
```