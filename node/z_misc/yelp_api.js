const config = require('config');

const YELP_ACCESS_TOKEN = config.get('yelpAccessToken');

const keywords = ['location', 'haircut', 'restaurant']

//where to remember all the answers?

function sendYelp(messageText){
  let term = [];
  let request = 'https://api.yelp.com/v3/businesses/search?'

 //assuming that only one keyword will be included in each query
  keywords.forEach(word => {
    if (messageText.includes(word)) {
      term.push(word);
    }
  })

  request.concat('')
}

