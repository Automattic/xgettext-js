# xgettext-js

[![Build Status](https://travis-ci.org/Automattic/xgettext-js.svg)](https://travis-ci.org/Automattic/xgettext-js)
[![NPM version](https://badge.fury.io/js/xgettext-js.svg)](http://badge.fury.io/js/xgettext-js)

xgettext-js is a utility for extracting translatable strings, written in and capable of parsing JavaScript files. It is similar to the [GNU xgettext](http://www.gnu.org/savannah-checkouts/gnu/gettext/manual/html_node/xgettext-Invocation.html) program, but returns strings as a JavaScript array. It makes use of [acorn.js](http://marijnhaverbeke.nl/acorn/) to parse JavaScript code, which facilitates the use of custom logic for string extraction. Because of this, xgettext-js is quite flexible, allowing you to define your own logic for extracting strings from any number of function keywords.

## Installation

xgettext-js is a [Node.js](http://nodejs.org/) package available through [npm](https://www.npmjs.org/). You must first [install Node.js](http://nodejs.org/download/) if it is not already installed, which will also install the npm package manager. Once installed, use your terminal to execute the following command from your project directory:

```bash
$ npm install xgettext-js
```

## Usage

An instance of xgettext-js exposes a `getMatches` method which, when passed a JavaScript source string, will return an array of translatable strings. Each item in the array is an object which includes a `string` property, the `line` of the matched string, and any optionally included translator comments as the `comments` property. By default, xgettext-js will search for any occurrence of a `_` function within your JavaScript code and assume that a translatable string exists as the first parameter. Translator comments can exist on the same or previous code line, formatted as `translators: [insert comment here]` by default.

Below is an example of this simple use case in a Node.js application:

```javascript
var XGettext = require( 'xgettext-js' ),
	source = '_( "Hello World!" ); /* translators: greeting */',
	parser = new XGettext();

console.log( parser.getMatches( source ) );
// Will output: [ { "string": "Hello World!", "comment": "greeting", "line": 1 } ]
```

## Options

To override the default behavior, you can pass an options object when creating an instance of xgettext-js, using one or more of the following options:

- `keywords` : An object which defines keywords to be searched (the key) and a function or number (the value). If passed a function, it is expected to return either a string replacement for the `string` value of the `getMatches` array return value, or a replacement for the object itself. The function is passed a match including up to four keys: `keyword` (the matched keyword), `arguments` (a CallExpression arguments array, [see parser documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API)), `line` (the line of the matched string), and `comment` if one exists. If passed a number, it is expected that the translatable string exists at the corresponding argument position on a 1-based index.
- `commentPrefix`: The comment prefix string to match translator comments to be included with translatable strings. A comment will be matched if it is prefixed by this option. If undesired, setting the value to `undefined` will omit comments from the `getMatches` return value.

## License

Copyright 2014 Automattic

This package is made available under the GPLv2 or later license