/* eslint-disable */
// GNU: xgettext --output=- --keyword --keyword=_ --keyword=n:1,2 --keyword=x:1c,2 --add-comments="translators:" comment-styles.js

/* Comment without translator prefix */ _('string1');

/* translators: comment before function */ _('string2');

_('string3'); /* translators: comment after function (unscraped by GNU) */

// translators: comment on line before multiline function (unscraped)
_(
	'string4'
)

// translators: comment on line before empty line (unscraped by JS)

_('string5')

_(
	// translators: comment on line before argument
	'string6'
);

x(
	'context',
	// translators: comment on line before message argument
	'string7'
);

x(
	// translators: comment on line before context argument (unscraped by GNU)
	'context',
	'string8'
);

n(
	/* translators: comment on line of singular argument */ 'string9',
	'plural'
);

n(
	'string10',
	// translators: comment on line before plural argument (unscraped by GNU)
	'plural'
);
