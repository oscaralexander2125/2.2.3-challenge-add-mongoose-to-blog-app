'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const authorSchema = mongoose.Schema({
  firstName: 'string',
  lastName: 'string',
  userName: {
    type: 'string',
    unique: true
  },
});

const commentSchema = mongoose.Schema({content: 'string'});


const blogSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Author'
  },
  content: {type: String, required: true},
  created: {type: Date, default: Date.now},
  comments: [commentSchema]
});

blogSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogSchema.pre('find', function(next) {
  this.populate('author');
  next();
});

blogSchema.pre('findOne', function(next) {
  this.populate('author');
  next();
});

blogSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    created:this.created,
    comments: this.comments
  };
};

//how to access collection in db?
const BlogPost = mongoose.model('BlogPost', blogSchema,'blogposts');
const Author = mongoose.model('Author', authorSchema, 'authors');
//singular name, assumes plural
module.exports = {BlogPost, Author};