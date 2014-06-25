var _ = require( 'lodash' ),
	parser = require( 'acorn' ),
	traverse = require( 'acorn/util/walk' ).simple;

/**
 * XGettext will parse a given input string for any instances of i18n function calls,
 * returning an array of objects for all translatable strings discovered.
 *
 * @param  {Object} Options to use when parsing the input. Refer to XGettext.defaultOptions
 * for available options and a description for each
 * @return {Array} An array of objects for all translatable strings discovered.
 */
var XGettext = module.exports = function( options ) {
	this.options = _.extend( XGettext.defaultOptions, options );
	this.options.keywordFunctions = Object.keys( options.keywords );
};

XGettext.defaultOptions = {
	/**
	 * A key-value pair of keyword function names to be mapped into their desired string value.
	 *
	 * @type {Object}
	 */
	keywords: {
		/**
		 * A transform function which is passed a match including three keys: `keyword` (the
		 * matched keyword), `arguments` (a CallExpression arguments array), and `comment` if one
		 * exists. It is expected that this function will return a string or an array of strings
		 *
	 	 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API
		 * @return {Array,String} A transformed string value
		 */
		'_': function( match ) {
			// By default, assume string located in first argument
			if ( match.arguments.length > 0 &&
				typeof match.arguments[0].value === 'string' ) {
				return match.arguments[0].value;
			}
		}
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
			var functionName = node.callee.name;

			// Validate is named function
			if ( ! functionName ) return;

			// Validate desired function name
			if ( keywordFunctions.indexOf( functionName ) === -1 ) return;

			// Build discovered match
			var match = {
				arguments: node.arguments,
				keyword: functionName
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

	// Cast strings to single-element array to enable mapping
	if ( ! ( strings instanceof Array ) ) {
		strings = [ strings ];
	}

	// Remove falsey string values
	strings = strings.filter( Boolean );

	// Transform string back to object with comment
	strings = _.map(strings, function( string ) {
		var transformed = { string: string };

		if ( typeof match.comment !== 'undefined' ) {
			transformed.comment = match.comment;
		}

		return transformed;
	});

	return strings;
};