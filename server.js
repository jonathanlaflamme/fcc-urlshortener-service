require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  url: {
    type: String,
    required: true
  }
});

urlSchema.statics.findOneOrCreate = function findOneOrCreate(condition, callback) {
    const self = this
    self.findOne(condition, (err, result) => {
        return result ? callback(err, result) : self.create(condition, (err, result) => { return callback(err, result) })
    })
}

const Url = mongoose.model("Url", urlSchema);

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', (req, res) => {
  const { url } = req.body;

  const { hostname } = new URL(url);

  dns.lookup(hostname, (err) => {
    if (err) return res.json({ error: 'invalid url' });

    Url.findOneOrCreate({ url }, (errMongo, data) => {
      if (errMongo) return res.json({ error: 'invalid url' });

      return res.json({ original_url: url, short_url : data._id });
    });
  });
});

app.get('/api/shorturl/:id', (req, res) => {
  const { id } = req.params;

  Url.findById(id, (err, urlToRedirect) => {
    if (err) return res.json({ error: 'invalid url' });

    return res.status(301).redirect(urlToRedirect.url);
  });
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
