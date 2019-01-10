'use strict';

const mongoose = require('mongoose');

const seedSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {type: String, required: true},
  content: {type: String, required: true}
});

seedSchema.virtual('authorName').get(function() {
  return this.author.firstName + ' ' + this.author.lastName;
});

seedSchema.methods.serialize = function() {
  return {
    title: this.title,
    content: this.content,
    author: this.authorName
  };
};

const Seed = mongoose.model('Seed', seedSchema);

module.exports = {Seed};