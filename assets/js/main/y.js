var assign = require('lodash-node/compat/objects/assign');
var pairs = require('lodash-node/compat/objects/pairs');
console.log(assign({}, {a: pairs({b:1, c:1})}));
