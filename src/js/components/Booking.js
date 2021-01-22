import { templates, select, settings, classNames } from './../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from './../utils.js';
import Api from './Api.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.api = new Api();
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();

  }
  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking: settings.db.booking
        + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.event
        + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.event
        + '?' + params.eventsRepeat.join('&'),
    };
    Promise.all([
      thisBooking.api.get(urls.booking),
      thisBooking.api.get(urls.eventsCurrent),
      thisBooking.api.get(urls.eventsRepeat),
    ])
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }
  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePickerWidget.minDate;
    const maxDate = thisBooking.datePickerWidget.maxDate;
    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDOM();
  }
  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);
    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }
  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePickerWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerWidget.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }
  render(element) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);

    thisBooking.dom.datePickerWrapper = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPickerWrapper = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.tablesContainer = thisBooking.dom.wrapper.querySelector(select.booking.tablesContainer);

    thisBooking.dom.hoursAmountValue = thisBooking.dom.hoursAmount.querySelector(select.widgets.amount.input);
    thisBooking.dom.peopleAmountValue = thisBooking.dom.peopleAmount.querySelector(select.widgets.amount.input);

    thisBooking.dom.checkbox = thisBooking.dom.wrapper.querySelectorAll(select.booking.checkbox);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
  }
  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePickerWrapper);
    thisBooking.hourPickerWidget = new HourPicker(thisBooking.dom.hourPickerWrapper);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
      thisBooking.removeSelectedTable();
      thisBooking.selectedTableId = null;
    });
    thisBooking.dom.tablesContainer.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.clickedElement = event.target;
      thisBooking.selectedTable();
    });
    thisBooking.dom.wrapper.addEventListener('submit', function () {
      thisBooking.sendBooking();
    });
  }
  selectedTable() {
    const thisBooking = this;

    if (thisBooking.clickedElement.classList.contains(classNames.booking.table)
      && !thisBooking.clickedElement.classList.contains(classNames.booking.tableBooked)) {
      thisBooking.selectedTableId = thisBooking.clickedElement.getAttribute(settings.booking.tableIdAttribute);
      thisBooking.clickedElement.classList.toggle(classNames.booking.active);

      if (thisBooking.clickedElement.classList.contains(classNames.booking.active)) {
        thisBooking.removeSelectedTable();
        thisBooking.clickedElement.classList.toggle(classNames.booking.active);
      } else if (!thisBooking.clickedElement.classList.contains(classNames.booking.active)) {
        thisBooking.selectedTableId = null;
      }
    }
  }
  removeSelectedTable() {
    const thisBooking = this;
    for (let table of thisBooking.dom.tables) {
      table.classList.remove(classNames.booking.active);
    }
  }
  sendBooking() {
    const thisBooking = this;
    const url = settings.db.booking;

    const payload = {
      date: thisBooking.datePickerWidget.correctValue,
      hour: thisBooking.hourPickerWidget.correctValue,
      table: parseInt(thisBooking.selectedTableId),
      duration: parseInt(thisBooking.dom.hoursAmountValue.value),
      ppl: parseInt(thisBooking.dom.peopleAmountValue.value),
      starters: [],
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    for (let check of thisBooking.dom.checkbox) {
      if (check.checked == true) {
        payload.starters.push(check.value);
      }
    }
    thisBooking.api.post(url, payload)
      .then(function () {
        thisBooking.makeBooked();
      });
  }
}

export default Booking;