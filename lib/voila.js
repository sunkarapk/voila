/*
 * Top level file for voila
 */

var path = require('path')
  , fs = require('fs')
  , mincer = require('mincer');

var opts, pwd
  , isDev = ((process.env.NODE_ENV || 'development') == 'development');

var voila = module.exports = function (dir, options) {
  pwd = dir || process.cwd();
  opts = options || {};

  if ('object' === typeof pwd) {
    opts = pwd;
    pwd == process.cwd();
  }

  opts.src = opts.src || path.join(pwd, 'assets');
  opts.dst = opts.dst || path.join(pwd, 'public', 'assets');

  opts.helper = opts.helper || global;
  opts.serve = opts.serve || '/assets';

  opts.cli = opts.cli || false;

  if (opts.cli && opts.cli.length > 0) {
    return voila.build(opts.cli);
  }

  voila.startWatcher();
  voila.createHelpers();
  return voila.middleware;
};

voila.build = function (files) {
  var exists = fs.existsSync || path.existsSync
    , environment = new mincer.Environment(pwd);

  environment.appendPath(path.join(opts.src, 'css'));
  environment.appendPath(path.join(opts.src, 'js'));

  function module(mod) {
    if (exists(path.join(pwd, 'node_modules', mod))) {
      environment.appendPath(path.join('node_modules', mod, 'lib'));
    }
  }

  module('nib');
  module('bootstrap-stylus');

  var manifest = new mincer.Manifest(environment, opts.dst);

  manifest.compile(files, function (err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

voila.middleware = function (req, res, next) {
  if (req.method != 'GET') return next();
};
