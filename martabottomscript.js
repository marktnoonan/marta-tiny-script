var alreadySwitchedView = false;

checkWidth(); // incase we open in small window!

window.addEventListener("resize", checkWidth);

function checkWidth() {
  if (window.innerWidth < 600 && !alreadySwitchedView) {
    alreadySwitchedView = true;
    showMobileView();
  }
}

function showMobileView() {
  var bookings = [];

  var clientName = document.querySelector("#portlet-navigation-tree > div > div > div.portletContent.even").textContent;

  var servicesMenu = document.querySelectorAll("#portlet-navigation-tree > div > div")[1].innerHTML;

  var tripHeaders = document.querySelectorAll(".tripheader");
  var bookingIDs = [].slice.call(tripHeaders).map(function(element) {
    return element.textContent.substr(13);
  });

  var tripsTable = document.querySelector("body > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td:nth-child(1) > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td:nth-child(2) > table:nth-child(5)");

  var tripsData = tripsTable.querySelectorAll('td');

  var tripDates = [];
  fetchFromTripsData(tripDates, 1, 7);

  //var tripDates = [tripsData[1].textContent.substr(7), tripsData[21].textContent.substr(7)];

  var displayDates = tripDates.map(function(rawDate) {
    return new Date(Date.parse(rawDate)).toDateString();
  });

  var readyTimes = [];
  fetchFromTripsData(readyTimes, 7, 14);
  readyTimes = formatArrayOfTimes(readyTimes);

  var endWindowTimes = [];
  fetchFromTripsData(endWindowTimes, 8, 12);
  endWindowTimes = formatArrayOfTimes(endWindowTimes);

  var statuses = [];
  fetchFromTripsData(statuses, 9, 17);

  var pickupAddresses = [];
  fetchFromTripsData(pickupAddresses, 13, 0)

  var dropOffAddresses = [];
  fetchFromTripsData(dropOffAddresses, 17, 0);

  var nextETA = formatTime(tripsData[2].textContent.substr(33, 5));

  for (var i = 0; i < bookingIDs.length; i++) {

    var bookingObject = {
      bookingID: bookingIDs[i],
      date: tripDates[i],
      readyTime: readyTimes[i],
      displayReadyTime: convertFromMiltaryTime(readyTimes[i]),
      endWindow: endWindowTimes[i],
      displayEndWindow: convertFromMiltaryTime(endWindowTimes[i]),
      status: statuses[i],
      pickupAddress: pickupAddresses[i],
      dropOffAddress: dropOffAddresses[i],
      displayDate: displayDates[i]

    }

    // TODO: replace this if condition with a check for which trip is actually active.
    if (i === 0) {
      bookingObject.eta = nextETA;
      bookingObject.displayEta = convertFromMiltaryTime(nextETA);
      bookingObject.etaInMinutes = convertTimeToMinutes(nextETA);
      bookingObject.currentTimeInMinutes = convertTimeToMinutes((new Date).toTimeString().substr(0, 5));
      bookingObject.windowEndInMinutes = convertTimeToMinutes(endWindowTimes[i]);
      bookingObject.delayInMinutes = checkHowLate(bookingObject.etaInMinutes, bookingObject.windowEndInMinutes);
      if (bookingObject.delayInMinutes > 1) {
        bookingObject.delayInMinutesDescription = ", " + bookingObject.delayInMinutes +
          " minutes late.";
      } else if (bookingObject.delayInMinutes === 1) {
        bookingObject.delayInMinutesDescription = ", " + bookingObject.delayInMinutes +
          " minute late.";
      } else if (bookingObject.delayInMinutes < -1) {
        bookingObject.delayInMinutesDescription = ", " + Math.abs(bookingObject.delayInMinutes) +
          " minutes early.";
      } else if (bookingObject.delayInMinutes === -1) {
        bookingObject.delayInMinutesDescription = ", " + Math.abs(bookingObject.delayInMinutes) +
          " minute early.";
      } else if (bookingObject.delayInMinutes < 0) {
        bookingObject.delayInMinutesDescription = ", right on time.";
      }

      if (bookingObject.delayInMinutes > 30) {
        bookingObject.statusDescription = ", running late.";
      } else if (bookingObject.delayInMinutes < 30) {
        bookingObject.statusDescription = ", arriving in window.";
      } else {
        bookingObject.statusDescription = ", arriving on time.";
      }

    }
    bookings.push(bookingObject);
  }

  (function init() {
    bookings;
    showTrips();
    setMarker();
  })();

  function showTrips() {
    var htmlBuffer = '<div class="bookings-wrapper" style="display:block;position:absolute;background-color:#eee; width:calc(100vw - 40px); min-height:100%; top:0; left:0;padding:20px; font-size: 14px; text-align: center; font-family: sans-serif"><div class="client-info text-align-center"> Hi, <b>' + clientName + '</b>    </div>' + '<br> <h1>Your Upcoming Trips </h1>';

    bookings.map(function(booking) {
      htmlBuffer += '<div class="booking" id="booking" style="box-shadow: 0 0 6px 4px rgba(200,200,200,0.7); border-radius: 4px; margin: 10px; padding: 0 10px 10px 8px; padding-bottom: 6px; max-width: 310px; background-color:#fff; text-align: center; display:inline-block;"> <div class="date-and-id" id="date-and-id"> <span class="display-date"><h2 style="border:0;"><b><u>' + booking.displayDate + '</b></u></h2></span></div><div class="ready-time-gage"> <b>ETA</b>: ' + (booking.displayEta || 'No ETA yet') + (booking.delayInMinutesDescription || "") + '<br><br><span class="ready-time"><b>Start Window</b>: ' + booking.displayReadyTime + '</span> <span class="ready-time"><b>End Window</b>: ' + booking.displayEndWindow + '</span>' + '<br><br><div><b>Pick Up</b><Br>' + booking.pickupAddress + '<br><Br><b>Drop Off</b><br>' + booking.dropOffAddress + '</div><br><div class="booking-status"><b>Trip Status</b>: ' + booking.status + '<span class="late-status">' + (booking.statusDescription || ".") + '</span><br><Br> <div class="progress-wrapper" style="display: none; margin-bottom: 10px; font-size: 12px;"> <div class="labels" style="text-align: left; width: 240px;"> <div class="label left" style="width: 100px; text-align: left; display: inline-block;"> <b>Ready Time</b><br>' + booking.displayReadyTime + ' </div> <div class="label center" style="width: 100px;text-align: left;display: inline-block;transform: translateX(20px);"><b>End Window</b><br>' + booking.displayEndWindow + ' </div> </div> <div class="outer" style="text-align: left; width: 240px; background-color: #111; padding: 2px;"> <div class="inner" style="height: 30px; background-color: #595; background: linear-gradient(to right, #595 0%, #ee5 50%,#000 50%, #000 51%, #ee5 51%, #f55 80%);"> <span class="eta label" style="position: relative;display: inline-block;box-sizing: border-box;height: 100%;padding-top: 5px; font-weight: bold;text-align: left;background: rgba(255, 255, 255, 0.6);transform: translateX(96px);border-left: 1px solid #000;padding-right: 4px;">⬅ ETA ' + booking.displayEta + '</span> </div> </div> </div> </div>' + '</div></div><br>';

    });
    htmlBuffer += "</div>";
    document.querySelector('body').innerHTML += htmlBuffer;
  }

  function setMarker() {
    var lateMins = bookings[0].delayInMinutes;
    var markerDistance = (lateMins * 4) + "px";
    document.querySelector(".eta").style.transform = "translateX(" + markerDistance + ")";
    document.querySelector(".progress-wrapper").style.display = "inline-block";
    //the last line is just a quick hack to only show this on the first trip.
    //TODO: create proper templates for each trip category (Future, Past, Active, Cancelled)
  }

  function checkHowLate(eta, windowEnd) {
    var newDelayInMinutes = 30 - (windowEnd - eta);
    return newDelayInMinutes;
  }

  function formatTime(time) {
    if (time.charAt(0) === " ") {
      var fixedTime = time.replace(" ", "0");
      return fixedTime;
    } else {
      return time;
    }
  }

  function convertFromMiltaryTime(time) {
    var segments = time.split(":");
    var hourSegment = segments[0];
    var minuteSegment = segments[1];
    var amPm = hourSegment < 12 ? "AM" : "PM";
    // converting from Military time if needed.
    var convertedHour = hourSegment % 12;
    return convertedHour + ":" + minuteSegment + " " + amPm;
  }

  function convertTimeToMinutes(time) {
    var timeInMinutes = time.split(":");
    timeInMinutes = (timeInMinutes[0] * 60) + parseInt(timeInMinutes[1]);
    return timeInMinutes;
  }

  function fetchFromTripsData(destinationArray, firstIndex, substrStart, substrEnd) {
    var n = firstIndex;
    if (!substrEnd) {
      for (var i = 0; i < bookingIDs.length; i++) {
        destinationArray.push(tripsData[n].textContent.substr(substrStart));
        n += 20;
      }
    } else {
      for (var i = 0; i < bookingIDs.length; i++) {
        destinationArry.push(tripsData[n].textContent.substr(substrStart, substrEnd));
        n += 20;
      }
    }
  }

  function formatArrayOfTimes(array) {
    return array.map(function(time) {
      return formatTime(time);
    });
  }
};
