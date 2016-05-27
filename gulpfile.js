var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

gulp.task('styles', function(){
	return gulp.src('./dev/css/**/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
		.pipe(concat('style.css'))
		.pipe(gulp.dest('./public/css/'))
		.pipe(reload({stream: true}));
});

gulp.task('scripts', function(){
	gulp.src('./dev/js/*.js')
		.pipe(gulp.dest('./public/js'))
		.pipe(reload({stream: true}));
});

gulp.task('browser-sync', function(){
	browserSync.init({
		server: './public'
	})
});

gulp.task('watch', function(){
	gulp.watch('./dev/css/**/*.scss', ['styles']);
	gulp.watch('./dev/js/*.js', ['scripts']);
	gulp.watch('./public/*.html', reload);
});

gulp.task('default', ['browser-sync', 'styles', 'scripts', 'watch']);