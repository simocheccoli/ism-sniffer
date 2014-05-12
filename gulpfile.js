var gulp = require('gulp');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var imagemin = require('gulp-imagemin');
var jshint = require('gulp-jshint');
var ngmin = require('gulp-ngmin');

var paths = {
  scripts: ['public/js/**/app.js', 'public/js/**/*.js', '!public/js/**/*.min.js'],
  images: 'public/img/**/*'
};

gulp.task('scripts', function() {
  // Minify and copy all JavaScript (except vendor scripts)
  return gulp.src(paths.scripts)
    .pipe(concat('app.min.js'))
    .pipe(ngmin())
    .pipe(uglify())
    .pipe(gulp.dest('public/build/'));
});

// Copy all static images
gulp.task('images', function() {
 return gulp.src(paths.images)
    // Pass in options to the task
    .pipe(imagemin({optimizationLevel: 5}))
    .pipe(gulp.dest('public/build/img'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.images, ['images']);
});

gulp.task('lint', function() {
  gulp.src(path.scripts)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['scripts', 'images', 'watch']);
