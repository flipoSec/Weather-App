let unitBtn = document.getElementById("unitsButton");
let unitMenu = document.getElementById("unitsMenu");

function toggleUnitsDropdown(){
    const isExpanded = unitBtn.getAttribute('aria-expanded') === 'true';
    unitBtn.setAttribute('aria-expanded', !isExpanded);
    unitMenu.hidden = isExpanded;
}

unitBtn.addEventListener('click', toggleUnitsDropdown);

document.addEventListener('click', function(event){
    const isClickInside = unitBtn.contains(event.target) || unitMenu.contains(event.target);
    if (!isClickInside && unitMenu.hidden === false){
        unitMenu.hidden = true;
        unitBtn.setAttribute('aria-expanded', 'false');
    }
});

document.addEventListener('keydown', function(event){
    if(event.key === 'Escape' && unitMenu.hidden === false){
        unitMenu.hidden = true;
        unitBtn.setAttribute('aria-expanded', 'false');
        unitBtn.focus();
    }
});

// Get all unit option buttons
const unitOptions = document.querySelectorAll('.optionButton:not(#imperialSwitch)');
const imperialSwitch = document.getElementById('imperialSwitch');

// Store original weather data for conversion
let lastWeatherData = null;
let lastLocationName = '';

// Unit conversion functions
const unitConverters = {
    celsiusToFahrenheit: (celsius) => Math.round((celsius * 9/5) + 32),
    fahrenheitToCelsius: (fahrenheit) => Math.round((fahrenheit - 32) * 5/9),
    kmhToMph: (kmh) => Math.round(kmh * 0.621371),
    mphToKmh: (mph) => Math.round(mph * 1.60934),
    mmToInches: (mm) => (mm * 0.0393701).toFixed(2),
    inchesToMm: (inches) => (inches / 0.0393701).toFixed(0)
};

// Current unit state
let currentUnits = {
    temperature: 'celsius',
    windSpeed: 'kmh',
    precipitation: 'mm'
};

// Handle individual unit selection
unitOptions.forEach(option => {
    option.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from siblings in same group
        const parentGroup = this.closest('.units-options');
        if (parentGroup) {
            parentGroup.querySelectorAll('.optionButton').forEach(btn => {
                btn.classList.remove('active');
            });
        }
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update unit state based on which button was clicked
        const optionId = this.id;
        
        if (optionId === 'celsius' || optionId === 'fahrenheit') {
            currentUnits.temperature = optionId === 'celsius' ? 'celsius' : 'fahrenheit';
        } else if (optionId === 'wind-kmh' || optionId === 'wind-mph') {
            currentUnits.windSpeed = optionId === 'wind-kmh' ? 'kmh' : 'mph';
        } else if (optionId === 'precip-mm' || optionId === 'precip-in') {
            currentUnits.precipitation = optionId === 'precip-mm' ? 'mm' : 'in';
        }
        
        // Update UI with new units if we have weather data
        if (lastWeatherData) {
            updateUnitsDisplay();
        }
    });
});

// Imperial switch toggles all to imperial
if (imperialSwitch) {
    imperialSwitch.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Set Fahrenheit active
        const fahrenheitBtn = document.getElementById('fahrenheit');
        const celsiusBtn = document.getElementById('celsius');
        
        if (fahrenheitBtn && celsiusBtn) {
            fahrenheitBtn.classList.add('active');
            celsiusBtn.classList.remove('active');
            currentUnits.temperature = 'fahrenheit';
        }
        
        // Set mph active
        const mphBtn = document.getElementById('wind-mph');
        const kmhBtn = document.getElementById('wind-kmh');
        
        if (mphBtn && kmhBtn) {
            mphBtn.classList.add('active');
            kmhBtn.classList.remove('active');
            currentUnits.windSpeed = 'mph';
        }
        
        // Set inches active
        const inchesBtn = document.getElementById('precip-in');
        const mmBtn = document.getElementById('precip-mm');
        
        if (inchesBtn && mmBtn) {
            inchesBtn.classList.add('active');
            mmBtn.classList.remove('active');
            currentUnits.precipitation = 'in';
        }
        
        // Update UI if we have weather data
        if (lastWeatherData) {
            updateUnitsDisplay();
        }
    });
}

// Function to update all displayed values based on current units
function updateUnitsDisplay() {
    if (!lastWeatherData || !lastWeatherData.current_weather) {
        return;
    }
    
    const current = lastWeatherData.current_weather;
    
    // Get original Celsius values
    let tempCelsius = current.temperature;
    let feelsLikeCelsius = current.temperature - 2;
    
    // Update temperature
    let tempValue = Math.round(tempCelsius);
    let tempUnit = '°C';
    if (currentUnits.temperature === 'fahrenheit') {
        tempValue = unitConverters.celsiusToFahrenheit(tempCelsius);
        tempUnit = '°F';
    }
    const tempElement = document.getElementById('currentTemp');
    if (tempElement) {
        tempElement.textContent = tempValue + tempUnit;
    }
    
    // Update feels like
    let feelsLike = Math.round(feelsLikeCelsius);
    let feelsLikeUnit = '°C';
    if (currentUnits.temperature === 'fahrenheit') {
        feelsLike = unitConverters.celsiusToFahrenheit(feelsLikeCelsius);
        feelsLikeUnit = '°F';
    }
    const feelsLikeElement = document.getElementById('feelsLike');
    if (feelsLikeElement) {
        feelsLikeElement.textContent = feelsLike + feelsLikeUnit;
    }
    
    // Update wind speed
    let windValue = Math.round(current.windspeed);
    let windUnit = 'km/h';
    if (currentUnits.windSpeed === 'mph') {
        windValue = unitConverters.kmhToMph(current.windspeed);
        windUnit = 'mph';
    }
    const windElement = document.getElementById('windSpeed');
    if (windElement) {
        windElement.textContent = windValue + ' ' + windUnit;
    }
    
    // Update precipitation
    if (lastWeatherData.hourly && lastWeatherData.hourly.precipitation) {
        let precipValue = lastWeatherData.hourly.precipitation[0];
        let precipUnit = 'mm';
        if (currentUnits.precipitation === 'in') {
            precipValue = unitConverters.mmToInches(precipValue);
            precipUnit = 'in';
        }
        const precipElement = document.getElementById('precipitation');
        if (precipElement) {
            precipElement.textContent = precipValue + ' ' + precipUnit;
        }
    }
    
    // Update daily forecast temperatures - use original values from lastWeatherData
    if (lastWeatherData.daily) {
        const forecastDays = document.getElementById('forecastDays');
        if (forecastDays) {
            const dayElements = forecastDays.children;
            
            for (let i = 0; i < dayElements.length; i++) {
                const dayElement = dayElements[i];
                const highSpan = dayElement.querySelector('.temp-high');
                const lowSpan = dayElement.querySelector('.temp-low');
                
                if (highSpan && lowSpan && i < lastWeatherData.daily.temperature_2m_max.length) {
                    // Use original values from API data, not the displayed text
                    let high = lastWeatherData.daily.temperature_2m_max[i];
                    let low = lastWeatherData.daily.temperature_2m_min[i];
                    
                    if (currentUnits.temperature === 'fahrenheit') {
                        high = unitConverters.celsiusToFahrenheit(high);
                        low = unitConverters.celsiusToFahrenheit(low);
                    } else {
                        high = Math.round(high);
                        low = Math.round(low);
                    }
                    
                    highSpan.textContent = high + '°';
                    lowSpan.textContent = low + '°';
                }
            }
        }
    }
    
    // Update hourly forecast temperatures
    if (window.hourlyData) {
        const hourlySlots = document.querySelectorAll('.forecast-hour .hour-temp');
        hourlySlots.forEach((slot, index) => {
            if (index < window.hourlyData.temperature_2m.length) {
                let temp = window.hourlyData.temperature_2m[index];
                if (currentUnits.temperature === 'fahrenheit') {
                    temp = unitConverters.celsiusToFahrenheit(temp);
                } else {
                    temp = Math.round(temp);
                }
                slot.textContent = temp + '°';
            }
        });
    }
}

// Set initial active states
window.addEventListener('load', function() {
    const celsiusBtn = document.getElementById('celsius');
    const kmhBtn = document.getElementById('wind-kmh');
    const mmBtn = document.getElementById('precip-mm');
    
    if (celsiusBtn) celsiusBtn.classList.add('active');
    if (kmhBtn) kmhBtn.classList.add('active');
    if (mmBtn) mmBtn.classList.add('active');
});

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResults = document.getElementById('searchResults');
const weatherData = document.getElementById('weatherData');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');

let searchTimeout;

// Retry button - use last searched location
document.getElementById('retryButton').addEventListener('click', function() {
    const query = searchInput.value.trim();
    
    if (query.length >= 2) {
        searchButton.click();
    } else {
        fetchWeatherData(52.52, 13.405, 'Berlin, Germany');
    }
});

// shows suggestions while typing
searchInput.addEventListener('input', function(e) {
    const query = e.target.value.trim();
    
    clearTimeout(searchTimeout);
    
    if (query.length < 2) {
        searchResults.hidden = true;
        return;
    }
    
    searchTimeout = setTimeout(() => {
        fetchLocationSuggestions(query);
    }, 200);
});

// search button click
searchButton.addEventListener('click', function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    
    if (query.length < 2) return;
    
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    
    fetch(geocodeUrl)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const location = data.results[0];
                const locationName = location.admin1 
                    ? `${location.name}, ${location.admin1}, ${location.country}`
                    : `${location.name}, ${location.country}`;
                
                fetchWeatherData(location.latitude, location.longitude, locationName);
                searchInput.value = locationName;
                searchResults.hidden = true;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorState.hidden = false;
            document.getElementById('errorMessage').textContent = 'Failed to find location. Please try again.';
        });
});

function fetchLocationSuggestions(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data.results || []);
        })
        .catch(error => {
            console.error('Error fetching locations:', error);
            searchResults.hidden = true;
        });
}

// Set initial state on page load
window.addEventListener('load', function() {
    errorState.hidden = true;
    loadingState.hidden = true;
    weatherData.hidden = false;
    // Uncomment to fetch Berlin weather on load
    // fetchWeatherData(52.52, 13.405, 'Berlin, Germany');
});

function displaySearchResults(results) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.hidden = true;
        return;
    }
    
    results.forEach(location => {
        const locationName = location.admin1 
            ? `${location.name}, ${location.admin1}, ${location.country}`
            : `${location.name}, ${location.country}`;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result';
        resultItem.setAttribute('role', 'option');
        resultItem.setAttribute('aria-selected', 'false');
        resultItem.textContent = locationName;
        resultItem.dataset.lat = location.latitude;
        resultItem.dataset.lon = location.longitude;
        resultItem.dataset.name = locationName;
        
        resultItem.addEventListener('click', function() {
            selectLocation(this);
        });
        
        searchResults.appendChild(resultItem);
    });
    
    searchResults.hidden = false;
}

function selectLocation(resultElement) {
    const lat = resultElement.dataset.lat;
    const lon = resultElement.dataset.lon;
    const locationName = resultElement.dataset.name;
    
    searchInput.value = locationName;
    searchResults.hidden = true;
    
    fetchWeatherData(lat, lon, locationName);
}

function fetchWeatherData(lat, lon, locationName) {
    loadingState.hidden = false;
    errorState.hidden = true;
    weatherData.hidden = true;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode,relativehumidity_2m,precipitation&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateWeatherUI(data, locationName);
            loadingState.hidden = true;
            errorState.hidden = true;
            weatherData.hidden = false;
            lastWeatherData = data;
            lastLocationName = locationName;
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            loadingState.hidden = true;
            weatherData.hidden = true;
            errorState.hidden = false;
            document.getElementById('errorMessage').textContent = 
                'We couldn\'t connect to the server (API error). Please try again in a few moments.';
        });
}

function updateWeatherUI(data, locationName) {
    document.getElementById('currentLocation').textContent = locationName;
    
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', options);
    document.getElementById('currentDate').textContent = formattedDate;
    
    if (data.current_weather) {
        const current = data.current_weather;
        
        document.getElementById('currentTemp').textContent = Math.round(current.temperature) + '°';
        
        const weatherDesc = getWeatherDescription(current.weathercode);
        document.getElementById('currentDescription').textContent = weatherDesc;
        
        const iconMap = {
            0: 'icon-sunny.webp',
            1: 'icon-sunny.webp',
            2: 'icon-partly-cloudy.webp',
            3: 'icon-overcast.webp',
            45: 'icon-fog.webp',
            51: 'icon-rain.webp',
            61: 'icon-rain.webp',
            71: 'icon-snow.webp',
            95: 'icon-thunderstorm.webp'
        };
        const iconFile = iconMap[current.weathercode] || 'icon-overcast.webp';
        document.getElementById('currentWeatherIcon').src = `./assets/images/${iconFile}`;
        
        document.getElementById('windSpeed').textContent = Math.round(current.windspeed) + ' km/h';
        document.getElementById('feelsLike').textContent = Math.round(current.temperature - 2) + '°';
    }
    
    if (data.hourly && data.hourly.relativehumidity_2m) {
        document.getElementById('humidity').textContent = data.hourly.relativehumidity_2m[0] + '%';
    }
    
    if (data.hourly && data.hourly.precipitation) {
        document.getElementById('precipitation').textContent = data.hourly.precipitation[0] + ' mm';
    }
    
    window.hourlyData = data.hourly;
    window.dailyData = data.daily;
    
    displayHourlyForecast(0);
    
    if (data.daily) {
        const forecastDays = document.getElementById('forecastDays');
        forecastDays.innerHTML = '';
        
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        data.daily.time.forEach((date, index) => {
            if (index >= 7) return;
            
            const dayDate = new Date(date);
            const dayName = days[dayDate.getDay()];
            const maxTemp = Math.round(data.daily.temperature_2m_max[index]);
            const minTemp = Math.round(data.daily.temperature_2m_min[index]);
            const weatherCode = data.daily.weathercode[index];
            
            const iconMap = {
                0: 'icon-sunny.webp',
                1: 'icon-sunny.webp',
                2: 'icon-partly-cloudy.webp',
                3: 'icon-overcast.webp',
                45: 'icon-fog.webp',
                51: 'icon-rain.webp',
                61: 'icon-rain.webp',
                71: 'icon-snow.webp',
                95: 'icon-thunderstorm.webp'
            };
            const iconFile = iconMap[weatherCode] || 'icon-overcast.webp';
            
            const dayElement = document.createElement('div');
            dayElement.className = 'forecast-day';
            dayElement.innerHTML = `
                <div class="day-name">${dayName}</div>
                <img src="./assets/images/${iconFile}" alt="Weather" class="day-icon">
                <div class="day-temps">
                    <span class="temp-high">${maxTemp}°</span>
                    <span class="temp-low">${minTemp}°</span>
                </div>
            `;
            
            forecastDays.appendChild(dayElement);
        });
    }
}

function getWeatherDescription(code) {
    const descriptions = {
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
        99: 'Heavy thunderstorm with hail'
    };
    return descriptions[code] || 'Unknown';
}

// keyboard navigation
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        searchResults.hidden = true;
    }
    
    if (e.key === 'ArrowDown' && !searchResults.hidden) {
        e.preventDefault();
        const firstResult = searchResults.querySelector('.search-result');
        if (firstResult) firstResult.focus();
    }
});

searchResults.addEventListener('keydown', function(e) {
    const results = Array.from(searchResults.querySelectorAll('.search-result'));
    const currentIndex = results.indexOf(document.activeElement);
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % results.length;
        results[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + results.length) % results.length;
        results[prevIndex].focus();
    } else if (e.key === 'Enter' && document.activeElement.classList.contains('search-result')) {
        e.preventDefault();
        selectLocation(document.activeElement);
    }
});

// display hourly forecast for a specific day index
function displayHourlyForecast(dayIndex) {
    if (!window.hourlyData) return;
    
    const hourlyContainer = document.getElementById('forecastHours');
    hourlyContainer.innerHTML = ''; 
    
    const hourlyTime = window.hourlyData.time;
    const hourlyTemp = window.hourlyData.temperature_2m;
    const hourlyWeatherCode = window.hourlyData.weathercode;
    
    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    
    for (let i = startHour; i < endHour; i++) {
        if (i >= hourlyTime.length) break;
        
        const timeStr = hourlyTime[i];
        const hour = new Date(timeStr).getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const timeLabel = `${hour12} ${ampm}`;
        
        const temp = Math.round(hourlyTemp[i]);
        const weatherCode = hourlyWeatherCode[i];
        
        const iconMap = {
            0: 'icon-sunny.webp',
            1: 'icon-sunny.webp',
            2: 'icon-partly-cloudy.webp',
            3: 'icon-overcast.webp',
            45: 'icon-fog.webp',
            51: 'icon-rain.webp',
            61: 'icon-rain.webp',
            71: 'icon-snow.webp',
            95: 'icon-thunderstorm.webp'
        };
        const iconFile = iconMap[weatherCode] || 'icon-overcast.webp';
        
        const hourSlot = document.createElement('div');
        hourSlot.className = 'forecast-hour';
        hourSlot.innerHTML = `
            <div class="hour-time">${timeLabel}</div>
            <img src="./assets/images/${iconFile}" alt="Weather" class="hour-icon">
            <div class="hour-temp">${temp}°</div>
        `;
        
        hourlyContainer.appendChild(hourSlot);
    }
}

// day selector change handler
document.getElementById('daySelector').addEventListener('change', function(e) {
    const selectedDay = parseInt(e.target.value);
    displayHourlyForecast(selectedDay);
});