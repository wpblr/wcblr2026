/**
 * Gulp — compile SCSS to minified main.min.css
 */

const gulp = require( 'gulp' );
const sass = require( 'gulp-sass' )( require( 'sass' ) );
const cleanCSS = require( 'gulp-clean-css' );
const rename = require( 'gulp-rename' );

const paths = {
	scss: 'assets/scss/main.scss',
	dest: '.',
};

function styles() {
	return gulp
		.src( paths.scss )
		.pipe( sass( { outputStyle: 'expanded' } ).on( 'error', sass.logError ) )
		.pipe( cleanCSS() )
		.pipe( rename( { basename: 'main', suffix: '.min' } ) )
		.pipe( gulp.dest( paths.dest ) );
}

function watch() {
	gulp.watch( 'assets/scss/**/*.scss', styles );
}

exports.styles = styles;
exports.watch = watch;
exports.default = styles;
