import { settings } from '../settings.js';

class Api {
  constructor() {
    this.baseUrl = settings.db.url + '/';
  }
  get(url) {
    return fetch(this.baseUrl + url)
      .then(function(rawResponse) {
        return rawResponse.json();
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

    return fetch(this.baseUrl + url, options).then(function(rawResponse) {
      return rawResponse.json();
    });
  }
}

export default Api;
