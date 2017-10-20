const request = require('request');
const _ = require('lodash');
const fs = require('fs');
const async = require('async');

const start = 0, end = 1060;
const regex = new RegExp(/<p class="isi-pesan pull-left">(.*?)<br>/, "g");

function writeToFile(index, numbers) {
  const filename = "accs/acc-" + _.toString(index) + ".txt";
  fs.writeFileSync(filename, _.join(numbers, "\n"));
}

async.series(_.map(_.range(start, end, 10), (index) => {
  return callback => {
    const url = 'http://cekrekening.com/cari/' + _.toString(index);
    console.log("Fetching from URL:", url);
    request(url, (err, req, body) => {
      const items = [];
      while ((temp = regex.exec(body)) !== null) {
        items.push(temp[1]);
      }
      writeToFile(index, items);
      return callback();
    });
  };
}));

