# app.py - Main backend application
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import os
from datetime import datetime , timedelta
import jwt
from functools import wraps
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///breaches.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    monitored_items = db.relationship('MonitoredItem', backref='user', lazy=True)

class MonitoredItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item_type = db.Column(db.String(50), nullable=False)  # 'email', 'password', 'credit_card', etc.
    item_value = db.Column(db.String(256), nullable=False)
    last_checked = db.Column(db.DateTime)
    breach_count = db.Column(db.Integer, default=0)

class BreachEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('monitored_item.id'), nullable=False)
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    source = db.Column(db.String(120))
    details = db.Column(db.Text)

class BlacklistedToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), unique=True, nullable=False)
    blacklisted_on = db.Column(db.DateTime, default=datetime.utcnow)

# Helper Functions
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Check if token is blacklisted
            if BlacklistedToken.query.filter_by(token=token.split()[1]).first():
                return jsonify({'message': 'Token has been blacklisted!'}), 401
            
            data = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def check_haveibeenpwned(email):
    """Check email against Have I Been Pwned API"""
    try:
        response = requests.get(
            f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}",
            headers={'hibp-api-key': os.getenv('HIBP_API_KEY', 'your-hibp-key')},
            timeout=10
        )
        if response.status_code == 200:
            return response.json()  # Returns list of breaches
        return None
    except requests.exceptions.RequestException:
        return None

# API Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password required'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
    
    # hashed_password = generate_password_hash(data['password'], method='sha256')
    hashed_password = generate_password_hash(data['password'])
    new_user = User(email=data['email'], password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Email and password required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    
    token = jwt.encode(
        {'user_id': user.id, 'exp': datetime.utcnow() + timedelta(hours=24)},
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )
    
    return jsonify({'token': token}), 200

@app.route('/api/monitored-items', methods=['GET'])
@token_required
def get_monitored_items(current_user):
    items = MonitoredItem.query.filter_by(user_id=current_user.id).all()
    result = []
    for item in items:
        result.append({
            'id': item.id,
            'type': item.item_type,
            'value': item.item_value,
            'last_checked': item.last_checked.isoformat() if item.last_checked else None,
            'breach_count': item.breach_count
        })
    return jsonify(result), 200

@app.route('/api/monitored-items', methods=['POST'])
@token_required
def add_monitored_item(current_user):
    data = request.get_json()
    if not data or not data.get('type') or not data.get('value'):
        return jsonify({'message': 'Type and value required'}), 400
    
    # Basic validation based on type
    if data['type'] == 'email' and '@' not in data['value']:
        return jsonify({'message': 'Invalid email format'}), 400
    
    new_item = MonitoredItem(
        user_id=current_user.id,
        item_type=data['type'],
        item_value=data['value']
    )
    db.session.add(new_item)
    db.session.commit()
    
    # Immediately check for breaches
    if data['type'] == 'email':
        breaches = check_haveibeenpwned(data['value'])
        if breaches:
            for breach in breaches:
                new_breach = BreachEvent(
                    item_id=new_item.id,
                    source=breach['Name'],
                    details=f"Compromised in {breach['Title']} breach"
                )
                db.session.add(new_breach)
            new_item.breach_count = len(breaches)
            new_item.last_checked = datetime.utcnow()
            db.session.commit()
    
    return jsonify({'message': 'Item added and checked for breaches'}), 201

@app.route('/api/check-breaches', methods=['POST'])
@token_required
def check_breaches(current_user):
    items = MonitoredItem.query.filter_by(user_id=current_user.id).all()
    new_breaches = 0
    
    for item in items:
        if item.item_type == 'email':
            breaches = check_haveibeenpwned(item.item_value)
            if breaches:
                for breach in breaches:
                    # Check if we've already recorded this breach
                    existing = BreachEvent.query.filter_by(
                        item_id=item.id,
                        source=breach['Name']
                    ).first()
                    if not existing:
                        new_breach = BreachEvent(
                            item_id=item.id,
                            source=breach['Name'],
                            details=f"Compromised in {breach['Title']} breach"
                        )
                        db.session.add(new_breach)
                        new_breaches += 1
                
                item.breach_count = len(breaches)
                item.last_checked = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        'message': f'Checked all items. Found {new_breaches} new breaches.',
        'new_breaches': new_breaches
    }), 200

@app.route('/api/breach-events', methods=['GET'])
@token_required
def get_breach_events(current_user):
    items = MonitoredItem.query.filter_by(user_id=current_user.id).all()
    item_ids = [item.id for item in items]
    
    breaches = BreachEvent.query.filter(BreachEvent.item_id.in_(item_ids)).order_by(BreachEvent.detected_at.desc()).all()
    
    result = []
    for breach in breaches:
        item = MonitoredItem.query.get(breach.item_id)
        result.append({
            'id': breach.id,
            'item_type': item.item_type,
            'item_value': item.item_value,
            'detected_at': breach.detected_at.isoformat(),
            'source': breach.source,
            'details': breach.details
        })
    
    return jsonify(result), 200

@app.route('/api/logout', methods=['POST'])
@token_required
def logout(current_user):
    token = request.headers.get('Authorization').split()[1]
    
    # Add token to blacklist
    blacklisted_token = BlacklistedToken(token=token)
    db.session.add(blacklisted_token)
    db.session.commit()
    
    return jsonify({'message': 'Logged out successfully'}), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)