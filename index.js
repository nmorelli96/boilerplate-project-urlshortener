require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

let urlSchema = new mongoose.Schema({
  original: {
    type: String,
    required: true
  },
  shortened: {
    type: Number
  }
});

const Url = mongoose.model('Url', urlSchema);

let responseJSON = {};
//'/api/shorturl/new' comes from index.html form action
app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let input = req.body['url']; // the url name comes from index.html input object name
  responseJSON['original_url'] = input;

  let urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
  if(!input.match(urlRegex)) {
    res.json({"error": "Invalid URL"});
    return;
  }

  shortenedInput = 1;

  Url.findOne({original: input}, (err, query) => { 
    if (err) {
        return console.log(err)
    } 
    if (!err && query) { // if the website we're adding already exists in db, just return the existing json values
      console.log(query.shortened)
      responseJSON['short_url'] = query.shortened;
      return res.json(responseJSON);
    } else {  // if not, create new values
      Url.findOne({})
        .sort({shortened: -1})
        .exec((err, query) => {
          if (err) {
            return console.log(err)
          } 
          if (!err && query != undefined) {
            shortenedInput = query.shortened + 1
          }
          if (!err) {
            Url.findOneAndUpdate(
              {original: input},
              {original: input, shortened: shortenedInput},
              {new: true, upsert: true}, 
              (err, urlUpdated) => {
                if (err) {
                  return console.error(err);
                }
                else {
                  responseJSON["short_url"] = urlUpdated.shortened;
                  res.json(responseJSON);
                }
                //done(null, personUpdated);
              })
          }
        })  
    }
  //res.json(responseJSON);
  });
});

app.get('/api/shorturl/:input', (req, res) => {
    let input = req.params.input;
    let numRegex = /[0-9]+/;
    let httpRegex = /^http/;
    //if (input.match(numRegex)) {
      Url.findOne({shortened: input}, (err, query) => {
        if (!err && query != undefined) {
          if(query.original.match(httpRegex)){
            res.redirect(query.original);
          } else {
            res.redirect(`//${query.original}`);
          }
        } else {
          res.json('URL not found');
        }
      })
    //}
});