const utils = require('./src/utils');
const async = require('async');
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

function blacklist(number, bank) {
  if (!cache.get(number))
    cache.put(number, []);
  cache.put(number, _.concat(cache.get(number), bank));
}

// Read blacklisted account numbers
(function() {
  const blacklistFile = "bin/accs/acc-all.txt";
  const contents = _.split(fs.readFileSync(blacklistFile), "\n");
  _.forEach(contents, item => {
    const arr = _.split(item, ",");
    blacklist(arr[0], arr[1]);
  });
})();

app.get("/check/:account_number/:bank", (req, res) => {
  let { account_number, bank } = req.params;
  bank = _.toLower(bank);
  if (utils.banks.indexOf(bank) === -1) {
    return res.status(400).send("Invalid bank. Valid values are:<br/>" + _.join(utils.banks, "<br/>"));
  }

  const blacklisted_banks = cache.get(account_number);
  if (blacklisted_banks && blacklisted_banks.includes(bank)) {
    return res.send(`Account blacklisted!`);
  }
  async.parallel({
    cekrekening:
      (callback) => request.get(`https://cekrekening.id/search?bank_id=${utils.cekrekening_bankids[bank]}&account_number=${account_number}`)
        .end((err, response) => {
          if (err) {
            return callback(err);
          }
          if (response.text.indexOf("Penipuan") !== -1) {
            return callback(null, true);
          }
          return callback(null, false);
        }),
    kredibel:
      (callback) => request.get(`https://www.kredibel.co.id/check/result/${base64.encode(account_number)}`)
        .end((err, response) => {
        if (err) {
          return callback(err);
        }
        if (response.text.indexOf("Waspada") !== -1) {
          return callback(null, true);
        }
        return callback(null, false);
      }),
  }, (err, result) => {
    if (err) {
      return res.status(500).send("Something wrong happened while fetching data: " + err);
    }
    if (result.cekrekening) {
      blacklist(account_number, bank);
      return res.send("Account blacklisted!");
    } else if (result.kredibel) {
      blacklist(account_number, "Unknown");
      return res.send("Account blacklisted! (Unknown bank)");
    } else {
      return res.send("Account hasn't been reported yet for fraud.");
    }
  });
});

app.use(express.static(path.join(__dirname, 'build')));

app.listen(process.env.PORT || 8080, () =>
  console.log("Started server on port", process.env.PORT || 8080)
);
