var gulp = require('gulp')
  , path = require('path')
  , uglify = require('gulp-uglify')
  , concat = require('gulp-concat')
  , jshint = require('gulp-jshint')
  , less = require('gulp-less')
  , browserSnyc = require('browser-sync').create();
gulp.task('minify', function () {
  gulp.src('js/*.js').
  pipe(jshint()).
  pipe(jshint.reporter('default')).
  pipe(uglify()).
  pipe(concat('app.min.js')).
  pipe(gulp.dest('build'));
});
gulp.task('watch', function () {
  gulp.watch('js/*.js', function (evt) {
    console.log(evt.type);
    console.log(evt.path);
  })
});
gulp.task('less', function () {
  gulp.src('less/*.less').
  pipe(less()).
  pipe(gulp.dest('css'));
});
gulp.task('sync', ['less'], function () {
  var files = [
    'js/*.js'
    , 'css/*.css'
    , '**/*.html'
    , 'less/*.less'
  ]
  browserSnyc.init(files, {
    server: {
      baseDir: './'
    }
  });
  gulp.watch('less/*.less', ['less']);
});