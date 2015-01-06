var user = require('../user')
var payment = require('../payment')
var assign = require('lodash-node/compat/objects/assign');
console.log(assign({nickName: 'undoZen'}, user, payment));
