import { settings, select } from './settings.js';
import Product from './components/Product.js';
import Cart from './components/Cart.js';
import Api from './components/Api.js';

const app = {
  initPages: function(){
    const thisApp = this;

    thisApp.pages = document.querySelector(select.containerOf.pages).children;

    thisApp.activatePage(thisApp.pages[0].id);
  },
  activatePage: function(pageId){
    const thisApp = this;

    /* add class "activate" to matching pages, remove from non-matching */
    
    /* add class "activate" to matching links, remove from non-matching */

  },
  initCart: function () {
    const thisApp = this;

    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);

    thisApp.productList = document.querySelector(select.containerOf.menu);

    thisApp.productList.addEventListener('add-to-cart', function (event) {
      app.cart.add(event.detail.product);
    });
  },
  initMenu: function () {
    const thisApp = this;

    for (let productData in thisApp.data.products) {
      new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
    }
  },
  initData: function () {
    const thisApp = this;
    thisApp.data = {};
    const url = settings.db.url + '/' + settings.db.product;

    new Api(url, thisApp.data, 'GET');
  },
  init: function () {
    const thisApp = this;

    thisApp.initPages();
    thisApp.initData();
    thisApp.initCart();
  },
};

app.init();

export default app;