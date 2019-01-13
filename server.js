'use strict';

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {BlogPost, Author} = require('./models');

const app = express();
app.use(express.json());
app.use(jsonParser);

app.get('/posts', (req, res) => {
  BlogPost.find()
  //.populate('author')
  .then(blogs => {
    res.json(
      blogs.map(blog => blog.serialize())
    );
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({message: "Internal server error"});
  })
});

app.get('/posts/:id', (req, res) => {
  BlogPost.findById(req.params.id)
  .then(seed => res.json(seed.serialize()))
  .catch(err => {
    console.error(err);
    res.status(500).json({message: "Internal server error"});
  });
});

app.post('/posts', jsonParser, (req, res) => {
  const requiredFields = ['title', 'content', 'author_id'];
  for (let i = 0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if(!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Author.findById(req.body.author_id)
  .then(author => {
    if(author) {
      BlogPost.create({
        title:req.body.title, 
        content:req.body.content, 
        author: req.body.author_id
      })

      .then(data => res.status(201).json({
        id:data.id,
        author: `${author.firstName} ${author.lastName}`,
        content: data.content,
        title: data.title,
        comments: data.comments
      }))

      .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal server error"});
      });
    }
    else {
      const message = 'Author not found'
      console.error(message);
      return res.status(400).send(message);
    }
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({message: "Internal server error"});
  });
});

app.put('/posts/:id', jsonParser, (req, res) => {
  if (!(req.params.id === req.body.id)) {
    const message = 
    `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateFields = ['title', 'content',];

  updateFields.forEach(field => {
    if(field in req.body) {
      toUpdate[field] = req.body[field];
    };
  });

  BlogPost.findByIdAndUpdate(req.params.id, {$set: toUpdate})
  .populate('author')
  .then(update => res.status(200).json({
    title: update.title,
    content: update.content,
    author: `${update.author.firstName} ${update.author.lastName}`,
    created: update.created
  }))
  .catch(err => res.status(500).json({message: 'Internal server error'}))
});

app.delete('/posts/:id', (req, res) => {
  BlogPost.findByIdAndRemove(req.params.id)
  .then(seed => res.status(204).end())
  .catch(err => res.status(500).json({message: 'Internal server error'}));
})

app.get('/authors', (req, res) => {
  Author.find()
  .then(authors => {
    res.json(
      authors.map(author => author)
    );
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal server error'})
  });
});

app.post('/authors', (req, res) => {
  const requiredFields = ['firstName', 'lastName', 'userName']
  for (let i = 0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if(!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }  
  }
  Author.findOne({
    userName: req.body.userName
  })
  .then(author => {
    if(author) {
      const message = `Username ${req.body.userName} already exists`;
      console.error(message);
      return res.status(400).send(message);
    }
    else {
      Author.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName
      })
      .then(author => res.status(201).json({
        _id: author._id,
        firstName: author.firstName,
        lastName: author.lastName,
        userName: author.userName
      }))
    }
  })
  .catch(err => res.status(500).json({message: 'Internal server error'})); 
})

app.put('/authors/:id', (req, res) => {
  if(!(req.params.id === req.body.id)) {
    const message = `Request path id (${req.params.id}) and request body id ` +
    `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateFields = ['firstName', 'lastName', 'userName'];

  updateFields.forEach(field => {
    if(field in req.body) {
      toUpdate[field]= req.body[field];
    }
  });

  Author.findOne({userName: toUpdate.userName})
  .then(author => {
    if(author) {
      const message = `Username already taken`;
      console.error(message);
      return res.status(400).send(message);
    }
    else {
      Author.findByIdAndUpdate(req.params.id, {$set: toUpdate})
      .then(author => res.status(200).json({
        id: author.id,
        name: `${author.firstName} ${author.lastName}`,
        userName: author.userName
      }))
    }
  })
  .catch(err => res.status(500).json({message: "internal server error"}))
})

app.delete('/authors/:id', (req, res) => {
  BlogPost.remove({author:req.params.id})
  .then(() => {
    Author.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).json({message: 'Authors and content deleted'}))
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({message: 'Internal server error'})
  })
})

app.use('*', function(req, res) {
  res.status(404).json({message: 'Not Found'});
});

let server;

function runServer(databaseUrl, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(
      databaseUrl,
      err => {
        if(err) {
          return reject(err);
        }
        server = app.listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
        .on('error', err => {
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
      console.log('Closing server');
      server.close(err => {
        if(err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if(require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};