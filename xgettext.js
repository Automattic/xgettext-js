var _ = require( 'lodash' ),
	parser = require( 'acorn' ),
	traverse = require( 'acorn/dist/walk' ).simple;

/**
 * XGettext will parse a given input string for any instances of i18n function calls,
 * returning an array of objects for all translatable strings discovered.
 *
 * @param  {Object} Options to use when parsing the input. Refer to XGettext.defaultOptions
 * for available options and a description for each
 * @return {Array} An array of objects for all translatable strings discovered.
 */
var XGettext = module.exports = function( options ) {
	if ( 'object' !== typeof options ) options = {};
	this.options = _.extend( {}, XGettext.defaultOptions, options );
	this.options.keywords = this._normalizeKeywords( this.options.keywords );
	this.options.keywordFunctions = Object.keys( this.options.keywords );
};

XGettext.defaultOptions = {
	/**
	 * A key-value pair of keyword function names to be mapped into their desired string value.
	 * Transform functions are passed a match including three keys: `keyword` (the matched keyword),
	 * `arguments` (a CallExpression arguments array), and `comment` if one exists. It is expected
	 * that this function will return a string or an array of strings. Alternatively, define value as
	 * number to return value in that argument position on a 1-based index.
	 *
	 * @type {Object}
 	 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
	 */
	keywords: {
		'_': 1
	},

 	/**
 	 * Optionally match translator comments to be included with translatable strings.
 	 *
 	 * If undesired, set as `undefined`. A comment will be matched if it is prefixed by this option
 	 * and occurs either on the same or previous line as the matched keyword.
 	 *
 	 * @type {String,undefined}
 	 */
	commentPrefix: 'translators:'
};

/**
 * Returns an array of objects for all strings matched by the keywords defined in the `keyword`
 * option property.
 *
 * Each object in the array contains a `string` key where the value is determined by the
 * corresponding keyword mapping function. An object may also contain a `comment` key if the
 * `commentPrefix` option is provided and a comment is associated with the matched keyword.
 *
 * @return {Array} An array containing objects for each matched occurrance of a keyword function
 */
XGettext.prototype.getMatches = function( input ) {
	var parsedInput, matches, transformedMatches;

	// Parse input as AST and matching comments
	parsedInput = this._parseInput( input );

	// Find matches (i.e. where keyword functions are used)
	matches = this._discoverMatches( parsedInput );

	// Use configured keyword transforms to parse string value
	transformedMatches = _( matches ).map(function(match) {
		return this._transformMatch( match );
	}.bind(this) ).flatten().value();

	return transformedMatches;
}

/**
 * Returns an object containing keyword functions where number values are replaced with a function
 * returning the nth argument on a 1-based index
 *
 * @private
 * @return {Object} An object containing keyword functions where number values are replaced with a
 * function returning the nth argument on a 1-based index
 * @see https://www.gnu.org/software/gettext/manual/html_node/xgettext-Invocation.html
 */
XGettext.prototype._normalizeKeywords = function( keywords ) {
	var normalizedKeywords = {};

	for ( var fn in keywords ) {
		normalizedKeywords[ fn ] = this._normalizeKeyword( keywords[ fn ] );
	}

	return normalizedKeywords;
};

/**
 * If passed a number, returns a function which returns the nth argument on a 1-based index.
 * Otherwise, returns the passed argument.
 *
 * @param  {Number,Function} keyword A number or function to be normalized
 * @return {Function} A function to be used in place of the passed argument
 */
XGettext.prototype._normalizeKeyword = function( keyword ) {
	if ( 'number' === typeof keyword ) {
		return (function( argnum ) {
			var argumentPosition = argnum - 1;

			return function( match ) {
				if ( match.arguments.length > argumentPosition &&
					typeof match.arguments[ argumentPosition ].value === 'string' ) {
					return match.arguments[ argumentPosition ].value;
				}
			};
		}( keyword ));
	}

	return keyword;
};

/**
 * Returns an object containing as AST representation of the input (as `ast`) and any matching
 * comments discovered during parsing (as `comments`)
 *
 * @private
 * @return {Array} An object containing as AST representation of the input (as `ast`) and any
 * matching comments discovered during parsing (as `comments`)
 */
XGettext.prototype._parseInput = function( input ) {
	var comments = [],
		parseOptions = { locations: true },
		ast;

	if ( typeof this.options.commentPrefix !== 'undefined' ) {
		// Optionally locate translator comments
		var rxCommentMatch = new RegExp( '^\\s*' + this.options.commentPrefix, 'i' );

		parseOptions.onComment = function( block, text, start, end, line ) {
			var isTranslatorComment = rxCommentMatch.test( text );

			if ( isTranslatorComment ) {
				comments.push({
					value: text.replace( rxCommentMatch, '' ).trim(),
					line: line
				});
			}
		};
	}

	ast = parser.parse( input, parseOptions );

	return {
		comments: comments,
		ast: ast
	};
};

/**
 * Returns an array of objects representing all matched keywords, including the matched keyword
 * (as `keyword`), the CallExpression arguments array (as `arguments`), and potentially any comment
 * associated with the match (as `comment`)
 *
 * @private
 * @return {Array} An array of objects representing all matched keywords
 */
XGettext.prototype._discoverMatches = function( parsedInput ) {
	var keywordFunctions = this.options.keywordFunctions,
		matches = [];

	traverse( parsedInput.ast, {
		CallExpression: function( node ) {
			// Pull the resultingFunction out of (0, resultingFunction)()
			var callee = node.callee;
			while ( 'SequenceExpression' === callee.type ) {
				callee = _.last( callee.expressions );
			}
			var functionName = ( callee.property ) ? callee.property.name : callee.name;

			// Validate is named function
			if ( ! functionName ) return;

			// Validate desired function name
			if ( keywordFunctions.indexOf( functionName ) === -1 ) return;

			// Build discovered match
			var match = {
				arguments: node.arguments,
				keyword: functionName,
				line: node.loc.start.line
			};

			// Find translator comment
			_.each( parsedInput.comments, function( translatorComment ) {
				if ( node.loc.start.line === translatorComment.line.line ||
					node.loc.start.line - 1 === translatorComment.line.line ) {
					match.comment = translatorComment.value;
				}
			});

			matches.push( match );
		}
	});

	return matches;
};

/**
 * Returns an object representing a single transformed matched keyword, including the transformed
 * keyword string value (as `string`), and potentially any comment associated with the match (as
 * `comment`)
 *
 * @private
 * @return {Object} An object representing a single transformed matched keyword
 */
XGettext.prototype._transformMatch = function( match ) {
	var strings = this.options.keywords[ match.keyword ]( match );

	// If transformed result is object, immediately return
	if ( _.isPlainObject( strings ) ) return strings;

	// Cast strings to single-element array to enable mapping
	if ( ! ( strings instanceof Array ) ) {
		strings = [ strings ];
	}

	// Remove falsey string values
	strings = strings.filter( Boolean );

	// Transform string back to object with comment
	strings = _.map(strings, function( string ) {
		var transformed = { string: string, line: match.line };

		if ( typeof match.comment !== 'undefined' ) {
			transformed.comment = match.comment;
		}

		return transformed;
	});

	return strings;
};
