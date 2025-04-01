// Global variables to track state
let currentActivities = [];
let displayedActivities = 0;
const activitiesPerPage = 9;
let filters = {
    category: 'all',
    activityLength: 'all',
    setupTime: 'all',
    messiness: 'all',
    search: ''
};

// DOM elements
const activitiesGrid = document.getElementById('activities-grid');
const loadMoreBtn = document.getElementById('load-more-btn');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const skillCategories = document.querySelectorAll('.skill-category');
const filterChips = document.querySelectorAll('.filter-chip');

// Convert setup time text to the values in our data
const setupTimeMap = {
    'Quick': '2 min',
    'Some Prep': '5 min',
    'Plan Ahead': '10+ min'
};

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    filterAndDisplayActivities();
    
    // Event: Search button click
    searchButton.addEventListener('click', function() {
        filters.search = searchInput.value.trim().toLowerCase();
        resetDisplayedActivities();
        filterAndDisplayActivities();
        
        // Track search in analytics if available
        if (typeof gtag === 'function') {
            gtag('event', 'search', {
                'search_term': filters.search
            });
        }
    });
    
    // Event: Search input enter key
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            filters.search = searchInput.value.trim().toLowerCase();
            resetDisplayedActivities();
            filterAndDisplayActivities();
            
            // Track search in analytics if available
            if (typeof gtag === 'function') {
                gtag('event', 'search', {
                    'search_term': filters.search
                });
            }
        }
    });
    
    // Event: Load more button
    loadMoreBtn.addEventListener('click', function() {
        displayMoreActivities();
        
        // Track load more in analytics if available
        if (typeof gtag === 'function') {
            gtag('event', 'load_more', {
                'displayed_count': displayedActivities,
                'total_count': currentActivities.length
            });
        }
    });
});

// Initialize filter event listeners
function initializeFilters() {
    // Skill category filters
    skillCategories.forEach(category => {
        category.addEventListener('click', function() {
            const categoryName = this.getAttribute('data-category');
            
            // Toggle selected state
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                filters.category = 'all';
            } else {
                // Remove selected from all categories
                skillCategories.forEach(cat => cat.classList.remove('selected'));
                this.classList.add('selected');
                filters.category = categoryName;
                
                // Track category filter in analytics if available
                if (typeof gtag === 'function') {
                    gtag('event', 'filter_category', {
                        'category': categoryName
                    });
                }
            }
            resetDisplayedActivities();
            filterAndDisplayActivities();
        });
    });
    
    // Filter chips (activityLength, setupTime, messiness)
    filterChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const filterGroup = this.parentElement.getAttribute('data-filter-group');
            const value = this.getAttribute('data-value');
            
            // Remove selected from all chips in the same group
            const groupChips = this.parentElement.querySelectorAll('.filter-chip');
            groupChips.forEach(c => c.classList.remove('selected'));
            
            // Add selected to this chip
            this.classList.add('selected');
            
            // Update filters
            if (value === 'all') {
                delete filters[filterGroup];
            } else {
                if (filterGroup === 'setupTime') {
                    // Convert display text to actual data value
                    filters[filterGroup] = setupTimeMap[value];
                } else {
                    filters[filterGroup] = value;
                }
                
                // Track filter in analytics if available
                if (typeof gtag === 'function' && value !== 'all') {
                    gtag('event', 'filter_' + filterGroup, {
                        'value': value
                    });
                }
            }
            
            resetDisplayedActivities();
            filterAndDisplayActivities();
        });
    });
}

// Filter activities based on current filters
function filterActivities() {
    let filtered = [...activities];
    
    // Category filter
    if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter(activity => activity.category === filters.category);
    }
    
    // Activity length filter
    if (filters.activityLength && filters.activityLength !== 'all') {
        filtered = filtered.filter(activity => activity.activityLength === filters.activityLength);
    }
    
    // Setup time filter
    if (filters.setupTime && filters.setupTime !== 'all') {
        filtered = filtered.filter(activity => activity.setupTime === filters.setupTime);
    }
    
    // Messiness filter
    if (filters.messiness && filters.messiness !== 'all') {
        filtered = filtered.filter(activity => activity.messiness === filters.messiness);
    }
    
    // Search filter
    if (filters.search) {
        filtered = filtered.filter(activity => {
            const searchText = filters.search.toLowerCase();
            return (
                activity.title.toLowerCase().includes(searchText) ||
                activity.description.toLowerCase().includes(searchText) ||
                activity.materials.some(material => material.toLowerCase().includes(searchText)) ||
                activity.skillFocus.toLowerCase().includes(searchText)
            );
        });
    }
    
    return filtered;
}

// Filter and display activities
function filterAndDisplayActivities() {
    currentActivities = filterActivities();
    
    // Clear the grid
    activitiesGrid.innerHTML = '';
    
    // Check if no results
    if (currentActivities.length === 0) {
        activitiesGrid.innerHTML = '<div class="no-results">No activities match your filters. Try adjusting your search criteria.</div>';
        loadMoreBtn.style.display = 'none';
        return;
    }
    
    // Display initial batch of activities
    displayMoreActivities();
}

// Display more activities
function displayMoreActivities() {
    const endIndex = Math.min(displayedActivities + activitiesPerPage, currentActivities.length);
    const activitiesToDisplay = currentActivities.slice(displayedActivities, endIndex);
    
    // Create and append activity cards
    activitiesToDisplay.forEach(activity => {
        const card = createActivityCard(activity);
        activitiesGrid.appendChild(card);
    });
    
    // Update count and check if more to load
    displayedActivities = endIndex;
    
    if (displayedActivities >= currentActivities.length) {
        loadMoreBtn.style.display = 'none';
    } else {
        loadMoreBtn.style.display = 'block';
    }
}

// Create an activity card element
function createActivityCard(activity) {
    const card = document.createElement('article'); // Changed from div to article
    card.className = `activity-card card-${activity.category}`;
    card.setAttribute('aria-labelledby', `activity-title-${activity.id}`);
    
    const materialsHTML = activity.materials.map(material => 
        `<div class="material-chip">${material}</div>`
    ).join('');
    
    card.innerHTML = `
        <div class="card-header">
            <h3 id="activity-title-${activity.id}" class="activity-title">${activity.title}</h3>
            <div class="age-range">Ages ${activity.ageRange}</div>
        </div>
        <div class="activity-content">
            <p class="activity-description">
                ${activity.description}
            </p>
            
            <div class="materials-needed" aria-label="Materials needed">
                ${materialsHTML}
            </div>
            
            <div class="activity-meta">
                <div class="meta-item">
                    <div class="meta-icon" aria-hidden="true">⏱️</div>
                    <div>${activity.activityLength}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-icon" aria-hidden="true">🔨</div>
                    <div>${activity.setupTime} setup</div>
                </div>
                <div class="meta-item">
                    <div class="meta-icon" aria-hidden="true">🌟</div>
                    <div>${activity.skillFocus}</div>
                </div>
            </div>
        </div>
    `;
    
    // Add schema.org structured data for the activity
    const structuredData = document.createElement('script');
    structuredData.type = 'application/ld+json';
    structuredData.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": activity.title,
        "description": activity.description,
        "audience": {
            "@type": "Audience",
            "audienceType": "Parents, Educators, Caregivers"
        },
        "educationalUse": "Interactive activity",
        "learningResourceType": "Activity",
        "typicalAgeRange": activity.ageRange,
        "educationalAlignment": {
            "@type": "AlignmentObject",
            "alignmentType": "educationalSubject",
            "educationalFramework": "Early Childhood Development",
            "targetName": activity.category.charAt(0).toUpperCase() + activity.category.slice(1) + " Skills"
        }
    });
    
    card.appendChild(structuredData);
    
    return card;
}

// Reset displayed activities count
function resetDisplayedActivities() {
    displayedActivities = 0;
}
