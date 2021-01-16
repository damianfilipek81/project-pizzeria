import app from './../app.js';

class Api {
  constructor(url, data, type) {
    const thisApi = this;
    const payload = data;
    if(type == 'GET'){
      thisApi.get(url, data);
    }else if(type == 'POST'){
      thisApi.post(url, payload);
    }
  }
  get(url, data) {
    const thisApi = this;
    thisApi.data = data;
    fetch(url)
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        thisApi.data.products = parsedResponse;
        app.initMenu();
      });
  }
  post(url, payload) {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options);
  }
}

export default Api;