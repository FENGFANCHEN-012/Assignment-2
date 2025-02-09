// Constants
const APIKEY = '678fa7439bd0c87432ac8bee';
const FEEDBACK_API = 'https://jackm-ff5c.restdb.io/rest/feedback';
const SUPPORT_STAFF_API = 'https://jackm-ff5c.restdb.io/rest/support-staff';

// DOM Elements
const feedbackForm = document.getElementById('feedback-form');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const feedbackList = document.querySelector('.feedback-list');
const ratingModal = document.getElementById('rating-modal');
const stars = document.querySelectorAll('.star');
const submitRatingBtn = document.getElementById('submit-rating');
const closeModalBtn = document.getElementById('close-modal');

// State
let currentFeedbackId = null;
let currentRating = 0;
const userId = localStorage.getItem('usrid');
const userEmail = localStorage.getItem('usremail');

// Display user email
const userEmailElement = document.getElementById('usrem');
if (userEmailElement) {
    userEmailElement.textContent = userEmail || '';
}

// Tab Functionality
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tab = button.dataset.tab;
        
        // Update active states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        if (tab === 'history') {
            loadFeedbackHistory();
        }
    });
});

// Submit Feedback
feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted'); // Debug log

    if (!userId || !userEmail) {
        alert('Please log in to submit feedback');
        return;
    }

    const feedback = {
        user_id: userId,
        user_email: userEmail,
        category: document.getElementById('category').value,
        priority: document.getElementById('priority').value,
        subject: document.getElementById('subject').value,
        description: document.getElementById('description').value,
        status: 'pending',
        created_at: new Date().toISOString(),
        support_staff_id: null,
        rating: null,
        rating_comment: null
    };

    console.log('Feedback data:', feedback); // Debug log

    try {
        const response = await fetch(FEEDBACK_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': APIKEY,
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(feedback)
        });

        console.log('Response status:', response.status); // Debug log

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error('Failed to submit feedback');
        }

        const result = await response.json();
        console.log('Success:', result); // Debug log

        alert('Feedback submitted successfully!');
        feedbackForm.reset();
        
        // Switch to history tab and refresh
        document.querySelector('[data-tab="history"]').click();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit feedback. Please try again.');
    }
});

// Load Feedback History
async function loadFeedbackHistory() {
    if (!userId) {
        feedbackList.innerHTML = '<p>Please log in to view your feedback history</p>';
        return;
    }

    try {
        const response = await fetch(`${FEEDBACK_API}?q={"user_id":"${userId}"}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': APIKEY,
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load feedback history');
        }

        const feedbacks = await response.json();
        displayFeedbackHistory(feedbacks);
    } catch (error) {
        console.error('Error:', error);
        feedbackList.innerHTML = '<p>Failed to load feedback history. Please try again.</p>';
    }
}

// Display Feedback History
function displayFeedbackHistory(feedbacks) {
    if (feedbacks.length === 0) {
        feedbackList.innerHTML = '<p>No feedback history found</p>';
        return;
    }

    feedbackList.innerHTML = feedbacks.map(feedback => `
        <div class="feedback-card">
            <div class="feedback-header">
                <h3>${feedback.subject}</h3>
                <span class="feedback-status status-${feedback.status}">${feedback.status}</span>
            </div>
            <p><strong>Category:</strong> ${feedback.category}</p>
            <p><strong>Priority:</strong> ${feedback.priority}</p>
            <p><strong>Description:</strong> ${feedback.description}</p>
            <p><strong>Submitted:</strong> ${new Date(feedback.created_at).toLocaleDateString()}</p>
            ${feedback.status === 'resolved' && !feedback.rating ? `
                <button onclick="openRatingModal('${feedback._id}')" class="submit-btn">Rate Support</button>
            ` : ''}
            ${feedback.rating ? `
                <div class="rating-display">
                    <p><strong>Your Rating:</strong> ${'★'.repeat(feedback.rating)}${'☆'.repeat(5-feedback.rating)}</p>
                    ${feedback.rating_comment ? `<p><strong>Comment:</strong> ${feedback.rating_comment}</p>` : ''}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Rating Functionality
function openRatingModal(feedbackId) {
    currentFeedbackId = feedbackId;
    currentRating = 0;
    ratingModal.style.display = 'block';
    updateStars(0);
}

stars.forEach(star => {
    star.addEventListener('mouseover', () => {
        updateStars(star.dataset.rating);
    });

    star.addEventListener('mouseout', () => {
        updateStars(currentRating);
    });

    star.addEventListener('click', () => {
        currentRating = parseInt(star.dataset.rating);
        updateStars(currentRating);
    });
});

function updateStars(rating) {
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        star.classList.toggle('active', starRating <= rating);
    });
}

submitRatingBtn.addEventListener('click', async () => {
    if (!currentRating) {
        alert('Please select a rating');
        return;
    }

    try {
        const response = await fetch(`${FEEDBACK_API}/${currentFeedbackId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-apikey': APIKEY,
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
                rating: currentRating,
                rating_comment: document.getElementById('rating-comment').value
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit rating');
        }

        alert('Rating submitted successfully!');
        ratingModal.style.display = 'none';
        loadFeedbackHistory();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit rating. Please try again.');
    }
});

closeModalBtn.addEventListener('click', () => {
    ratingModal.style.display = 'none';
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === ratingModal) {
        ratingModal.style.display = 'none';
    }
});

// Initial load
if (userId) {
    loadFeedbackHistory();
}