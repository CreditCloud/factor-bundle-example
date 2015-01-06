var browserify = require('browserify');
var bpack = require('browserify/node_modules/browser-pack');
var glob = require('glob');
var path = require('path');
var fs = require('fs');
var _ = require('lodash-node');
var through = require('through2');
var unary = require('fn-unary');
var concat = require('concat-stream');
var factor = require('factor-bundle');

var cacheify = function (b, opts) {
    if (!opts) opts = {};
    var cache = b._options.cache;
    var pkgcache = b._options.packageCache;

    b.on('dep', function (dep) {
        if (typeof dep.id === 'string') {
            cache[dep.id] = dep;
        }
    });

    return b;
}
cacheify.args = {
    basedir: __dirname, cache: {}, packageCache: {}, fullPaths: true
};

var b = cacheify(browserify(cacheify.args));
var gpaths = glob.sync('node_modules/assets/js/main/**/*.js', {
    cwd: __dirname
})
    .concat(glob.sync('node_modules/ccc/*/js/main/**/*.js', {
        cwd: __dirname
    }));
console.log(gpaths);

var rpaths = gpaths.map(function (f) {
    return path.join(__dirname, f);
});
b.require(rpaths);

var dpaths = gpaths.map(function (f) {
    return path.join('dist', f.substring('node_modules/'.length));
});
console.log(dpaths);


function isAbsolutePath(file) {
    var regexp = process.platform === 'win32' ?
        /^\w:/ :
        /^\//;
    return regexp.test(file);
}
var relativePath = unary(path.relative.bind(path, path.join(cacheify.args.basedir, 'node_modules')));
function replacePipeline(pipeline) {
    pipeline.get('pack')
        .splice(0, 1, through.obj(function (row, enc, next) {
            if (isAbsolutePath(row.id)) {
                row.id = relativePath(row.file);
            }
            row.deps = _.transform(row.deps, function (result,
                value, key) {
                result[key] = relativePath(value);
            }, {});
            this.push(row);
            next();
        }), bpack(_.assign({}, cacheify.args, {
            raw: true,
            hasExports: true,
            //hasExports: false,
            //prelude: 'S.prelude(' + JSON.stringify(req.path) + ')'
        })));
}

function factorBundle(opts) {
    var b = browserify(rpaths, _.assign({}, cacheify.args, { debug: true }));
    replacePipeline(b.pipeline);
    b.on('factor.pipeline', function (file, pipeline) {
        replacePipeline(pipeline);
    })
    b.plugin('factor-bundle', opts);
    return b;
}
var DevNull = require('dev-null');
function toDevNull() {
    return DevNull();
}

b.bundle(function () {
    console.log(arguments);
    //console.log(cacheify.args.cache);
    factorBundle({
        outputs: dpaths.map(toDevNull),
        threshold: function(row, groups) {
            console.log('bundle common/global.js threshold');
            console.log(relativePath(row.id), groups.map(relativePath));
            var onlyRequiredByAccountComponent = groups.map(relativePath).every(function(dep){
                return dep.match(/^@?ccc\/account\//);
            })
            console.log(onlyRequiredByAccountComponent);
            //console.log(row.id, groups);
            return this._defaultThreshold(row, groups) && !onlyRequiredByAccountComponent;
        }
    }).bundle(function (err, str) {
        if (err) {
            console.log(err);
            return;
        }
        fs.writeFileSync('dist/assets/js/common/global.js', str);
        factorBundle({
            outputs: dpaths.map(toDevNull),
            threshold: function(row, groups) {
                console.log('bundle common/account.js threshold');
                console.log(relativePath(row.id), groups.map(relativePath));
                var onlyRequiredByAccountComponent = groups.map(relativePath).every(function(dep){
                    return dep.match(/^@?ccc\/account\//);
                })
                console.log(onlyRequiredByAccountComponent);
                //console.log(row.id, groups);
                return this._defaultThreshold(row, groups) && onlyRequiredByAccountComponent;
            }
        }).bundle(function (err, str) {
            if (err) {
                console.log(err);
                return;
            }
            fs.writeFileSync('dist/assets/js/common/account.js', str);
            factorBundle({
                outputs: dpaths
            }).bundle().pipe(toDevNull());
        })
    })

    function write (name) {
        return concat(function (body) {
            console.log('// ----- ' + name + ' -----');
            console.log(body.toString('utf8'));
        });
    }
});

