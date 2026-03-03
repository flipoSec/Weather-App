// ─── Constants ───────────────────────────────────────────────────────────────

const WEATHER_ICON_MAP = {
  0: 'icon-sunny.webp',
  1: 'icon-sunny.webp',
  2: 'icon-partly-cloudy.webp',
  3: 'icon-overcast.webp',
  45: 'icon-fog.webp',
  48: 'icon-fog.webp',
  51: 'icon-rain.webp',
  53: 'icon-rain.webp',
  55: 'icon-rain.webp',
  61: 'icon-rain.webp',
  63: 'icon-rain.webp',
  65: 'icon-rain.webp',
  71: 'icon-snow.webp',
  73: 'icon-snow.webp',
  75: 'icon-snow.webp',
  80: 'icon-rain.webp',
  81: 'icon-rain.webp',
  82: 'icon-rain.webp',
  95: 'icon-thunderstorm.webp',
  96: 'icon-thunderstorm.webp',
  99: 'icon-thunderstorm.webp',
};

const WEATHER_DESCRIPTIONS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Heavy thunderstorm with hail',
};

// ─── Unit Converters ─────────────────────────────────────────────────────────

const unitConverters = {
  celsiusToFahrenheit: (c) => Math.round((c * 9) / 5 + 32),
  kmhToMph: (k) => Math.round(k * 0.621371),
  mmToInches: (mm) => (mm * 0.0393701).toFixed(2),
};

// ─── State ───────────────────────────────────────────────────────────────────

let lastWeatherData = null;
let lastLocationName = '';
let searchTimeout = null;
let activeController = null; // Cancels stale in-flight requests

let currentUnits = {
  temperature: 'celsius',
  windSpeed: 'kmh',
  precipitation: 'mm',
};

// ─── DOM References ──────────────────────────────────────────────────────────

const unitBtn = document.getElementById('unitsButton');
const unitMenu = document.getElementById('unitsMenu');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResults = document.getElementById('searchResults');
const weatherData = document.getElementById('weatherData');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const imperialSwitch = document.getElementById('imperialSwitch');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeatherIcon(code) {
  return `./assets/images/${WEATHER_ICON_MAP[code] || 'icon-overcast.webp'}`;
}

function getWeatherDescription(code) {
  return WEATHER_DESCRIPTIONS[code] || 'Unknown';
}

/**
 * Find the hourly array index that matches the current local hour.
 * Falls back to 0 if not found.
 */
function getCurrentHourIndex(hourlyTimes) {
  if (!hourlyTimes || hourlyTimes.length === 0) return 0;
  const now = new Date();
  // Build a local ISO-like prefix: "YYYY-MM-DDTHH"
  const pad = (n) => String(n).padStart(2, '0');
  const localPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}`;
  const idx = hourlyTimes.findIndex((t) => t.startsWith(localPrefix));
  return idx !== -1 ? idx : 0;
}

/**
 * Convert a temperature value from Celsius if needed.
 */
function convertTemp(celsius) {
  return currentUnits.temperature === 'fahrenheit'
    ? unitConverters.celsiusToFahrenheit(celsius)
    : Math.round(celsius);
}

function tempLabel() {
  return currentUnits.temperature === 'fahrenheit' ? '°F' : '°C';
}

// ─── Units Dropdown ──────────────────────────────────────────────────────────

function openUnitsMenu() {
  unitBtn.setAttribute('aria-expanded', 'true');
  unitMenu.hidden = false;
}

function closeUnitsMenu(returnFocus = false) {
  unitBtn.setAttribute('aria-expanded', 'false');
  unitMenu.hidden = true;
  if (returnFocus) unitBtn.focus();
}

unitBtn.addEventListener('click', () => {
  const isOpen = unitBtn.getAttribute('aria-expanded') === 'true';
  isOpen ? closeUnitsMenu() : openUnitsMenu();
});

document.addEventListener('click', (e) => {
  if (!unitBtn.contains(e.target) && !unitMenu.contains(e.target)) {
    closeUnitsMenu();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !unitMenu.hidden) {
    closeUnitsMenu(true);
  }
});

// ─── Unit Option Buttons ─────────────────────────────────────────────────────

document.querySelectorAll('.optionButton').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();

    // Deactivate siblings in the same group
    const group = btn.closest('.units-options');
    if (group) {
      group.querySelectorAll('.optionButton').forEach((b) => b.classList.remove('active'));
    }
    btn.classList.add('active');

    // Update state
    switch (btn.id) {
      case 'celsius':
      case 'fahrenheit':
        currentUnits.temperature = btn.id;
        break;
      case 'wind-kmh':
      case 'wind-mph':
        currentUnits.windSpeed = btn.id === 'wind-kmh' ? 'kmh' : 'mph';
        break;
      case 'precip-mm':
      case 'precip-in':
        currentUnits.precipitation = btn.id === 'precip-mm' ? 'mm' : 'in';
        break;
    }

    if (lastWeatherData) updateUnitsDisplay();
  });
});

// Imperial switch — sets all units to imperial at once
imperialSwitch.addEventListener('click', (e) => {
  e.preventDefault();

  setActiveOption('fahrenheit');
  setActiveOption('wind-mph');
  setActiveOption('precip-in');

  currentUnits.temperature = 'fahrenheit';
  currentUnits.windSpeed = 'mph';
  currentUnits.precipitation = 'in';

  if (lastWeatherData) updateUnitsDisplay();
});

function setActiveOption(id) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const group = btn.closest('.units-options');
  if (group) group.querySelectorAll('.optionButton').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
}

// ─── Update UI after unit change ─────────────────────────────────────────────

function updateUnitsDisplay() {
  if (!lastWeatherData) return;

  const current = lastWeatherData.current_weather;
  const hourly = lastWeatherData.hourly;
  const daily = lastWeatherData.daily;

  // Current temp
  document.getElementById('currentTemp').textContent =
    convertTemp(current.temperature) + tempLabel();

  // Feels like — use apparent_temperature from hourly if available
  const currentIdx = getCurrentHourIndex(hourly.time);
  const feelsLikeRaw =
    hourly.apparent_temperature
      ? hourly.apparent_temperature[currentIdx]
      : current.temperature - 2;
  document.getElementById('feelsLike').textContent =
    convertTemp(feelsLikeRaw) + tempLabel();

  // Wind speed
  let windValue = Math.round(current.windspeed);
  let windUnit = 'km/h';
  if (currentUnits.windSpeed === 'mph') {
    windValue = unitConverters.kmhToMph(current.windspeed);
    windUnit = 'mph';
  }
  document.getElementById('windSpeed').textContent = `${windValue} ${windUnit}`;

  // Precipitation
  if (hourly.precipitation) {
    let precipValue = hourly.precipitation[currentIdx];
    let precipUnit = 'mm';
    if (currentUnits.precipitation === 'in') {
      precipValue = unitConverters.mmToInches(precipValue);
      precipUnit = 'in';
    }
    document.getElementById('precipitation').textContent = `${precipValue} ${precipUnit}`;
  }

  // Daily forecast temperatures
  if (daily) {
    const dayEls = document.getElementById('forecastDays').children;
    Array.from(dayEls).forEach((el, i) => {
      if (i >= daily.temperature_2m_max.length) return;
      el.querySelector('.temp-high').textContent =
        convertTemp(daily.temperature_2m_max[i]) + '°';
      el.querySelector('.temp-low').textContent =
        convertTemp(daily.temperature_2m_min[i]) + '°';
    });
  }

  // Re-render hourly forecast with updated units
  const selectedDay = parseInt(document.getElementById('daySelector').value, 10);
  displayHourlyForecast(selectedDay);
}

// ─── Search ───────────────────────────────────────────────────────────────────

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  clearTimeout(searchTimeout);

  if (query.length < 2) {
    searchResults.hidden = true;
    return;
  }

  searchTimeout = setTimeout(() => fetchLocationSuggestions(query), 300);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchResults.hidden = true;
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    triggerSearch();
    return;
  }
  if (e.key === 'ArrowDown' && !searchResults.hidden) {
    e.preventDefault();
    const first = searchResults.querySelector('.search-result');
    if (first) first.focus();
  }
});

searchButton.addEventListener('click', (e) => {
  e.preventDefault();
  triggerSearch();
});

searchResults.addEventListener('keydown', (e) => {
  const results = Array.from(searchResults.querySelectorAll('.search-result'));
  const idx = results.indexOf(document.activeElement);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    results[(idx + 1) % results.length].focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    results[(idx - 1 + results.length) % results.length].focus();
  } else if (e.key === 'Enter' && document.activeElement.classList.contains('search-result')) {
    e.preventDefault();
    selectLocation(document.activeElement);
  } else if (e.key === 'Escape') {
    searchResults.hidden = true;
    searchInput.focus();
  }
});

// Close search results when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container')) {
    searchResults.hidden = true;
  }
});

function triggerSearch() {
  const query = searchInput.value.trim();
  if (query.length < 2) return;

  // Cancel any pending suggestion fetch
  clearTimeout(searchTimeout);
  searchResults.hidden = true;

  // Show loading, hide others while geocoding
  loadingState.hidden = false;
  errorState.hidden = true;
  weatherData.hidden = true;

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;

  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      if (data.results && data.results.length > 0) {
        const loc = data.results[0];
        const name = buildLocationName(loc);
        searchInput.value = name;
        searchResults.hidden = true;
        fetchWeatherData(loc.latitude, loc.longitude, name);
      } else {
        showError('No location found. Please try a different search term.');
      }
    })
    .catch(() => showError('Failed to find location. Please check your connection.'));
}

function fetchLocationSuggestions(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;

  fetch(url)
    .then((r) => r.json())
    .then((data) => displaySearchResults(data.results || []))
    .catch(() => { searchResults.hidden = true; });
}

function displaySearchResults(results) {
  searchResults.innerHTML = '';

  if (results.length === 0) {
    searchResults.hidden = true;
    return;
  }

  results.forEach((loc) => {
    const name = buildLocationName(loc);
    const item = document.createElement('div');
    item.className = 'search-result';
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    item.setAttribute('tabindex', '0');
    item.textContent = name;
    item.dataset.lat = loc.latitude;
    item.dataset.lon = loc.longitude;
    item.dataset.name = name;

    item.addEventListener('click', () => selectLocation(item));
    searchResults.appendChild(item);
  });

  searchResults.hidden = false;
}

function selectLocation(el) {
  searchInput.value = el.dataset.name;
  searchResults.hidden = true;

  // Explicitly set state before fetching
  loadingState.hidden = false;
  errorState.hidden = true;
  weatherData.hidden = true;

  fetchWeatherData(el.dataset.lat, el.dataset.lon, el.dataset.name);
}

function buildLocationName(loc) {
  return loc.admin1
    ? `${loc.name}, ${loc.admin1}, ${loc.country}`
    : `${loc.name}, ${loc.country}`;
}

// ─── Weather Fetching ─────────────────────────────────────────────────────────

function fetchWeatherData(lat, lon, locationName) {
  // Abort any in-flight weather request
  if (activeController) activeController.abort();
  activeController = new AbortController();
  const signal = activeController.signal;

  loadingState.hidden = false;
  errorState.hidden = true;
  weatherData.hidden = true;

  const url = [
    `https://api.open-meteo.com/v1/forecast`,
    `?latitude=${lat}&longitude=${lon}`,
    `&current_weather=true`,
    `&hourly=temperature_2m,apparent_temperature,weathercode,relative_humidity_2m,precipitation`,
    `&daily=weathercode,temperature_2m_max,temperature_2m_min`,
    `&timezone=auto`,
  ].join('');

  fetch(url, { signal })
    .then((r) => {
      if (!r.ok) throw new Error('Network response was not ok');
      return r.json();
    })
    .then((data) => {
      lastWeatherData = data;
      lastLocationName = locationName;

      updateWeatherUI(data, locationName);

      loadingState.hidden = true;
      errorState.hidden = true;
      weatherData.hidden = false;
    })
    .catch((err) => {
      if (err.name === 'AbortError') return; // Stale request — ignore silently
      loadingState.hidden = true;
      weatherData.hidden = true;
      showError("We couldn't connect to the server. Please try again in a few moments.");
    });
}

function showError(message) {
  loadingState.hidden = true;
  weatherData.hidden = true;
  errorState.hidden = false;
  document.getElementById('errorMessage').textContent = message;
}

// ─── Weather UI ───────────────────────────────────────────────────────────────

function updateWeatherUI(data, locationName) {
  // Location & date
  document.getElementById('currentLocation').textContent = locationName;
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const current = data.current_weather;
  const hourly = data.hourly;
  const currentIdx = getCurrentHourIndex(hourly.time);

  // Temperature
  document.getElementById('currentTemp').textContent =
    convertTemp(current.temperature) + tempLabel();

  // Description & icon
  document.getElementById('currentDescription').textContent =
    getWeatherDescription(current.weathercode);
  document.getElementById('currentWeatherIcon').src = getWeatherIcon(current.weathercode);
  document.getElementById('currentWeatherIcon').alt = getWeatherDescription(current.weathercode);

  // Wind speed
  let windValue = Math.round(current.windspeed);
  let windUnit = 'km/h';
  if (currentUnits.windSpeed === 'mph') {
    windValue = unitConverters.kmhToMph(current.windspeed);
    windUnit = 'mph';
  }
  document.getElementById('windSpeed').textContent = `${windValue} ${windUnit}`;

  // Feels like — prefer apparent_temperature from API
  const feelsLikeRaw = hourly.apparent_temperature
    ? hourly.apparent_temperature[currentIdx]
    : current.temperature - 2;
  document.getElementById('feelsLike').textContent =
    convertTemp(feelsLikeRaw) + tempLabel();

  // Humidity (current hour)
  if (hourly.relative_humidity_2m) {
    document.getElementById('humidity').textContent =
      hourly.relative_humidity_2m[currentIdx] + '%';
  }

  // Precipitation (current hour)
  if (hourly.precipitation) {
    let precipValue = hourly.precipitation[currentIdx];
    let precipUnit = 'mm';
    if (currentUnits.precipitation === 'in') {
      precipValue = unitConverters.mmToInches(precipValue);
      precipUnit = 'in';
    }
    document.getElementById('precipitation').textContent = `${precipValue} ${precipUnit}`;
  }

  // Daily forecast
  buildDailyForecast(data.daily);

  // Hourly forecast (default: first day)
  displayHourlyForecast(0);

  // Rebuild day selector options from actual dates
  buildDaySelector(data.daily);
}

function buildDailyForecast(daily) {
  if (!daily) return;
  const container = document.getElementById('forecastDays');
  container.innerHTML = '';

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  daily.time.slice(0, 7).forEach((dateStr, i) => {
    const dayName = DAY_NAMES[new Date(dateStr).getDay()];
    const high = convertTemp(daily.temperature_2m_max[i]);
    const low = convertTemp(daily.temperature_2m_min[i]);
    const desc = getWeatherDescription(daily.weathercode[i]);
    const icon = getWeatherIcon(daily.weathercode[i]);

    const el = document.createElement('button');
    el.className = 'forecast-day';
    el.type = 'button';
    el.setAttribute('aria-label', `${dayName}: ${desc}, high ${high}°, low ${low}°`);
    el.innerHTML = `
      <div class="day-name">${dayName}</div>
      <img src="${icon}" alt="${desc}" class="day-icon">
      <div class="day-temps">
        <span class="temp-high">${high}°</span>
        <span class="temp-low">${low}°</span>
      </div>
    `;

    // Click to sync hourly forecast to that day
    el.addEventListener('click', () => {
      document.querySelectorAll('.forecast-day').forEach((d) => d.classList.remove('active'));
      el.classList.add('active');
      document.getElementById('daySelector').value = i;
      displayHourlyForecast(i);
    });

    container.appendChild(el);
  });
}

function buildDaySelector(daily) {
  if (!daily) return;
  const selector = document.getElementById('daySelector');
  selector.innerHTML = '';

  const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  daily.time.slice(0, 7).forEach((dateStr, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = DAY_NAMES_FULL[new Date(dateStr).getDay()];
    selector.appendChild(opt);
  });
}

// ─── Hourly Forecast ──────────────────────────────────────────────────────────

function displayHourlyForecast(dayIndex) {
  const hourly = lastWeatherData?.hourly;
  if (!hourly) return;

  const container = document.getElementById('forecastHours');
  container.innerHTML = '';

  const start = dayIndex * 24;
  const end = start + 24;

  for (let i = start; i < end && i < hourly.time.length; i++) {
    const hour = new Date(hourly.time[i]).getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;

    const temp = convertTemp(hourly.temperature_2m[i]);
    const desc = getWeatherDescription(hourly.weathercode[i]);
    const icon = getWeatherIcon(hourly.weathercode[i]);

    const slot = document.createElement('div');
    slot.className = 'forecast-hour';
    slot.innerHTML = `
      <div class="hour-time">${hour12} ${ampm}</div>
      <img src="${icon}" alt="${desc}" class="hour-icon">
      <div class="hour-temp">${temp}°</div>
    `;
    container.appendChild(slot);
  }
}

document.getElementById('daySelector').addEventListener('change', (e) => {
  const day = parseInt(e.target.value, 10);

  // Sync active state on daily forecast cards
  const dayCards = document.querySelectorAll('.forecast-day');
  dayCards.forEach((c, i) => c.classList.toggle('active', i === day));

  displayHourlyForecast(day);
});

// ─── Retry Button ─────────────────────────────────────────────────────────────

document.getElementById('retryButton').addEventListener('click', () => {
  if (lastLocationName && lastWeatherData) {
    const lat = lastWeatherData.latitude;
    const lon = lastWeatherData.longitude;
    fetchWeatherData(lat, lon, lastLocationName);
  } else {
    const query = searchInput.value.trim();
    if (query.length >= 2) triggerSearch();
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
  // Set default active unit buttons
  document.getElementById('celsius').classList.add('active');
  document.getElementById('wind-kmh').classList.add('active');
  document.getElementById('precip-mm').classList.add('active');

  // Hide ALL panels on load — nothing shows until user searches
  errorState.hidden = true;
  loadingState.hidden = true;
  weatherData.hidden = true;

});