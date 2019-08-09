require('dotenv').config();
const express = require('express');
const Axios = require('axios');

const app = express();

app.use(express.json());
app.use(express.urlencoded());

app.use((req, res, next) => {
  const { method, headers, params, body, originalUrl } = req;
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const partner = originalUrl.split('/')[1];
  const targetUrl = originalUrl.replace(`/${partner}/`, '');
  if (!partner || !process.env[`${partner.toUpperCase()}_URL`]) {
    res.set(422).send('Invalid partner'); return;
  }
  console.log('Incoming connection from', clientIp);
  console.log('Request path: ', originalUrl);
  console.log(method, headers, params, body);
  console.log(`Forwarding to ${partner}`);
  Axios({
    url: `${process.env[`${partner.toUpperCase()}_URL`]}${targetUrl}`,
    method,
    headers: {
      ...headers,
      host: process.env[`${partner.toUpperCase()}_HOST`]
    },
    body,
    params,
  })
    .then((result) => {
      // console.log(result);
      res.set(result.headers);
      res.status(result.status).send(result.data);
    })
    .catch((e) => {
      console.error(e);
      res.status(500).send('Problem connecting to partner');
    })
});

app.listen(4991);
console.info('App is running at 4991. Ctrl + C to stop');