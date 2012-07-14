/*
 * Top level file for voila
 */

var path = require('path')
  , fs = require('fs')
  , lsr = require('ls-r')
  , uglify = require('uglify-js')
  , clean = require('clean-css')
  , mincer = require('mincer');

var opts, pwd, environment
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

  opts.bare = opts.bare || false;

  mincer.CoffeeEngine.setOptions({ bare: opts.bare });

  opts.cli = opts.cli || false;

  if (opts.cli) {
    opts.files = opts.files || voila.files();
    return voila.build();
  }

  if (isDev) {
    voila.environment();
  }

  voila.createHelpers();

  if (isDev) {
    return new mincer.createServer(environment);
  } else {
    return function (req, res, next) {
      next();
    };
  }
};

voila.files = function () {
  var files = [], css, js;

  css = fs.readdirSync(path.join(opts.src, 'css'));
  js = fs.readdirSync(path.join(opts.src, 'js'));

  css.forEach(function (e) {
    if (e.indexOf('.css.styl') > -1 || e.indexOf('.css.less') > -1) {
      files.push(e.replace(/\.css\..*/, '.css'));
    } else if (e.slice(-4) == '.css') {
      files.push(e);
    }
  });

  js.forEach(function (e) {
    if (e.indexOf('.js.ejs') > -1 || e.indexOf('.js.coffee') > -1 ||
        e.indexOf('.js.ejs.coffee') > -1 || e.indexOf('.js.coffee.ejs') > -1) {
      files.push(e.replace(/\.js\..*/, '.js'));
    } else if (e.slice(-3) == '.js') {
      files.push(e);
    }
  });

  return files;
};

voila.images = function (callback) {
  var files = [], img = path.join(opts.src, 'img');

  lsr(img, function (err, imgs) {
    if (err) return callback(err);
    imgs.forEach(function (e) {
      if (['.ico', '.png', '.jpg', '.gif', '.eot', '.svg', '.woff', '.ttf'].indexOf(path.extname(e)) > -1) {
        files.push(e.replace(img + '/', ''));
      }
    });

    callback(null, files);
  });
};

voila.environment = function () {
  var exists = fs.existsSync || path.existsSync;

  environment = new mincer.Environment(pwd);

  environment.appendPath(path.join(opts.src, 'css'));
  environment.appendPath(path.join(opts.src, 'js'));
  environment.appendPath(path.join(opts.src, 'img'));

  function module(mod) {
    if (exists(path.join(pwd, 'node_modules', mod))) {
      environment.appendPath(path.join('node_modules', mod, 'lib'));
    }
  }

  module('nib');
};

voila.build = function () {
  voila.environment();

  var manifest = new mincer.Manifest(environment, opts.dst);

  voila.images(function (err, imgs) {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    manifest.compile(opts.files.concat(imgs), function (err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      voila.minify();
    });
  });
}

voila.minify = function () {
  var manifest = JSON.parse(fs.readFileSync(path.join(opts.dst, 'manifest.json')));

  Object.keys(manifest.assets).forEach(function (l) {
    if (path.extname(l) == '.js') {
      voila.minifyJS(manifest.assets[l]);
    } else if (path.extname(l) == '.css') {
      voila.minifyCSS(manifest.assets[l]);
    }
  })
};

voila.minifyJS = function (file) {
  file = path.join(opts.dst, file);
  fs.readFile(file, 'utf8', function (err, data) {
    if (err) throw err;
    var ast = uglify.parser.parse(data);
    ast = uglify.uglify.ast_mangle(ast);
    ast = uglify.uglify.ast_squeeze(ast);
    fs.writeFile(file, uglify.uglify.gen_code(ast), function (err) {
      if (err) throw err;
    });
  });
};

voila.minifyCSS = function (file) {
  file = path.join(opts.dst, file);
  fs.readFile(file, 'utf8', function (err, data) {
    data = clean.process(data);
    fs.writeFile(file, voila.modifyURL(data), function (err) {
      if (err) throw err;
    });
  });
}

voila.modifyURL = function (data) {
  var ret = '', url = false, uri = ''
    , inside = false;

  for (var i=0;i<data.length;i++) {
    if (url) {
      if (data[i-1]!='\\' && data[i]==')') {
        if (inside) inside = false;

        while (true) {
          var c = uri[uri.length-1], p = uri[uri.length-2];
          if (p=='\\' || (c!=' ' && c!='"' && c!='\'')) break;
          uri = uri.slice(0,-1);
        }

        ret += '"' + voila.serve(uri) + '")';
        url = false; uri = '';
        continue;
      }

      if (!inside && data[i]==' ') continue;

      if (!inside && (data[i]=='\'' || data[i]=='"')) {
        inside = true;
      } else {
        if (!inside) inside = true;
        uri += data[i];
      }
    } else {
      if (data[i]=='(' && data[i-1]=='l' && data[i-2]=='r' && data[i-3]=='u') {
        url = true;
      }
      ret += data[i];
    }
  }

  return ret;
};

voila.serve = function (url) {
  if (['data:', 'http:'].indexOf(url.slice(0,5)) > -1) {
    return url;
  }

  url = voila.cleanURL(url);

  var asset = environment.findAsset(url[0]);
  return opts.serve + '/' + (asset?asset.digestPath:url[0]) + url[1];
};

voila.cleanURL = function (url) {
  var ext='', q, h;

  if (url[0] == '/') url = url.slice(1);
  if ((q = url.indexOf('?')) > -1) {
    ext = url.slice(q);
    url = url.slice(0,q);
  }
  if ((h = url.indexOf('#')) > -1) {
    ext = url.slice(h) + ext;
    url = url.slice(0,h);
  }

  return [url, ext];
};

voila.createHelpers = function () {
  if (isDev) {
    opts.helper.asset = function (url) {
      return opts.serve + '/' + url;
    };
  } else {
    var assets = JSON.parse(fs.readFileSync(path.join(opts.dst, 'manifest.json'))).assets;
    opts.helper.asset = function (url) {
      url = voila.cleanURL(url);
      return opts.serve + '/' + (assets[url[0]] ? assets[url[0]] : url[0]) + url[1];
    };
  }
};
