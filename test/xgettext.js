var expect = require( 'chai' ).expect,
	XGettext = require( '../xgettext' );

it( 'should be instantiable', function() {
	var parser = new XGettext();
	expect( parser ).to.be.instanceof( XGettext );
});

it( 'should return array of translatable strings', function() {
	var source = '_( "Hello World!" );',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [{ 'string': 'Hello World!' }] );
});

it( 'should return array of translatable strings, including comment on same line', function() {
	var source = '_( "Hello World!" ); /* translators: greeting */',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [{ 'string': 'Hello World!', 'comment': 'greeting' }] );
});

it( 'should return array of translatable strings, including comment on previous line', function() {
	var source = '/* translators: greeting */\n_( "Hello World!" );',
		matches = new XGettext().getMatches( source );

	expect( matches ).to.deep.equal( [{ 'string': 'Hello World!', 'comment': 'greeting' }] );
});

it( 'should enable developer to provide custom keyword logic', function() {
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

	expect( matches ).to.deep.equal( [{ 'string': 'greeting\u0004Hello World!' }] );

});

it( 'should enable developer to provide custom translator comment prefix', function() {
	var source = '_( "Hello World!" ); /* note: greeting */',
		parser = new XGettext({
			commentPrefix: 'note:'
		}),
		matches = parser.getMatches( source );

	expect( matches ).to.deep.equal( [{ 'string': 'Hello World!', 'comment': 'greeting' }] );
});