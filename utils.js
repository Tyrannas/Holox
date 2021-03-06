function difference(object, base) {
	function changes(object, base) {
		return _.transform(object, function(result, value, key) {
			if (!_.isEqual(value, base[key])) {
				result[key] = _.isObject(value) && _.isObject(base[key]) ? changes(value, base[key]) : value;
			}
		});
	}
	return changes(object, base);
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(item) {
	if (!item) {
		return item;
	} // null, undefined values check

	var types = [ Number, String, Boolean ],
		result;

	// normalizing primitives if someone did new String('aaa'), or new Number('444');
	types.forEach(function(type) {
		if (item instanceof type) {
			result = type(item);
		}
	});

	if (typeof result == 'undefined') {
		if (Object.prototype.toString.call(item) === '[object Array]') {
			result = [];
			item.forEach(function(child, index, array) {
				result[index] = clone(child);
			});
		} else if (typeof item == 'object') {
			// testing that this is DOM
			if (item.nodeType && typeof item.cloneNode == 'function') {
				result = item.cloneNode(true);
			} else if (!item.prototype) {
				// check that this is a literal
				if (item instanceof Date) {
					result = new Date(item);
				} else {
					// it is an object literal
					result = {};
					for (var i in item) {
						result[i] = clone(item[i]);
					}
				}
			} else {
				// depending what you would like here,
				// just keep the reference, or create new object
				if (false && item.constructor) {
					// would not advice to do that, reason? Read below
					result = new item.constructor();
				} else {
					result = item;
				}
			}
		} else {
			result = item;
		}
	}

	return result;
}

function getHeight() {
	var body = document.body,
		html = document.documentElement;

	var menu = document.getElementById('menu');

	let height = Math.max(
		body.scrollHeight,
		body.offsetHeight,
		html.clientHeight,
		html.scrollHeight,
		html.offsetHeight
	);
	documentHeight = height - menu.clientHeight - 40;
}
