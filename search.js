// Search and Browse Functionality
const APIKEY = '678fa7439bd0c87432ac8bee';
const API_URL = 'https://jackm-ff5c.restdb.io/rest/listings';

// Cache DOM elements
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const productsGrid = document.querySelector('.products-grid');
const categoryLinks = document.querySelectorAll('.nav-link');
const loadMoreBtn = document.querySelector('.btn-load-more');

let currentPage = 1;
const itemsPerPage = 8;
let currentCategory = '';
let currentSearch = '';
let savedListings = new Set(JSON.parse(localStorage.getItem('savedListings') || '[]'));

// Search functionality
function handleSearch() {
    currentSearch = searchInput.value.trim().toLowerCase();
    currentPage = 1;
    fetchListings();
}

searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Category browsing
categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        categoryLinks.forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        
        const category = e.target.textContent;
        if (category === 'Saved') {
            showSavedListings();
        } else {
            currentCategory = category === 'All' ? '' : category;
            currentPage = 1;
            fetchListings();
        }
    });
});

// Fetch listings from API
async function fetchListings() {
    productsGrid.innerHTML = '<div class="loading">Loading...</div>';
    
    try {
        const queryObj = {};
        
        if (currentCategory) {
            queryObj.category = currentCategory;
        }
        
        if (currentSearch) {
            queryObj.$or = [
                { title: { $regex: currentSearch, $options: 'i' } },
                { description: { $regex: currentSearch, $options: 'i' } }
            ];
        }

        const queryStr = JSON.stringify(queryObj);
        const maxItems = itemsPerPage;
        const skip = (currentPage - 1) * itemsPerPage;

        const response = await fetch(`${API_URL}?q=${queryStr}&max=${maxItems}&skip=${skip}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': APIKEY
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const listings = await response.json();
        displayListings(listings);
    } catch (error) {
        console.error('Error fetching listings:', error);
        productsGrid.innerHTML = '<div class="error">Error loading listings. Please try again.</div>';
    }
}

// Display listings in the grid
function displayListings(listings) {
    if (currentPage === 1) {
        productsGrid.innerHTML = '';
    }

    if (listings.length === 0) {
        productsGrid.innerHTML = '<div class="no-results">No listings found</div>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    listings.forEach(listing => {
        const card = createListingCard(listing);
        productsGrid.appendChild(card);
    });

    loadMoreBtn.style.display = listings.length < itemsPerPage ? 'none' : 'block';
}

// Create listing card
function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const isSaved = savedListings.has(listing._id);
    
    card.innerHTML = `
        <div class="product-image" style="background-image: url(${listing.image || 'https://via.placeholder.com/200'})"></div>
        <div class="product-info">
            <h3>${listing.title}</h3>
            <p>${listing.description || ''}</p>
            <p class="price">$${listing.price.toFixed(2)}</p>
            <button class="save-button ${isSaved ? 'saved' : ''}" data-id="${listing._id}">
                ${isSaved ? '❤️ Saved' : '🤍 Save'}
            </button>
        </div>
    `;

    const saveButton = card.querySelector('.save-button');
    saveButton.addEventListener('click', () => toggleSave(listing._id, saveButton));

    return card;
}

// Toggle save functionality
function toggleSave(listingId, button) {
    const isLoggedIn = localStorage.getItem('usrid') !== null;
    const isIndex2 = window.location.pathname.includes('index2.html');

    if (!isLoggedIn && !isIndex2) {
        alert('Please log in to save listings');
        return;
    }

    if (savedListings.has(listingId)) {
        savedListings.delete(listingId);
        button.textContent = '🤍 Save';
        button.classList.remove('saved');
    } else {
        savedListings.add(listingId);
        button.textContent = '❤️ Saved';
        button.classList.add('saved');
    }

    localStorage.setItem('savedListings', JSON.stringify([...savedListings]));
}

// Show saved listings
async function showSavedListings() {
    const savedIds = [...savedListings];
    if (savedIds.length === 0) {
        productsGrid.innerHTML = '<div class="no-saved">No saved listings yet</div>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    try {
        const query = { _id: { $in: savedIds } };
        const response = await fetch(`${API_URL}?q=${JSON.stringify(query)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': APIKEY
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const listings = await response.json();
        displayListings(listings);
    } catch (error) {
        console.error('Error fetching saved listings:', error);
        productsGrid.innerHTML = '<div class="error">Error loading saved listings</div>';
    }
}

// Load more functionality
loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    fetchListings();
});

// Initial load
fetchListings();