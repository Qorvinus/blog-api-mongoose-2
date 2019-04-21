'use strict';

const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require("./config");
const { Blogposts, Authors } = require("./models");

const app = express();

app.use(express.json());

app.use(morgan('common'));

app.get("/posts", (req, res) => {
  Blogposts
    .find()
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


app.post('/posts', (req, res) => {
  const requiredFields = ['title', 'content', 'author_id'];
  requiredFields.forEach(field => {
    if (!(field in req.body)) {
      const message = `Missing \"${field}\" in request body`;
      console.error(message);
      return.res.status(400).send(message);
    }
  });

  Author
    .findById(req.body.author_id)
    .then(author => {
      if (author) {
        Blogposts
          .create({
            title: req.body.title,
            content: req.body.content,
            author: req.body.id
          })
          .then(blogPosts => res.status(201).json({
            id: blogPosts.id,
            author: `${author.firstName} ${author.lastName}`,
            content: blogPosts.content,
            title: blogPosts.title,
            comments: blogPosts.comments
          }))
          .catch(err => {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
          });
      } else {
          const message = "Author not found";
          console.error(message);
          return res.status(400).send(message);
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
});

app.put("/posts/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Request path id \"${req.params.id}\" and request body id \"${req.body.id}\" must match`;
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
  Blogposts
    .findByIdAndRemove(req.body.id)
    .then(blogposts => res.status(204).end())
    .catch(err => res.status(500).json({ message: "Internal server error" }));
});

app.use("*", (req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.get('/authors', (req, res) => {
  Author
    .find()
    .then(authors => {
      res.json(authors.map(author => {
        return {
          id: author._id,
          name: `${author.firstName} ${author.lastName}`,
          userName: author.userName
        };
      }));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
})

app.post('/authors', (req, res) => {
  const requiredFields = ['firstName', 'lastName', 'userName'];
  requiredFields.forEach(field => {
    if(!(field in req.body)) {
      const message = `Missing \"${field}\" in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
    Author
      .create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName
      })
      .then(author => res.status(201).json({
        _id: author.id,
        name: `${author.firstName} ${author.lastName}`,
        userName: author.userName
      }))
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      });
  });
})

app.put('/authors/:id', (req, res) => {
  if (!(req.paras.id && req.body.id && req.params.id === req.body.id)) {
    const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
    console.error(message);
    res.status(500).json({ message: message });
  }
  const toUPdate = {};
  const updateableFields = ['firstName', 'lastName', 'userName'];
  updateableFields.forEach(field => {
    if (field in req.body) {
      toUPdate[field] = req.body[field];
    };
  });
  Author
    .findOne({ userName: toUPdate.userName || '', _id: { $ne: req.params.id } })
    .then(author => {
      if(author) {
        const message = "User name taken";
        console.error(message);
        return res.status(400).send(message);
      }
      Author
        .findByIdAndUpdate(req.params.id, { $set: toUPdate }, { new: true })
        .then(updatedAuthor => {
          res.status(200).json({
            id: updatedAuthor.id,
            name: `${updatedAuthor.firstName} ${updatedAuthor.lastName}`,
            userName: updatedAuthor.userName
          });
        })
        .catch(err => res.status(500).json({ message: err }));
    });
});

app.delete('/authors/:id', (req, res) => {
  Blogposts
    .remove({ author: req.params.id })
    .then(() => {
      Author
        .findByIdAndRemove(req.params.id)
        .then(() => {
          console.log(`Deleted blog posts by the author with matching id of: \"${req.params.id}\"`);
          res.status(204).end();
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
})

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
