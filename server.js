'use strict';

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {Seed} = require('./models');

const app = express();
app.use(express.json());
app.use(jsonParser);

app.get('/posts', (req, res) => {
  Seed.find()
  .then(seeds => {
    res.json(
      seeds.map(seed => seed.serialize())
    );
  })
  .catch(err => {
    console.error(err);
    res.status(500).json({message: "Internal server error"});
  })
});

app.get('/posts/:id', (req, res) => {
  Seed.findById(req.params.id)
  .then(seed => res.json(seed.serialize()))
  .catch(err => {
    console.error(err);
    res.status(500).json({message: "Internal server error"});
  });
});

app.post('/posts', jsonParser, (req, res) => {
  const requiredFields = ['title', 'content'];
  for (let i = 0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if(!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }

  Seed.create({title:req.body.title, content:req.body.content})
  .then(data => res.status(201).json(data.serialize()))
  .catch(err => {
    console.error(err);
    res.status(500).json({message: "Internal server error"});
  });
});

app.put('posts/:id', jsonParser, (req, res) => {
  if (!(req.params.id === req.body.id)) {
    const message = 
    `Request path id (${req.params.id}) and request body id ` +
      `(${req.body.id}) must match`;
    console.error(message);
    return res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateFields = ['title', 'content', 'author'];

  updateFields.forEach(field => {
    if(field in req.body) {
      toUpdate[field] = req.body[field];
    };
  });

  Seed.findByIdAndUpdate(req.params.id, {$set: toUpdate})
  .then(seed => res.status(204).end())
  .catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('/posts/:id', (req, res) => {
  Seed.findByIdAndRemove(req.params.id)
  .then(seed => res.status(204).end())
  .catch(err => res.status(500).json({message: 'Internal server error'}));
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