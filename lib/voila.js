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
    pwd = process.cwd();
  }

  opts.src = opts.src || path.join(pwd, 'assets');
  opts.dst = opts.dst || path.join(pwd, 'public', 'assets');

  opts.helper = opts.helper || global;
  opts.serve = opts.serve || '/assets';

  opts.cli = opts.cli || false;
  opts.files = opts.files || voila.files();

  if (opts.cli) {
    return voila.build();
  }

  voila.startWatcher();
  voila.createHelpers();
  return voila.middleware;
};

voila.files = function () {
  var files = [], css, js;

  css = fs.readdirSync(path.join(opts.src, 'css'));
  js = fs.readdirSync(path.join(opts.src, 'js'));

  css.forEach(function (e) {
    if (e.indexOf('.css.styl') > 0 || e.indexOf('.css.less') > 0) {
      files.push(e.replace(/\.css\..*/, '.css'));
    }
  });

  js.forEach(function (e) {
    if (e.indexOf('.js.ejs') > 0 || e.indexOf('.js.coffee') > 0 ||
        e.indexOf('.js.ejs.coffee') > 0 || e.indexOf('.js.coffee.ejs') > 0) {
      files.push(e.replace(/\.js\..*/, '.js'));
    }
  });

  return files;
};

voila.build = function () {
  var exists = fs.existsSync || path.existsSync
    , environment = new mincer.Environment(pwd);

  environment.appendPath(path.join(opts.src, 'css'));
  environment.appendPath(path.join(opts.src, 'js'));
  // environment.appendPath(path.join(opts.src, 'img'));

  function module(mod) {
    if (exists(path.join(pwd, 'node_modules', mod))) {
      environment.appendPath(path.join('node_modules', mod, 'lib'));
    }
  }

  module('nib');

  var manifest = new mincer.Manifest(environment, opts.dst);

  manifest.compile(opts.files, function (err) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
}

voila.middleware = function (req, res, next) {
  if (req.method != 'GET') return next();
};
