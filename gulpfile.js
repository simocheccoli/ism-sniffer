'use strict';

var gulp    = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    pkg     = require('./package.json');

var paths = {
  scripts: [
    'client/scripts/app.module.js',
    'client/scripts/app.routes.js',
    'client/scripts/services/*.js',
    'client/scripts/controllers/*.js',
    'client/scripts/directives/*.js',
    'client/scripts/filters/*.js'
  ],
  fonts: [
    'client/fonts/**.*',
    'node_modules/bootstrap/fonts/*.{ttf,woff,eof,svg}',
    'node_modules/font-awesome/fonts/*.{ttf,woff,eof,svg}'
  ],
  images: ['client/img/**/*.*'],
  styles: [
    //'bower_components/bootstrap/dist/css/bootstrap.css',
    'client/styles/bootstrap-darkly.css',
    'node_modules/font-awesome/css/font-awesome.css',
    'client/styles/**/*.scss'
  ],
  files: ['client/index.html', 'client/favicon.ico'],
  templates: ['client/views/**/*.html'],
  dest: ['./public'],
  vendors: [
    'node_modules/angular/angular.js',
    'node_modules/angular-messages/angular-messages.js',
    'node_modules/angular-resource/angular-resource.js',
    'node_modules/angular-bootstrap/ui-bootstrap.js',
    'node_modules/angular-ui-router/release/angular-ui-router.js',
    'node_modules/lodash/lodash.js',
    'node_modules/smoothie/smoothie.js',
    'node_modules/angular-socket-io/node_modules/socket.io-client/socket.io.js',
    'node_modules/angular-socket-io/socket.js',
  ]
};

var banner = [
  '/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %> (c) ' + new Date().getFullYear(),
  ' * @author <%= pkg.author %>',
  ' * @link <%= pkg.homepage %>',
  ' */',
  ''].join('\n');

// The name of the Angular module which will be injected into the templates.
var moduleName = 'snifferApp';

// Minify and copy all 3rd party libs to vendors.min.js
gulp.task('copy-vendors', function() {
  return gulp.src(paths.vendors)
    .pipe(plugins.concat('vendors.js'))
    .pipe(gulp.dest(paths.dest+'/js'))
    .pipe(plugins.uglify())
    .pipe(plugins.rename({extname: '.min.js'}))
    .pipe(gulp.dest(paths.dest+'/js'));
});

// Minify and copy all dashboard script files to app.min.js
gulp.task('copy-scripts', function() {
  return gulp.src(paths.scripts)
    .pipe(plugins.concat('app.js'))
    .pipe(plugins.header('(function() {\n'))
    .pipe(plugins.footer('\n})();'))
    .pipe(plugins.header(banner, { pkg: pkg }))
    .pipe(gulp.dest(paths.dest+'/js'))
    .pipe(plugins.uglify())
    .pipe(plugins.rename({extname: '.min.js'}))
    //.pipe(plugins.header(banner, { pkg: pkg }))
    .pipe(gulp.dest(paths.dest+'/js'));
});

// Minify and copy all angular templates to templates.min.js
gulp.task('copy-templates', function() {
  return gulp.src(paths.templates)
    .pipe(plugins.minifyHtml({quotes: true}))
    .pipe(plugins.angularTemplatecache({module: moduleName}))
    .pipe(plugins.uglify())
    .pipe(plugins.concat('templates.min.js'))
    .pipe(gulp.dest(paths.dest+'/js'));
});

// Copy all static/HTML files to output directory
gulp.task('copy-files', function(){
  return gulp.src(paths.files)
    .pipe(gulp.dest('./public'));
});

// Copy all images to output directory
gulp.task('copy-images', function(){
  return gulp.src(paths.images)
    .pipe(gulp.dest(paths.dest+'/img'));
});

// Copy all fonts to output directory
gulp.task('copy-fonts', function(){
  return gulp.src(paths.fonts)
    .pipe(gulp.dest(paths.dest+'/fonts'));
});

// Compile styles into dashboard.css
gulp.task('compile-styles', function() {
  return gulp.src(paths.styles)
    .pipe(plugins.sass({errLogToConsole: true}))
    .pipe(plugins.minifyCss())
    .pipe(plugins.concat('app.min.css'))
    .pipe(gulp.dest(paths.dest+'/css'));
});

// Lint Task
gulp.task('lint', function() {
  return gulp.src(paths.js)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('jshint-stylish'));
});

// Watch Task
gulp.task('watch', function() {
  gulp.watch(paths.vendors, ['copy-vendors']);
  gulp.watch(paths.js, ['copy-scripts']);
  gulp.watch(paths.templates, ['copy-templates']);
  gulp.watch(paths.files, ['copy-files']);
  gulp.watch(paths.images, ['copy-images']);
  gulp.watch(paths.fonts, ['copy-fonts']);
  gulp.watch(paths.styles, ['compile-styles']);
});

// Webserver Task
gulp.task('webserver', function() {
  gulp.src(paths.dest)
    .pipe(plugins.webserver({
      host: '0.0.0.0',
      port: 3000,
      livereload: true,
      directoryListing: false,
      fallback: 'index.html',
      open: false
    }));
});

gulp.task('build', ['copy-vendors', 'copy-scripts', 'copy-templates', 'copy-files', 'copy-images', 'copy-fonts', 'compile-styles']);
gulp.task('default', ['build', 'webserver', 'watch']);
