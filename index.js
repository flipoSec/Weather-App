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


searchInput.addEventListener('input', function(e) {
    const query = e.target.value.trim();
    

    clearTimeout(searchTimeout);
    

    if (query.length < 2) {
        searchResults.hidden = true;
        return;
    }
    
    // Wait for user to stop typing (300ms debounce)
    searchTimeout = setTimeout(() => {
        fetchLocationSuggestions(query);
    }, 300);
});

// Search button click
searchButton.addEventListener('click', function(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query.length >= 2) {
        fetchLocationSuggestions(query);
    }
});

// Fetch location suggestions from Open-Meteo Geocoding API
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

// Display search results in dropdown
function displaySearchResults(results) {
    // Clear previous results
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.hidden = true;
        return;
    }
    
    // Create result items
    results.forEach(location => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result';
        resultItem.setAttribute('role', 'option');
        
        // Format location name (city, country)
        const locationName = location.admin1 
            ? `${location.name}, ${location.admin1}, ${location.country}`
            : `${location.name}, ${location.country}`;
        
        resultItem.textContent = locationName;
        
        // Store coordinates for later use
        resultItem.dataset.lat = location.latitude;
        resultItem.dataset.lon = location.longitude;
        resultItem.dataset.name = locationName;
        
        // Add click handler
        resultItem.addEventListener('click', function() {
            selectLocation(this);
        });
        
        searchResults.appendChild(resultItem);
    });
    
    // Show results
    searchResults.hidden = false;
}

// Handle location selection
function selectLocation(resultElement) {
    const lat = resultElement.dataset.lat;
    const lon = resultElement.dataset.lon;
    const locationName = resultElement.dataset.name;
    
    // Update input with selected location
    searchInput.value = locationName;
    
    // Hide results
    searchResults.hidden = true;
    
    // Fetch weather for this location
    fetchWeatherData(lat, lon, locationName);
}

// Fetch weather data from Open-Meteo API
function fetchWeatherData(lat, lon, locationName) {
    // Show loading, hide error and previous data
    loadingState.hidden = false;
    errorState.hidden = true;
    weatherData.hidden = true;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Update UI with weather data
            updateWeatherUI(data, locationName);
            
            // Hide loading, show data
            loadingState.hidden = true;
            weatherData.hidden = false;
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            
            // Show error
            loadingState.hidden = true;
            errorState.hidden = false;
            document.getElementById('errorMessage').textContent = 'Failed to load weather data. Please try again.';
        });
}

// Update UI with weather data (placeholder - we'll implement this next)
function updateWeatherUI(data, locationName) {
    console.log('Weather data:', data);
    // We'll implement this in the next step
}

// Close search results when clicking outside
document.addEventListener('click', function(event) {
    const isClickInside = searchInput.contains(event.target) || 
                         searchResults.contains(event.target) ||
                         searchButton.contains(event.target);
    
    if (!isClickInside) {
        searchResults.hidden = true;
    }
});

// Handle keyboard navigation in results
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

// Allow arrow navigation in results
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







