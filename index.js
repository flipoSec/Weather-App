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

// Search input with debounce (shows suggestions while typing)
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

// Search button click - direct weather fetch (no dropdown selection needed)
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
                // You could show a "not found" message here
            }
        })
        .catch(error => {
            console.error('Error:', error);
            errorState.hidden = false;
            document.getElementById('errorMessage').textContent = 'Failed to find location. Please try again.';
        });
});

// Fetch location suggestions for dropdown
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

// Display search results dropdown
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

// Select location from dropdown
function selectLocation(resultElement) {
    const lat = resultElement.dataset.lat;
    const lon = resultElement.dataset.lon;
    const locationName = resultElement.dataset.name;
    
    searchInput.value = locationName;
    searchResults.hidden = true;
    
    fetchWeatherData(lat, lon, locationName);
}

// Fetch weather data from Open-Meteo
function fetchWeatherData(lat, lon, locationName) {
    loadingState.hidden = false;
    errorState.hidden = true;
    weatherData.hidden = true;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            updateWeatherUI(data, locationName);
            loadingState.hidden = true;
            weatherData.hidden = false;
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            loadingState.hidden = true;
            errorState.hidden = false;
            document.getElementById('errorMessage').textContent = 'Failed to load weather data. Please try again.';
        });
}

// Update UI with weather data
function updateWeatherUI(data, locationName) {
    document.getElementById('currentLocation').textContent = locationName;
    
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
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const isClickInside = searchInput.contains(event.target) || 
                         searchResults.contains(event.target) ||
                         searchButton.contains(event.target);
    
    if (!isClickInside) {
        searchResults.hidden = true;
    }
});

// Weather code to description mapping
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

// Keyboard navigation
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






