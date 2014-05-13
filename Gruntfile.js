module.exports = function(grunt) {
    var project = {
        files: ['src/*.js']
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        header: '\
/*!\n\
Copyright 2014 Adobe Systems Inc.;\n\
Licensed under the Apache License, Version 2.0 (the "License");\n\
you may not use this file except in compliance with the License.\n\
You may obtain a copy of the License at\n\
\n\
http://www.apache.org/licenses/LICENSE-2.0\n\
\n\
Unless required by applicable law or agreed to in writing, software\n\
distributed under the License is distributed on an "AS IS" BASIS,\n\
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n\
See the License for the specific language governing permissions and\n\
limitations under the License.\n\
*/\n\
\n\
;(function(scope) {\n"use strict";\n\n',
        footer: '\nscope.ShapesPolyfill = new Polyfill(scope);\n})(window);\n',

        concat: {
            options: {
                stripBanners: 'true',
                banner: '<%= header %>',
                footer: '<%= footer %>'
            },
            dist: {
                src: project.files,
                dest: '<%= pkg.name %>.js'
            }
        },

        uglify: {
            options: {
                preserveComments: 'some'
            },
            dist: {
                src: ['<%= concat.dist.dest %>'],
                dest: '<%= pkg.name %>.min.js'
            }
        },

        watch: {
            options: {
                atBegin: true,
            },
            js: {
                files: project.files,
                tasks: ['build']
            }
        },

        jshint: {
            source: {
                src: ['src/*.js']
            },
            dist: {
                /* minification triggers some lint warnings */
                src: ['shapes-polyfill.js']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', 'print help message', function() {
        grunt.log.writeln('Hi there. The current supported targets are:');
        grunt.log.writeln('watch: watch src files for changes and build when a change occurs');
        grunt.log.writeln('build: concat & minify src files into a .js and .min.js file');
        grunt.log.writeln('jshint: lint the source, can be called as jshint:source or jshint:dist');
    });
    grunt.registerTask('build', ['jshint:source', 'concat', 'uglify', 'jshint:dist']);
}