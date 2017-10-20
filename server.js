const cache = require('memory-cache');
const express = require('express');
const fs = require('fs');
const request = require('superagent');
const base64 = require('base-64');
const path = require('path');
const morgan = require('morgan');
const _ = require('lodash');

const app = express();
app.use(morgan('combined'));

// Read blacklisted account numbers
(function() {
  const blacklistFile = "bin/accs/acc-all.txt";
  const contents = _.split(fs.readFileSync(blacklistFile), "\n");
  _.forEach(contents, item => cache.put(item, "cekrekening.com"));
})();

app.get("/check/:account_number", (req, res) => {
  const { account_number } = req.params;
  const cached_value = cache.get(account_number);
  if (cached_value) {
    return res.send(`Account blacklisted! (${cached_value})`);
  }
  request.get('https://www.kredibel.co.id/check/result/' +
              base64.encode(account_number))
         .end((err, response) => {
    if (response.text.indexOf("Waspada") !== -1) {
      cache.put(account_number, "kredibel.co.id");
      return res.send("Account blacklisted! (kredibel.co.id)");
    }
    return res.send("Account hasn't been reported for fraud.");
  });
});

app.use(express.static(path.join(__dirname, 'build')));

app.listen(process.env.PORT || 8080, () =>
  console.log("Started server on port", process.env.PORT || 8080)
);
