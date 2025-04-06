// app.js - Main application logic
document.addEventListener('DOMContentLoaded', function() {
    // State management
    let currentUser = null;
    
    // DOM Elements
    const mainContent = document.getElementById('main-content');
    const homeLink = document.getElementById('home-link');
    const dashboardLink = document.getElementById('dashboard-link');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const logoutLink = document.getElementById('logout-link');
    
    // Initialize the app
    init();
    
    function init() {
        // Check if user is logged in
        checkAuthStatus();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load home page by default
        loadHomePage();
    }
    
    function checkAuthStatus() {
        const token = getToken();
        if (token) {
            // User is logged in
            loginLink.style.display = 'none';
            registerLink.style.display = 'none';
            logoutLink.style.display = 'block';
            dashboardLink.style.display = 'block';
        } else {
            // User is not logged in
            loginLink.style.display = 'block';
            registerLink.style.display = 'block';
            logoutLink.style.display = 'none';
            dashboardLink.style.display = 'none';
        }
    }
    
    function setupEventListeners() {
        // Navigation links
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadHomePage();
        });
        
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadDashboard();
        });
        
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadLoginPage();
        });
        
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadRegisterPage();
        });
        
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser().then(() => {
                checkAuthStatus();
                loadHomePage();
                showAlert('Logged out successfully', 'success');
            });
        });
    }
    
    // Page loading functions
    function loadHomePage() {
        const template = document.getElementById('home-template');
        const clone = template.content.cloneNode(true);
        mainContent.innerHTML = '';
        mainContent.appendChild(clone);
        
        // Add event listener to get started button
        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => {
                const token = getToken();
                if (token) {
                    loadDashboard();
                } else {
                    loadLoginPage();
                }
            });
        }
    }
    
    function loadLoginPage() {
        const template = document.getElementById('login-template');
        const clone = template.content.cloneNode(true);
        mainContent.innerHTML = '';
        mainContent.appendChild(clone);
        
        // Form submission
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const result = await loginUser(email, password);
                if (result.token) {
                    checkAuthStatus();
                    loadDashboard();
                    showAlert('Login successful!', 'success');
                } else {
                    showAlert(result.message || 'Login failed', 'error');
                }
            } catch (error) {
                showAlert('An error occurred during login', 'error');
                console.error('Login error:', error);
            }
        });
        
        // Switch to register link
        const switchToRegister = document.getElementById('switch-to-register');
        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                loadRegisterPage();
            });
        }
    }
    
    function loadRegisterPage() {
        const template = document.getElementById('register-template');
        const clone = template.content.cloneNode(true);
        mainContent.innerHTML = '';
        mainContent.appendChild(clone);
        
        // Form submission
        const registerForm = document.getElementById('register-form');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }
            
            try {
                const result = await registerUser(email, password);
                if (result.message) {
                    showAlert('Registration successful! Please login.', 'success');
                    loadLoginPage();
                } else {
                    showAlert(result.error || 'Registration failed', 'error');
                }
            } catch (error) {
                showAlert('An error occurred during registration', 'error');
                console.error('Registration error:', error);
            }
        });
        
        // Switch to login link
        const switchToLogin = document.getElementById('switch-to-login');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                loadLoginPage();
            });
        }
    }
    
    async function loadDashboard() {
        const token = getToken();
        if (!token) {
            showAlert('Please login to access dashboard', 'error');
            loadLoginPage();
            return;
        }
        
        const template = document.getElementById('dashboard-template');
        const clone = template.content.cloneNode(true);
        mainContent.innerHTML = '';
        mainContent.appendChild(clone);
        
        // Load dashboard data
        await loadDashboardData();
        
        // Set up dashboard event listeners
        setupDashboardListeners();
    }
    
    async function loadDashboardData() {
        try {
            // Load monitored items count
            const itemsResponse = await getMonitoredItems();
            if (itemsResponse && !itemsResponse.error) {
                document.getElementById('monitored-items-count').textContent = itemsResponse.length;
            }
            
            // Load breach events
            const breachesResponse = await getBreachEvents();
            if (breachesResponse && !breachesResponse.error) {
                document.getElementById('total-breaches-count').textContent = breachesResponse.length;
                
                const breachesList = document.getElementById('breaches-list');
                breachesList.innerHTML = '';
                
                if (breachesResponse.length === 0) {
                    breachesList.innerHTML = '<p class="empty-message">No breach events found.</p>';
                } else {
                    // Show last 5 breaches
                    const recentBreaches = breachesResponse.slice(0, 5);
                    recentBreaches.forEach(breach => {
                        const breachItem = document.createElement('div');
                        breachItem.className = 'breach-item';
                        breachItem.innerHTML = `
                            <div class="breach-info">
                                <h4>${breach.item_type.toUpperCase()} - ${breach.item_value}</h4>
                                <p>${breach.details}</p>
                            </div>
                            <div class="breach-date">${new Date(breach.detected_at).toLocaleDateString()}</div>
                        `;
                        breachesList.appendChild(breachItem);
                    });
                    
                    // Add "View All" link if there are more than 5 breaches
                    if (breachesResponse.length > 5) {
                        const viewAllLink = document.createElement('a');
                        viewAllLink.href = '#';
                        viewAllLink.textContent = 'View all breaches';
                        viewAllLink.style.display = 'block';
                        viewAllLink.style.textAlign = 'center';
                        viewAllLink.style.marginTop = '15px';
                        viewAllLink.addEventListener('click', (e) => {
                            e.preventDefault();
                            // In a full implementation, this would show all breaches
                            showAlert('Showing all breaches would be implemented here', 'info');
                        });
                        breachesList.appendChild(viewAllLink);
                    }
                }
            }
            
            // Set last checked time
            const items = await getMonitoredItems();
            if (items && !items.error && items.length > 0) {
                const lastChecked = items.reduce((latest, item) => {
                    if (!item.last_checked) return latest;
                    const itemDate = new Date(item.last_checked);
                    return itemDate > latest ? itemDate : latest;
                }, new Date(0));
                
                if (lastChecked.getTime() > 0) {
                    document.getElementById('last-checked').textContent = lastChecked.toLocaleString();
                }
            }
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showAlert('Failed to load dashboard data', 'error');
        }
    }
    
    function setupDashboardListeners() {
        // Check for breaches button
        const checkBreachesBtn = document.getElementById('check-breaches-btn');
        if (checkBreachesBtn) {
            checkBreachesBtn.addEventListener('click', async () => {
                try {
                    const result = await checkBreaches();
                    if (result.message) {
                        showAlert(result.message, 'success');
                        await loadDashboardData();
                    } else {
                        showAlert(result.error || 'Failed to check breaches', 'error');
                    }
                } catch (error) {
                    console.error('Error checking breaches:', error);
                    showAlert('An error occurred while checking breaches', 'error');
                }
            });
        }
        
        // Add monitored item button
        const addItemBtn = document.getElementById('add-item-btn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => {
                document.getElementById('add-item-modal').style.display = 'flex';
            });
        }
        
        // View breaches button
        const viewBreachesBtn = document.getElementById('view-breaches-btn');
        if (viewBreachesBtn) {
            viewBreachesBtn.addEventListener('click', () => {
                // In a full implementation, this would show all breaches
                showAlert('Showing all breaches would be implemented here', 'info');
            });
        }
        
        // Modal close button
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                document.getElementById('add-item-modal').style.display = 'none';
            });
        }
        
        // Add item form
        const addItemForm = document.getElementById('add-item-form');
        if (addItemForm) {
            addItemForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const type = document.getElementById('item-type').value;
                const value = document.getElementById('item-value').value;
                
                try {
                    const result = await addMonitoredItem(type, value);
                    if (result.message) {
                        showAlert('Item added successfully', 'success');
                        document.getElementById('add-item-modal').style.display = 'none';
                        addItemForm.reset();
                        await loadDashboardData();
                    } else {
                        showAlert(result.error || 'Failed to add item', 'error');
                    }
                } catch (error) {
                    console.error('Error adding monitored item:', error);
                    showAlert('An error occurred while adding item', 'error');
                }
            });
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('add-item-modal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // Helper function to show alerts
    function showAlert(message, type = 'info') {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Add some basic styling (would be better in CSS)
        alert.style.position = 'fixed';
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.padding = '15px 20px';
        alert.style.borderRadius = '5px';
        alert.style.color = 'white';
        alert.style.zIndex = '1000';
        alert.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
        
        switch (type) {
            case 'success':
                alert.style.backgroundColor = 'var(--success-color)';
                break;
            case 'error':
                alert.style.backgroundColor = 'var(--danger-color)';
                break;
            case 'warning':
                alert.style.backgroundColor = 'var(--warning-color)';
                break;
            default:
                alert.style.backgroundColor = 'var(--info-color)';
        }
        
        document.body.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
});