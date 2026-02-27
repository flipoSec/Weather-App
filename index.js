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








const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResults = document.getElementById('searchResults');
const weatherData = document.getElementById('weatherData');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');

let searchTimeout;

// Retry button - use last searched location
document.getElementById('retryButton').addEventListener('click', function() {
    // Get the last searched location from the input
    const query = searchInput.value.trim();
    
    if (query.length >= 2) {
        // Trigger search again
        searchButton.click();
    } else {
        // If no query, use default location (Berlin)
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
            } else {
                console.log('No locations found');
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
    // Hide error state initially
    errorState.hidden = true;
    
    // Hide loading state initially
    loadingState.hidden = true;
    
    // Show weather data with default Berlin values
    weatherData.hidden = false;
    
    // You could also fetch default weather for Berlin
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
    // When fetching new data:
    // - Show loading
    // - Hide error
    // - Hide weather data (will show again only on success)
    loadingState.hidden = false;
    errorState.hidden = true;
    weatherData.hidden = true;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Success: Update UI, show weather data, hide loading and error
            updateWeatherUI(data, locationName);
            loadingState.hidden = true;
            errorState.hidden = true;
            weatherData.hidden = false;
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            
            // Error: Hide loading and weather data, show error
            loadingState.hidden = true;
            weatherData.hidden = true;
            errorState.hidden = false;
            
            // Update error message to match design
            document.getElementById('errorMessage').textContent = 
                'We couldn\'t connect to the server (API error). Please try again in a few moments.';
        });
}

function updateWeatherUI(data, locationName) {
    document.getElementById('currentLocation').textContent = locationName;
    
    // Update current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('en-US', options);
    document.getElementById('currentDate').textContent = formattedDate;
    
    if (data.current_weather) {
        const current = data.current_weather;
        
        // Temperature
        document.getElementById('currentTemp').textContent = Math.round(current.temperature) + '°';
        
        // Weather description
        const weatherDesc = getWeatherDescription(current.weathercode);
        document.getElementById('currentDescription').textContent = weatherDesc;
        
        // Weather icon
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
        
        // Wind speed
        document.getElementById('windSpeed').textContent = 
            Math.round(current.windspeed) + ' km/h';
        
        // Feels like (approximate)
        document.getElementById('feelsLike').textContent = 
            Math.round(current.temperature - 2) + '°';
    }
    
    // Humidity (from hourly data)
    if (data.hourly && data.hourly.relativehumidity_2m) {
        document.getElementById('humidity').textContent = 
            data.hourly.relativehumidity_2m[0] + '%';
    }
    
    // Precipitation (from hourly data if available)
    if (data.hourly && data.hourly.precipitation) {
        document.getElementById('precipitation').textContent = 
            data.hourly.precipitation[0] + ' mm';
    }
    
    // Store data for hourly forecast
    window.hourlyData = data.hourly;
    window.dailyData = data.daily;
    
    // Display hourly forecast
    displayHourlyForecast(0);
    
    // Update daily forecast
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
    
    // each day has 24 hours (0-23)
    const startHour = dayIndex * 24;
    const endHour = startHour + 24;
    
    // show only hours from 6 AM to 10 PM (or all hours if you prefer)
    for (let i = startHour; i < endHour; i++) {
        if (i >= hourlyTime.length) break;
        
        // parse time to get hour only
        const timeStr = hourlyTime[i];
        const hour = new Date(timeStr).getHours();
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        const timeLabel = `${hour12} ${ampm}`;
        
        const temp = Math.round(hourlyTemp[i]);
        const weatherCode = hourlyWeatherCode[i];
        
        // get icon for this hour
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
        
        // create hourly slot
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







