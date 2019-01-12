'use strict';
//connect local db 
//env var; cloud based server, have to place env var
//imporatant for deployment
exports.DATABASE_URL = 
process.env.DATABASE_URL || 'mongodb://localhost/blog-app';
//identifies envir var
exports.PORT = process.env.PORT || 8080;