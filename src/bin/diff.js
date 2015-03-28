/*jshint node: true*/
/**
 * @author kecso / https://github.com/kecso
 */

var program = require('commander'),
    HASH_REGEXP = new RegExp("^#[0-9a-zA-Z_]*$"),
    BRANCH_REGEXP = new RegExp("^[0-9a-zA-Z_]*$"),
    requirejs = require('requirejs'),
    FS = require('fs'),
    openContext,
    Storage,
    path = require('path'),
    gmeConfig = require(path.join(process.cwd(), 'config')),
    webgme = require('../../webgme');

webgme.addToRequireJsPaths(gmeConfig);

openContext = requirejs('common/util/opencontext');
Storage = requirejs('common/storage/serveruserstorage');

var generateDiff = function (mongoUri, projectId, sourceBranchOrCommit, targetBranchOrCommit, callback) {
    'use strict';
    var storage,
        project,
        core,
        contextParams,
        silentLog = {
            debug: function () {
            },
            error: function () {
            }
        },
        closeContext = function (error, data) {
            try {
                project.closeProject(function () {
                    storage.closeDatabase(function () {
                        callback(error, data);
                    });
                });
            } catch (err) {
                storage.closeDatabase(function () {
                    callback(error, data);
                });
            }
        },
        getRoot = function (branchOrCommit, next) {
            var getFromCommitHash = function (cHash) {
                project.loadObject(cHash, function (err, cObj) {
                    if (err) {
                        next(err);
                        return;
                    }
                    core.loadRoot(cObj.root, next);
                });
            };
            if (HASH_REGEXP.test(branchOrCommit)) {
                getFromCommitHash(branchOrCommit);
            } else if (BRANCH_REGEXP.test(branchOrCommit)) {
                project.getBranchHash(branchOrCommit, '#hack', function (err, commitHash) {
                    if (err) {
                        next(err);
                        return;
                    }
                    getFromCommitHash(commitHash);
                });
            } else {
                next(new Error('nor commit nor branch input'));
            }
        };

    gmeConfig.mongo.uri = mongoUri || gmeConfig.mongo.uri;

    storage = new Storage({globConf: gmeConfig, log: silentLog});

    contextParams = {
        projectName: projectId,
        branchOrCommit: sourceBranchOrCommit
    };

    openContext(storage, gmeConfig, contextParams, function (err, context) {
        var srcRoot,
            targetRoot;
        if (err) {
            callback(err);
            return;
        }
        project = context.project;
        core = context.core;
        srcRoot = context.rootNode;

        getRoot(targetBranchOrCommit, function (err, root) {
            if (err) {
                closeContext(err);
                return;
            }
            targetRoot = root;
            core.generateTreeDiff(srcRoot, targetRoot, closeContext);
        });
    });
};

module.exports.generateDiff = generateDiff;

if (require.main === module) {
    program
        .version('0.1.0')
        .option('-m, --mongo-database-uri [url]', 'URI to connect to mongoDB where the project is stored')
        .option('-p, --project-identifier [value]', 'project identifier')
        .option('-s, --source [branch/commit]', 'the source or base of the diff to be created')
        .option('-t, --target [branch/commit]', 'the target or end of the diff to be created')
        .option('-o, --out [path]', 'the output path of the diff [by default it is printed to the console]')
        .parse(process.argv);

//check necessary arguments
//    if (!program.mongoDatabaseUri) {
//        console.warn('mongoDB URL is a mandatory parameter!');
//        process.exit(0);
//    }
    if (!program.projectIdentifier) {
        console.warn('project identifier is a mandatory parameter!');
        program.help();
    }
    if (!program.source) {
        console.warn('source is a mandatory parameter!');
        program.help();
    }
    if (!program.target) {
        console.warn('target is a mandatory parameter!');
        program.help();
    }

    generateDiff(program.mongoDatabaseUri, program.projectIdentifier, program.source, program.target,
        function (err, diff) {
            'use strict';
            if (err) {
                console.warn('diff generation finished with error: ', err);
                process.exit(0);
            }
            if (program.out) {
                try {
                    FS.writeFileSync(program.out, JSON.stringify(diff, null, 2));
                } catch (err) {
                    console.warn('unable to create output file:', err);
                }
            } else {
                console.log('generated diff:');
                console.log(JSON.stringify(diff, null, 2));
            }
            process.exit(0);
        }
    );
}