var expect = require( 'chai' ).expect,
	XGettext = require( '../xgettext' );

it( 'should be instantiable', function() {
	var parser = new XGettext();
	expect( parser ).to.be.instanceof( XGettext );
});

it( 'should return array of translatable strings', function() {
	var source = '_( "Hello World!" );',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [{ string: 'Hello World!', line: 1 }] );
});

it( 'should return array of translatable strings, including comment on same line', function() {
	var source = '_( "Hello World!" ); /* translators: greeting */',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [{ string: 'Hello World!', comment: 'greeting', line: 1 }] );
});

it( 'should return array of translatable strings, including comment on previous line', function() {
	var source = '/* translators: greeting */\n_( "Hello World!" );',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [{ string: 'Hello World!', comment: 'greeting', line: 2 }] );
});

it( 'should enable developer to provide custom keyword logic returning a string', function() {
	var source = '_x( "Hello World!", "greeting" );',
		parser = new XGettext({
			keywords: {
				'_x': function( match ) {
					if ( 2 === match.arguments.length ) {
						return match.arguments[1].value + '\u0004' + match.arguments[0].value;
					} else {
						return match.arguments[0].value;
					}
				}
			}
		}),
		matches = parser.getMatches( source );

	expect( matches ).to.deep.equal( [{ string: 'greeting\u0004Hello World!', line: 1 }] );
});

it( 'should enable developer to provide custom keyword logic returning an object', function() {
	var source = '_( "Hello World!" );',
		parser = new XGettext({
			keywords: {
				'_': function( match ) {
					return { isOkay: true };
				}
			}
		}),
		matches = parser.getMatches( source );

	expect( matches ).to.deep.equal( [{ isOkay: true }] );
});

it( 'should enable developer to provide custom translator comment prefix', function() {
	var source = '_( "Hello World!" ); /* note: greeting */',
		parser = new XGettext({
			commentPrefix: 'note:'
		}),
		matches = parser.getMatches( source );

	expect( matches ).to.deep.equal( [{ string: 'Hello World!', comment: 'greeting', line: 1 }] );
});

it( 'should accept a number as keyword value to represent argument position', function() {
  var source = '_( null, "Hello World!" );',
    parser = new XGettext({
      keywords: {
        '_': 2
      }
    }),
    matches = parser.getMatches( source );

  expect( matches ).to.deep.equal( [{ string: 'Hello World!', line: 1 }] );
});

it( 'should match functions that are the last element of a sequence (comma) expression', function() {
	var source = '(0, transpilerGeneratedName._)("Hello World!")',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [{ 'string': 'Hello World!', line: 1 }] );
});

it( 'should match functions that are the last element of a recursive sequence (comma) expression', function() {
	var source = '(0, (0, transpilerGeneratedName._))("Hello World!")',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [{ 'string': 'Hello World!', line: 1 }] );
});

it( 'should parse ecma6 by default', function() {
	var source = 'const i = 0; _("Hello World!");',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [{ 'string': 'Hello World!', line: 1 }] );
});
