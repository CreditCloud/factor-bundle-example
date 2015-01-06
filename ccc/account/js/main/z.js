var user = require('../user')
var assign = require('lodash-node/compat/objects/assign');
var pairs = require('lodash-node/compat/objects/pairs');
var zipObject = require('lodash-node/compat/arrays/zipObject');

user = assign({nickName: 'undoZen'}, user);
console.log(user);
console.log(zipObject(pairs(user)));
