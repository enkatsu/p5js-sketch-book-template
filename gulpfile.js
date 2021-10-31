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
        dest: 'dest/sketches/'
    },
    scripts: {
        src: 'src/sketches/**/*.js',
        dest: 'dest/sketches/'
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

function copyP5() {
    return gulp.src('node_modules/p5/lib/p5.min.js')
        .pipe(gulp.dest('dest/'));
}

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
        baseDir: './dest/',
        index: 'index.html',
    },
    reloadOnRestart: true,
};

function browsersync(done) {
    browserSync.init(browserSyncOption);
    done();
}

function watch(done) {
    const browserReload = () => {
        browserSync.reload();
        done();
    };
    gulp.watch(paths.styles.src).on('change', gulp.series('styles', browserReload));
    gulp.watch(paths.scripts.src).on('change', gulp.series('scripts', browserReload));
    gulp.watch(paths.views.src).on('change', gulp.series('views', browserReload));
}

function serve() {
    connect.server();
}

const build = gulp.series(clean, gulp.parallel(copyP5, views, scripts, styles));

gulp.task('default', gulp.series(
    build,
    gulp.series(browsersync, watch)
));

exports.newSketch = newSketch;
exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;
exports.views = views;
exports.build = build;
exports.watch = watch;
exports.serve = serve;
