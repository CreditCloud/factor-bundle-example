var isArray = require('lodash-node/compat/objects/isArray');
var assign = require('lodash-node/compat/objects/assign');
var keys = require('lodash-node/compat/objects/keys');
console.log('isArray: ', isArray([]), isArray(null));
console.log(assign({}, {a: keys({b:1, c:1})}));
