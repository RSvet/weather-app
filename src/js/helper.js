import "regenerator-runtime/runtime";
// api urls
export const API_URL_WEATHER =
  "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";

export const API_URL_LOCATION = "https://api.opencagedata.com/geocode/v1/";
export const API_URL_REVERSE_LOCATION =
  "https://api.opencagedata.com/geocode/v1/json?";

export const NUM_DAYS_FORECAST = 4;
const TIMEOUT_SEC = 10;

const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} second`));
    }, s * 1000);
  });
};

export const getJSON = async function (url) {
  try {
    const fetchPro = fetch(url);
    const res = await Promise.race([fetchPro, timeout(TIMEOUT_SEC)]);

    const data = await res.json();

    if (!res.ok)
      throw new Error(`Problem getting data ${data.message} (${res.status})`);

    if (data.results?.length === 0) throw new Error(`Location not found`);
    return data;
  } catch (err) {
    console.log(err.message);
    throw err;
  }
};
