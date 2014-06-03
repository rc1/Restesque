module.exports = function( grunt ) {

    // # Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON( 'package.json' ),
        // ## Documentation
        docco: {
            'libs': {
                src: [ 'libs/*.js' ],
                options: {
                    output: 'docs/'
                }
            }
        },
        // ## Concat
        concat : {
            'client' : {
                src : [ 'LICENSE.md', 'libs/packet.js', 'libs/restesque.js' ],
                dest : 'build/restesque.js'
            }
        },
        // ## Ugilfy
        uglify: {
            options: {
                mangle: false
            },
            'client': {
                files: {
                    'build/restesque.min.js' : [ 'build/restesque.js' ]
                }
            }
        },
        // ## Bump
        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: [],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json'], // '-a' for all files
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: false,
                pushTo: 'upstream',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
            }
        }
    });
    
    // # Task Names
    grunt.registerTask( 'docs', [ 'docco' ] );
    grunt.registerTask( 'build', [ 'concat', 'minify' ] );
    grunt.registerTask( 'minify', [ 'uglify' ] );
    grunt.registerTask( 'all', [ 'build', 'docs' ] );

    // # Default Grunt
    grunt.registerTask( 'default', [ 'build' ] );

    // # Load Tasks
    grunt.loadNpmTasks( 'grunt-docco' );
    grunt.loadNpmTasks( 'grunt-contrib-concat' );
    grunt.loadNpmTasks( 'grunt-contrib-uglify' );
    grunt.loadNpmTasks( 'grunt-bump' ); // bump:minor
};