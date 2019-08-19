require('dotenv').config();
const express = require('express');
const Axios = require('axios');

const app = express();

app.use(express.json());
app.use(express.urlencoded());

app.use((req, res, next) => {
  const { method, headers, params, body, query } = req;
  let { originalUrl } = req;
  originalUrl = originalUrl.replace('/apieks', '/kai/apieks');
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const partner = originalUrl.split('/')[1];
  const targetUrl = originalUrl.replace(`/${partner}/`, '');
  if (!partner || !process.env[`${partner.toUpperCase()}_URL`]) {
    res.set(422).send('Invalid partner'); return;
  }
  console.log('Incoming connection from', clientIp);
  console.log('Request path: ', originalUrl);
  console.log(`Forwarding to ${partner}`);
  delete headers.host;
  delete headers['postman-token'];
  delete headers['cache-control'];
  delete headers['accept-encoding'];
  delete headers['connection'];
  delete headers['content-length'];
  const url = `${process.env[`${partner.toUpperCase()}_URL`]}${targetUrl}`;
  console.log(`  ==> ${url}`);
  console.log(method, headers, params, body, query);
  Axios({
    url,
    method,
    headers,
    // headers: {
    //   ...headers,
    //   host: process.env[`${partner.toUpperCase()}_HOST`]
    // },
    data: body,
    params: query,
  })
    .then((result) => {
      // console.log('RESULT: ', result.data);
      console.info('SUCCESS');
      // if (method !== 'GET') {
      //   res.set(result.headers);
      // }
      res.status(result.status).send(result.data);
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send('Problem connecting to partner');
    })
});

app.listen(4991);
console.info('App is running at 4991. Ctrl + C to stop');
