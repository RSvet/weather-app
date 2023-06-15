"use strict";
import "core-js/stable";
import "regenerator-runtime/runtime";
import { async } from "regenerator-runtime";
import iconsWeather from "url:../img/sprite-weather.svg";
import iconsRegular from "url:../img/sprite-regular.svg";
import { API_URL_LOCATION } from "./helper";
import { API_URL_WEATHER } from "./helper";
import { API_URL_REVERSE_LOCATION } from "./helper";
import { getJSON } from "./helper";
import { NUM_DAYS_FORECAST } from "./helper";

require("dotenv").config();
const KEY_WEATHER = process.env.KEY_WEATHER;
const KEY_LOCATION = process.env.KEY_LOCATION;

// Dom elements
const searchForm = document.querySelector(".search");
const frontCard = document.querySelector(".card__side--front");
const backCard = document.querySelector(".card__side--back");

// weather State
const weatherState = {
  chosenLocation: "",
  todayWeather: {},
  futureWeather: [],
};

// get location from input field
const getInputLocation = function () {
  const inputValue = searchForm.querySelector(".search__input").value;
  searchForm.querySelector(".search__input").value = "";
  searchForm.querySelector(".search__input").blur();
  return inputValue;
};

// make today's date in the right form
const makeDate = function (zone) {
  const date = new Date();
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: zone,
  }).format(date);
};

// set dates for future days in the right form
const setFutureDates = function (date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(new Date(date));
};

// convert hours for sunrise and sunset to AM/PM
const convertHours = function (hours, zone) {
  let arrTime = makeDate(zone).split(", ").splice(0, 2).join(", ");
  return new Date(`${arrTime} ${hours}`).toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" },
    "en-US"
  );
};

// make today weather object
const makeTodayWeatherObject = function (data) {
  return {
    currentDate: makeDate(data.timezone),
    weatherIcon: data.currentConditions.icon,
    weatherConditions: data.currentConditions.conditions,
    currentTemp: data.currentConditions.temp,
    feel: data.currentConditions.feelslike,
    minTemp: data.days[0].tempmin,
    maxTemp: data.days[0].tempmax,
    humidity: data.currentConditions.humidity,
    sunrise: convertHours(data.currentConditions.sunrise, data.timezone),
    sunset: convertHours(data.currentConditions.sunset, data.timezone),
    windSpeed: data.currentConditions.windspeed,
    uvIndex: data.currentConditions.uvindex,
  };
};

// make future weather objects
const makeFutureWeatherObjects = function (arrDays) {
  return arrDays.map(
    (day) =>
      (day = {
        date: setFutureDates(day.datetime),
        weatherIcon: day.icon,
        uvIndex: day.uvindex,
        wind: day.windspeed,
        minTemp: day.tempmin,
        maxTemp: day.tempmax,
      })
  );
};

// generate error message
const generateErrorMessage = function () {
  const htmlErrorFront = ` <div class="error-msg">
  <h2>Location not found, please try again.</h2>
</div>`;
  const htmlErrorBack = ` <div class="error-msg error-back">
<h2>Location not found, please try again.</h2>
</div>`;
  frontCard.innerHTML = "";
  frontCard.insertAdjacentHTML("afterbegin", htmlErrorFront);
  backCard.querySelector(".card__future-forecast").innerHTML = "";

  backCard
    .querySelector(".card__future-forecast")
    .insertAdjacentHTML("afterbegin", htmlErrorBack);
};

// generate html for today's weather
const generateTodayMarkup = function (state) {
  const htmlFront = `<h1 class="card__location">${state.chosenLocation}</h1>
  <h2 class="card__time">${state.todayWeather.currentDate}</h2>
  <div class="card__today-data">
    <div class="card__today-weather">
      <div class="card__today-condition">
        <svg class="card__today-weather-icon">
          <use href="${iconsWeather}#${state.todayWeather.weatherIcon}"></use>
        </svg>
      </div>
      <div class="card__today-temperature">
        <p>${state.todayWeather.weatherConditions}</p>
        <span>${Math.round(state.todayWeather.currentTemp)}&deg;C</span>
        <p>Feels like: ${Math.round(state.todayWeather.feel)}&deg;C</p>
      </div>
    </div>
    <div class="card__today-details">
      <div class="card__today-detail">
        <p>Min: ${Math.round(state.todayWeather.minTemp)} &deg;C</p>
        <p>Max: ${Math.round(state.todayWeather.maxTemp)} &deg;C</p>
      </div>
      <div class="card__today-detail">
        <svg class="card__today-icon">
          <use href="${iconsRegular}#humidity"></use>
        </svg>
        <p>Humidity: ${Math.round(state.todayWeather.humidity)}%</p>
      </div>
      <div class="card__today-detail">
        <svg class="card__today-icon">
          <use href="${iconsRegular}#sunrise"></use>
        </svg>
        <p>Sunrise: ${state.todayWeather.sunrise}</p>
      </div>
      <div class="card__today-detail">
        <svg class="card__today-icon">
          <use href="${iconsRegular}#sunset"></use>
        </svg>
        <p>Sunset: ${state.todayWeather.sunset}</p>
      </div>
      <div class="card__today-detail">
        <svg class="card__today-icon">
          <use href="${iconsRegular}#wind-speed"></use>
        </svg>
        <p>Wind: ${Math.round(state.todayWeather.windSpeed)} km/h</p>
      </div>
      <div class="card__today-detail">
        <svg class="card__today-icon">
          <use href="${iconsRegular}#uvindex"></use>
        </svg>
        <p>UV index: ${state.todayWeather.uvIndex}</p>
      </div>
    </div>
  </div>
  <div class="card__note">Mouse over to see 4-days forecast</div>
  `;

  frontCard.innerHTML = "";
  frontCard.insertAdjacentHTML("afterbegin", htmlFront);
};

// generate html for future dates
const generateFutureMarkup = function (data) {
  let htmlBack = `<h2 class="card__back-heading">Next ${NUM_DAYS_FORECAST} days:</h2>`;
  data.futureWeather.forEach(
    (day) =>
      (htmlBack += `<div class="card__future-condition">
      <p class="card__future-date">${day.date}</p>
      <svg class="card__future-weather-icon">
        <use href="${iconsWeather}#${day.weatherIcon}"></use>
      </svg>

      <div class="card__additional">
        <p>UV Index: ${day.uvIndex}</p>
        <p>Wind: ${Math.round(day.wind)}km/h</p>
      </div>
      <div>
        <p>Min: ${Math.round(day.minTemp)}&deg;C</p>
        <p>Max: ${Math.round(day.maxTemp)}&deg;C</p>
      </div>
    </div>`)
  );
  backCard.querySelector(".card__future-forecast").innerHTML = "";

  backCard
    .querySelector(".card__future-forecast")
    .insertAdjacentHTML("afterbegin", htmlBack);
};

// generate Loading element
const generateLoader = function () {
  const htmlSpinner = `<div class="loader"></div>`;

  frontCard.innerHTML = "";
  frontCard.insertAdjacentHTML("afterbegin", htmlSpinner);

  backCard.querySelector(".card__future-forecast").innerHTML = "";
  backCard
    .querySelector(".card__future-forecast")
    .insertAdjacentHTML("afterbegin", htmlSpinner);
};

// getting location from browser
const getCurrentLocation = async function (lat, lon) {
  try {
    const data = await getJSON(
      `${API_URL_REVERSE_LOCATION}q=${lat}+${lon}&key=${KEY_LOCATION}`
    );
    weatherState.chosenLocation = data.results[0].formatted
      .split(", ")
      .slice(1)
      .join(", ");
  } catch (err) {
    throw err;
  }
};

// getting data about searched location from API
const getLocationData = async function (location) {
  try {
    const data = await getJSON(
      `${API_URL_LOCATION}json?q=${location}&key=${KEY_LOCATION}`
    );
    weatherState.chosenLocation = data.results[0].formatted;
    const { lat, lng } = data.results[0].geometry;
    return [lat, lng];
  } catch (err) {
    throw err;
  }
};

// weather information from api
const getWeather = async function (lat, lon) {
  try {
    const data = await getJSON(
      `${API_URL_WEATHER}${lat},${lon}?unitGroup=metric&key=${KEY_WEATHER}`
    );
    weatherState.todayWeather = makeTodayWeatherObject(data);
    weatherState.futureWeather = makeFutureWeatherObjects(
      data.days.slice(1, NUM_DAYS_FORECAST + 1)
    );
  } catch (err) {
    throw err;
  }
};

// initial weather card based on user's location
const controlInitialCardInfo = function () {
  navigator.geolocation.getCurrentPosition(
    async function (position) {
      try {
        generateLoader();
        const { latitude, longitude } = position.coords;

        await getCurrentLocation(latitude, longitude);
        await getWeather(latitude, longitude);
        generateTodayMarkup(weatherState);
        generateFutureMarkup(weatherState);
      } catch (err) {
        generateErrorMessage();
      }
    },
    function () {
      generateErrorMessage();
    }
  );
};

// weather card after requesting other location
const controlCardInfo = async function () {
  try {
    // loading element
    generateLoader();
    // weather data
    const searchQuery = getInputLocation();
    const coord = await getLocationData(searchQuery);
    await getWeather(...coord);
    generateTodayMarkup(weatherState);
    generateFutureMarkup(weatherState);
  } catch (err) {
    generateErrorMessage();
  }
};

// initialization
const init = function () {
  controlInitialCardInfo();
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    controlCardInfo();
  });
};

init();
