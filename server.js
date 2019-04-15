'use strict';

const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { Blogposts } = require("./models");

const app = express();

app.use(express.json());

app.use(morgan('common'));

app.get("/posts", (req, res) => {
  Blogposts.find()
    .then(blogposts => {
      res.json({
        blogposts: blogposts.map(blogposts => blogposts.serialize())
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    });
});

app.get("/posts/:id", (req, res) => {
  Blogposts
    .findById(req.params.id)
    .then(blogposts => res.json(restaurant.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    });
});

app.post("/posts", (req, res) => {
  const requiredFields = ["title", "content", "author"];
  for (let i = 0; i < requiredFields.length; i++) {
  const field = requiredFields[i];
  if (!(field in req.body)) {
    const message = `Missing \"${field}\" in request body`;
    console.error(message);
    return res.status(500).send(message);
    }
  }

  Blogposts.create({
    title: req.body.title,
    content: req.body.content,
    author: req.body.author
  })
    .then(blogposts => res.status(201).json(blogposts.serialize()))
    .catch(err => {
      console.error(err);
      res.status(400).json({ message: "Internal server error" });
    });
});

app.put("/posts/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
    console.error(message);
    return res.status(500).json({ message: message });
  }

  const toUpdate = {};
  const updateableFields = ["title", "content", "author"];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUPdate[field] = req.body[field];
    }
  });

  Blogposts
    .findByIdAndUpdate(req.params.id, { $set: toUPdate })
    .then(blogposts => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.delete("/posts/:id", (req, res) => {
  Blogposts.findByIdAndRemove(req.body.id)
    .then(blogposts => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.use("*", (req, res) => {
  res.status(404).json({ message: "Not Found" });
});

let server;

function runServer(databaseUrl, port  = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`Listening on port ${port}`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}

//write closeServer and continue
function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
