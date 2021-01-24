import { settings, select, classNames, templates } from './../settings.js';
import Api from './Api.js';
import utils from './../utils.js';
import CartProduct from './CartProduct.js';

class Cart {
  constructor(element) {
    const thisCart = this;
    this.api = new Api();

    thisCart.products = [];

    thisCart.getElements(element);
    thisCart.initActions();

  }

  getElements(element) {
    const thisCart = this;

    thisCart.dom = {};

    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
    thisCart.dom.subTotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    thisCart.dom.priceSum = thisCart.dom.wrapper.querySelectorAll(select.cart.priceSum);
  }
  initActions() {
    const thisCart = this;

    thisCart.dom.toggleTrigger.addEventListener('click', function() {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });
    thisCart.dom.productList.addEventListener('updated', function(event) {
      event.preventDefault();
      thisCart.update();
      thisCart.priceChangeAnimation();
    });
    thisCart.dom.productList.addEventListener('remove', function(event) {
      thisCart.remove(event.detail.cartProduct);
    });
    thisCart.dom.form.addEventListener('submit', function(event) {
      event.preventDefault();
      if (thisCart.cartValidation() == true) {
        thisCart.sendOrder();
        thisCart.dom.phone.value = null;
        thisCart.dom.address.value = null;

        while (thisCart.dom.productList.hasChildNodes()) {
          thisCart.dom.productList.removeChild(thisCart.dom.productList.firstChild);
        }
        thisCart.products = [];
        thisCart.update();
      }
    });
    thisCart.dom.form.addEventListener('change', function() {
      thisCart.sendValidation();
    });
  }
  add(menuProduct) {
    const thisCart = this;

    const generatedHTML = templates.cartProduct(menuProduct);
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);
    thisCart.dom.productList.appendChild(generatedDOM);
    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    thisCart.update();
  }
  update() {
    const thisCart = this;
    let deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;
    for (let product of thisCart.products) {
      thisCart.totalNumber = thisCart.totalNumber + product.amount;
      thisCart.subtotalPrice = thisCart.subtotalPrice + product.price;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subTotalPrice.innerHTML = thisCart.subtotalPrice;
    }
    if (thisCart.totalNumber == 0) {
      deliveryFee = 0;
      thisCart.subtotalPrice = 0;
      thisCart.totalPrice = 0;
      thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
      thisCart.dom.subTotalPrice.innerHTML = thisCart.subtotalPrice;
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    } else {
      thisCart.totalPrice = thisCart.subtotalPrice + deliveryFee;
      thisCart.dom.deliveryFee.innerHTML = deliveryFee;
    }

    for (let totalPriceDisplay of thisCart.dom.totalPrice) {
      totalPriceDisplay.innerHTML = thisCart.totalPrice;
    }
  }
  remove(menuProduct) {
    const thisCart = this;

    const productsIndex = thisCart.products.indexOf(menuProduct);
    thisCart.products.splice(productsIndex, 1);
    menuProduct.dom.wrapper.remove();
    thisCart.update();

  }
  sendOrder() {
    const thisCart = this;
    const url = settings.db.order;
    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subTotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: settings.cart.defaultDeliveryFee,
      products: []
    };
    for (let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }
    this.api.post(url, payload);
  }
  cartValidation() {
    const thisCart = this;
    if (thisCart.dom.phone.value.length != 9) {
      thisCart.dom.phone.classList.add('error');
      if (thisCart.dom.address.value.length < 9) {
        thisCart.dom.address.classList.add('error');
      }
    } else if (thisCart.dom.address.value.length < 9) {
      thisCart.dom.address.classList.add('error');
      return false;
    } else if (thisCart.totalNumber == null || thisCart.totalNumber == 0) {
      return false;
    } else {
      return true;
    }
  }
  sendValidation() {
    const thisCart = this;

    if (thisCart.dom.phone.value.length == 9) {
      thisCart.dom.phone.classList.remove('error');
    }
    if (thisCart.dom.address.value.length == 9) {
      thisCart.dom.address.classList.remove('error');
    }
  }
  priceChangeAnimation() {
    const thisCart = this;
    for (let price of thisCart.dom.priceSum) {
      price.classList.add(classNames.cart.priceAnim);
      setTimeout(function() { price.classList.remove(classNames.cart.priceAnim); }, 700);
    }
  }
}

export default Cart;
