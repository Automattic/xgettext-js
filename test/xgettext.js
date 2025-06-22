var expect = require( 'chai' ).expect,
	XGettext = require( '../xgettext' ),
	fs = require( 'fs' ),
	path = require( 'path' );

it( 'should be instantiable', function() {
	var parser = new XGettext();
	expect( parser ).to.be.instanceof( XGettext );
} );

it( 'should return array of translatable strings', function() {
	var source = '_( "Hello World!" );',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [ { string: 'Hello World!', line: 1, column: 0 } ] );
} );

it( 'should enable developer to provide custom keyword logic returning a string', function() {
	var source = '_x( "Hello World!", "greeting" );',
		parser = new XGettext( {
			keywords: {
				_x: function( match ) {
					if ( 2 === match.arguments.length ) {
						return match.arguments[ 1 ].value + '\u0004' + match.arguments[ 0 ].value;
					}

					return match.arguments[ 0 ].value;
				},
			},
		} ),
		matches = parser.getMatches( source );

	expect( matches ).to.deep.equal( [ { string: 'greeting\u0004Hello World!', line: 1, column: 0 } ] );
} );

it( 'should enable developer to provide custom keyword logic returning an object', function() {
	var source = '_( "Hello World!" );',
		parser = new XGettext( {
			keywords: {
				_: function() {
					return { isOkay: true };
				},
			},
		} ),
		matches = parser.getMatches( source );

	expect( matches ).to.deep.equal( [ { isOkay: true } ] );
} );

it( 'should handle various translator comment styles', function() {
	var source = fs.readFileSync( path.join( __dirname, 'fixture/comment-styles.js' ), 'utf8' ),
		parser = new XGettext( {
			keywords: {
				_: 1,
				x: 2,
				n: 1,
			},
		} ),
		matches = parser.getMatches( source );

	expect( matches ).to.deep.equal( [
		{ string: 'string1', line: 4, column: 40 },
		{ string: 'string2', line: 6, column: 43, comment: 'translators: comment before function' },
		{ string: 'string3', line: 8, column: 0, comment: 'translators: comment after function (unscraped by GNU)' },
		{ string: 'string4', line: 11, column: 0 },
		{ string: 'string5', line: 17, column: 0 },
		{ string: 'string6', line: 19, column: 0, comment: 'translators: comment on line before argument' },
		{ string: 'string7', line: 24, column: 0, comment: 'translators: comment on line before message argument' },
		{
			string: 'string8',
			line: 30,
			column: 0,
			comment: 'translators: comment on line before context argument (unscraped by GNU)',
		},
		{ string: 'string9', line: 36, column: 0, comment: 'translators: comment on line of singular argument' },
		{
			string: 'string10',
			line: 41,
			column: 0,
			comment: 'translators: comment on line before plural argument (unscraped by GNU)',
		},
	] );
} );

it( 'should enable developer to provide custom translator comment prefix', function() {
	var source = '_( "Hello World!" ); /* note: greeting */',
		parser = new XGettext( {
			commentPrefix: 'note:',
		} ),
		matches = parser.getMatches( source );

	expect( matches ).to.deep.equal( [ { string: 'Hello World!', comment: 'note: greeting', line: 1, column: 0 } ] );
} );

it( 'should accept a number as keyword value to represent argument position', function() {
	var source = '_( null, "Hello World!" );',
		parser = new XGettext( {
			keywords: {
				_: 2,
			},
		} ),
		matches = parser.getMatches( source );

	expect( matches ).to.deep.equal( [ { string: 'Hello World!', line: 1, column: 0 } ] );
} );

it( 'should match functions that are the last element of a sequence (comma) expression', function() {
	var source = '(0, transpilerGeneratedName._)("Hello World!")',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [ { string: 'Hello World!', line: 1, column: 0 } ] );
} );

it( 'should match functions that are the last element of a recursive sequence (comma) expression', function() {
	var source = '(0, (0, transpilerGeneratedName._))("Hello World!")',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [ { string: 'Hello World!', line: 1, column: 0 } ] );
} );

it( 'should parse ecma6 by default', function() {
	var source = 'const i = 0; _("Hello World!");',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [ { string: 'Hello World!', line: 1, column: 13 } ] );
} );

it( 'should handle jsx', function() {
	var source = '<><MyComponent translatedProp={ _( "Hello " ) }>{ _( "World!" ) }</MyComponent></>',
		matches = new XGettext( {
			parseOptions: {
				plugins: [ 'jsx' ],
			},
		} ).getMatches( source );

	expect( matches ).to.deep.equal( [
		{ string: 'Hello ', line: 1, column: 32 },
		{ string: 'World!', line: 1, column: 50 },
	] );
} );
