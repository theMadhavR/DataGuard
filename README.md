# DataGuard - Digital Footprint Monitor

## Project Overview
DataGuard is a web application designed to help users monitor their digital footprint and stay informed about potential data breaches. The application allows users to register, log in, and monitor personal information (such as email addresses, passwords, etc.). It simulates real-time checks for data breaches and provides instant alerts and a detailed dashboard.

## Features
- **User Authentication:** Secure user registration and login functionality.
- **Proactive Monitoring:** Users can add personal items (email, password, etc.) to a watchlist.
- **Instant Alerts:** Get notified when a monitored item is found in a simulated data breach.
- **Security Dashboard:** A clean dashboard to view the number of monitored items, total breaches, and recent breach events.
- **Responsive UI:** A modern, clean, and responsive design powered by CSS, with smooth animations and transitions.
- **Dynamic Content:** The frontend uses JavaScript and HTML templates to dynamically load different views (Home, Dashboard, Login, Register) without full page reloads.

## Technologies Used

### Frontend
- **HTML5:** For the page structure and templates.
- **CSS3:** For modern styling, animations, and a responsive layout.
- **JavaScript (ES6+):** For all client-side logic, API calls, and dynamic content rendering.
- **Font Awesome:** For icons.

### Backend (Simulated)
- **Python:** The core language for the backend logic.
- **Flask:** A lightweight web framework for handling API routes.
- **SQLAlchemy:** An ORM for database interactions.
- **Werkzeug:** Used for password hashing and security.
- **PyJWT:** For handling JSON Web Tokens (JWT) for authentication.
- **Flask-CORS:** To handle cross-origin resource sharing.

## Getting Started

### 1. Backend Setup (Simulated API)
The project includes a Python backend that simulates API endpoints for authentication and data management.

1.  **Clone the repository** and navigate to the project directory.
2.  **Set up a Python virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3.  **Install the dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Create a `.env` file** in the root directory and add your secret key and database URL.
    ```env
    SECRET_KEY='your-secret-key-here'
    DATABASE_URL='sqlite:///breaches.db'
    ```
5.  **Run the Flask application:**
    ```bash
    python main.py
    ```
    The backend will run on `http://localhost:5000`.

### 2. Frontend Setup
The frontend is a static single-page application.

1.  **Open the `index.html` file** directly in your web browser.
2.  All frontend API calls are handled by the JavaScript files (`app.js` and `auth.js`) and will interact with the local Flask server you started in the previous step.

## Project Structure
.  
├── main.py             # Flask backend with API endpoints  
├── requirements.txt    # Python dependencies  
├── index.html          # Main application page with templates  
├── styles.css          # All CSS for styling and animations  
├── app.js              # Core frontend logic, event handlers, and view management  
└── auth.js             # Authentication and API functions (simulated)  

## How to Use
1.  Open `index.html` in your browser.
2.  Click "Register" to create a new account, or "Login" if you already have one.
3.  After logging in, you will be redirected to the dashboard.
4.  Use the "Add Monitored Item" button to add a new item (e.g., an email address).
5.  Click "Check for New Breaches" to simulate a data breach scan and update the dashboard.
