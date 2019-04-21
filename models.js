'use strict';

const mongoose = require("mongoose");

mongoose.Promise = global.Promise;
//create new schema for Authors
const authorSchema = mongoose.Schema({
  firstName: 'string',
  lastName: 'string',
  userName: {
    type: 'string',
    unique: true
  };
})

const commentSchema = mongoose.Schema({ content: 'string' });

const blogSchema = mongoose.Schema({
  title: {type: String, require: true},
  content: {type: String, require: true},
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
  comments: [commentSchema]
});

blogSchema.pre('find', function(next) {
  this.populate('author');
})

blogSchema.pre('findOne', function(next) {
  this.populate('author');
})

blogSchema.virtual("fullName").get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

blogSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.fullName,
    comments: this.comments
  };
};

let Author = mongoose.model("Author", authorSchema);

const Blogposts = mongoose.model("Blogposts", blogSchema);

module.exports = { Blogposts, Author };
