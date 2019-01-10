'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const seedSchema = mongoose.Schema({
  title: {type: String, required: true},
  author: {
    firstName: String,
    lastname: String,
  },
  content: {type: String, required: true},
  created: {type: Date, default: Date.now}
});

seedSchema.virtual('authorName').get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

seedSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorName,
    created:this.created
  };
};

const Seed = mongoose.model('Seed', seedSchema);

module.exports = {Seed};