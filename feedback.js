// Constants
const APIKEY = '67a9a09c020c068f77e6537d';
const FEEDBACK_API = 'https://fedpart2-130c.restdb.io/rest/feedback';

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

// Submit Feedback
feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    
    const feedback = {
        user_id: 'anonymous',
        user_email: emailInput.value,
        category: document.getElementById('category').value,
        priority: document.getElementById('priority').value,
        subject: document.getElementById('subject').value,
        description: document.getElementById('description').value,
        status: 'pending',
        created_at: new Date().toISOString(),
        support_staff_id: '',
        rating: 0,
        rating_comment: ''
    };

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

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error('Failed to submit feedback');
        }

        const result = await response.json();
        console.log('Success:', result);
        alert('Feedback submitted successfully!');
        feedbackForm.reset();
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit feedback. Please try again.');
    }
});

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

// Load Feedback History
async function loadFeedbackHistory() {
    const emailInput = document.getElementById('email');
    const userEmail = emailInput.value;

    if (!userEmail) {
        feedbackList.innerHTML = '<p>Please enter your email to view your feedback history</p>';
        return;
    }

    try {
        const response = await fetch(`${FEEDBACK_API}?q={"user_email":"${userEmail}"}`, {
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

// Rating Modal Functionality
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