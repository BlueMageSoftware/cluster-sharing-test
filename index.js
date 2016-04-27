const throng = require('throng');
const cpus = require('os').cpus().length;
const workers = parseInt(process.env.WORKERS, 10) || cpus;
const cluster = require('cluster');
const express = require('express');

// some generic bootstrap function.
function bootstrap(val) {
  var app = express();
  if (val === 'NOTHING') {
    app.get('/', function (req, res) {
      res.send('NOTHING TO REPORT.');
    });
    app.listen(8080);
  } else {
    app.get('/bespoke', function (req, res) {
      res.send('BESPOKE TO REPORT.');
    });
    app.listen(3000);
  }
}


// worker function, first listen for a message from master and then decide to start up based on that.
function start(id) {
  process.on('message', function(m) {
    console.log(`Worker: ${id} - We have a message from master: ${JSON.stringify(m)}`)
    process.env.BESPOKE = m.value;
    bootstrap(process.env.BESPOKE);
  });
}

// master function, publish some messages for the workers to share information.
function master() {
  var shareVal = process.env.SHARE_VAL || 'NOTHING';
  cluster.on('fork', function(worker) {
    worker.send({ cmd: 'broadcast', value: shareVal });
  });
}

// cluster the app
throng({
  lifetime: Infinity,
  grace: 4000,
  workers: workers,
  master: master,
  start: start
});
