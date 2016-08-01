Version 1.0.0
=============
- Switch to `babylon` as a JavaScript parser.
    - There are [slight incompatibilities](https://www.npmjs.com/package/babylon#output) in the AST from the previous parser `acorn`.
    - Advantage of `babylon`: Ability to parse JSX and other advanced ES7 features (all with [enabled plugins](https://www.npmjs.com/package/babylon#plugins) in the `parserOptions`).

Version 0.3.1
=============
- Updated: Lodash dependency from ^2.4.1 to ^4.13.1

Version 0.3.0
=============
- Updated: Acorn dependency from 0.6.0 to 3.0.4
