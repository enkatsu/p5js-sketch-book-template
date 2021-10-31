const gulp = require('gulp');
const del = require('del');
const sass = require('gulp-sass')(require('sass'));
const babel = require('gulp-babel');
const pug = require('gulp-pug');
const glob = require('glob');
const minimist = require('minimist');
const dateFormat = require('dateformat');
const connect = require('gulp-connect');
const browserSync = require('browser-sync').create();


const options = minimist(process.argv.slice(2), {
	string: 'name',
	default: {
		name: dateFormat(new Date(), 'yyyymmdd')
	}
});

var paths = {
    styles: {
        src: 'src/sketches/**/*.scss',
        dest: 'dest/'
    },
    scripts: {
        src: 'src/sketches/**/*.js',
        dest: 'dest/'
    },
    views: {
        src: 'src/sketches/**/*.pug',
        index: {
            src: 'src/index.pug',
            dest: 'dest/',
        },
        sketches: {
            src: 'src/sketches/*.pug',
            dest: 'dest/sketches/'
        }
    }
};

async function newSketch() {
    const sketchDirectory = `src/sketches/${options.name}`;
    glob(`${sketchDirectory}*`, (err, sketchDirectories) => {
        if (sketchDirectories.length === 0) {
            gulp.src('./templates/*')
                .pipe(gulp.dest(sketchDirectory));
        } else {
            gulp.src('./templates/*')
                .pipe(gulp.dest(`${sketchDirectory}_${sketchDirectories.length}`));
        }
    });
}

function clean() {
    return del(['dest']);
}

function index() {
    glob('./src/sketches/*', (err, sketches) => {
        sketches = sketches.map(sketch => {
            return sketch.replace(/^\.\/src/g, '.');
        });
        return gulp.src(paths.views.index.src)
            .pipe(
                pug({
                    locals: { sketches }
                })
            )
            .pipe(gulp.dest(paths.views.index.dest));
    });
}

function sketches() {
    return gulp.src('./src/sketches/**/*.pug')
        .pipe(pug({}))
        .pipe(gulp.dest(paths.views.sketches.dest));
}

async function views() {
    sketches();
    index();
};

function scripts() {
    return gulp.src(paths.scripts.src, { sourcemaps: true })
        .pipe(babel())
        .pipe(gulp.dest(paths.scripts.dest));
}

function styles() {
    return gulp.src(paths.styles.src)
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(paths.styles.dest));
}

const browserSyncOption = {
    port: 8080,
    server: {
      baseDir: './dist/',
      index: 'index.html',
    },
    reloadOnRestart: true,
};
// function browsersync(done) {
//     browserSync.init(browserSyncOption);
//     done();
// }

function watch(done) {
    browserSync.init({
        port: 8080,
        server: {
          baseDir: './dest/',
          index: 'index.html',
        },
        reloadOnRestart: true,
    });
    const browserReload = () => {
        browserSync.reload();
        done();
    };
    console.log(paths.styles.src);
    gulp.watch(paths.styles.src, gulp.series('styles', browserReload));
    console.log(paths.scripts.src);
    gulp.watch(paths.scripts.src, gulp.series('scripts', browserReload));
    console.log(paths.views.src);
    gulp.watch(paths.views.src, gulp.series('views', browserReload));
}

function serve() {
    connect.server();
}


const build = gulp.series(clean, gulp.parallel(views, scripts, styles));

exports.newSketch = newSketch;
exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;
exports.views = views;
exports.build = build;
exports.watch = watch;
exports.serve = serve;
exports.default = build;
