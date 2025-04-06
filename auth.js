// auth.js - Handles authentication and API calls

const API_BASE_URL = 'http://localhost:5000/api';

function storeToken(token) {
    localStorage.setItem('authToken', token);
}

function getToken() {
    return localStorage.getItem('authToken');
}

function clearToken() {
    localStorage.removeItem('authToken');
}

// Register user
async function registerUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        return { error: 'Failed to register' };
    }
}

// Login user
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (data.token) {
            storeToken(data.token);
        }
        return data;
    } catch (error) {
        console.error('Login error:', error);
        return { error: 'Failed to login' };
    }
}

// Get monitored items
async function getMonitoredItems() {
    const token = getToken();
    if (!token) return { error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_BASE_URL}/monitored-items`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching monitored items:', error);
        return { error: 'Failed to fetch monitored items' };
    }
}

// Add monitored item
async function addMonitoredItem(type, value) {
    const token = getToken();
    if (!token) return { error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_BASE_URL}/monitored-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ type, value })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error adding monitored item:', error);
        return { error: 'Failed to add monitored item' };
    }
}

// Check for breaches
async function checkBreaches() {
    const token = getToken();
    if (!token) return { error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_BASE_URL}/check-breaches`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error checking breaches:', error);
        return { error: 'Failed to check breaches' };
    }
}

// Get breach events
async function getBreachEvents() {
    const token = getToken();
    if (!token) return { error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_BASE_URL}/breach-events`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching breach events:', error);
        return { error: 'Failed to fetch breach events' };
    }
}

// Logout user
async function logoutUser() {
    const token = getToken();
    if (!token) return { error: 'Not authenticated' };

    try {
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            clearToken();
            return { message: 'Logged out successfully' };
        } else {
            return { error: 'Failed to logout' };
        }
    } catch (error) {
        console.error('Logout error:', error);
        clearToken(); // Fallback: clear token even if API call fails
        return { error: 'Failed to logout' };
    }
}

// Update signup.html form submission
document.addEventListener('DOMContentLoaded', function() {
    // Signup form
    const signupForm = document.querySelector('form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            const password = this.querySelector('input[type="password"]').value;
            
            const result = await registerUser(email, password);
            if (result.message) {
                alert('Registration successful! Please login.');
                window.location.href = 'dashboard.html';
            } else {
                alert(result.error || 'Registration failed');
            }
        });
    }

    // Verification form
    const verificationForm = document.getElementById('verificationForm');
    if (verificationForm) {
        verificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Here you would typically send the verification data to your backend
            // For now, we'll just simulate success
            alert('Verification successful!');
            window.location.href = 'dashboard.html';
        });
    }

    // Dashboard buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const company = this.parentElement.querySelector('img').alt;
            alert(`Action taken for ${company}. This would trigger an API call in a real implementation.`);
        });
    });

    // Load user data on dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardData();
    }
});

// Load dashboard data
async function loadDashboardData() {
    const breachEvents = await getBreachEvents();
    if (breachEvents && !breachEvents.error) {
        // Update the UI with breach data
        const breachCount = breachEvents.length;
        const highlightElement = document.querySelector('.highlight');
        if (highlightElement) {
            highlightElement.textContent = breachCount;
        }
        
        // You would also populate the cards with actual breach data here
    } else if (breachEvents.error) {
        console.error(breachEvents.error);
    }
}

// Handle authorize data access
function authorizeDataAccess() {
    const token = getToken();
    if (!token) {
        alert('Please login first');
        return;
    }
    
    // In a real implementation, this would make an API call
    alert('Data access authorized. This would trigger an API call in a real implementation.');
}

// Handle lodge complaint
function lodgeComplaint() {
    const token = getToken();
    if (!token) {
        alert('Please login first');
        return;
    }
    
    // In a real implementation, this would make an API call
    alert('Complaint lodged. This would trigger an API call in a real implementation.');
}

// Handle logout
document.getElementById('logout-btn').addEventListener('click', async function(e) {
    e.preventDefault();
    
    const result = await logoutUser();
    if (result.message) {
        alert(result.message);
        window.location.href = 'login.html'; // Redirect to login page
    } else {
        alert(result.error || 'Logout failed');
    }
});