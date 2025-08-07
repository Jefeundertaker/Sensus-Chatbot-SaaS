from flask import Blueprint, request, jsonify, session
from database import db, User
from functools import wraps

user_bp = Blueprint('user', __name__)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Login required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Login required'}), 401
        user = User.query.get(session['user_id'])
        if not user or user.user_type != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@user_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        
        # Verificar se usuário já existe
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        user = User(
            username=data['username'], 
            email=data['email'],
            user_type=data.get('user_type', 'client')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify(user.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        user = User.query.filter_by(username=data['username']).first()
        
        if user and user.check_password(data['password']) and user.is_active:
            session['user_id'] = user.id
            return jsonify({
                'message': 'Login successful',
                'user': user.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@user_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Logout successful'}), 200

@user_bp.route('/profile', methods=['GET'])
@login_required
def get_profile():
    user = User.query.get(session['user_id'])
    return jsonify(user.to_dict())

@user_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    try:
        data = request.json
        
        # Verificar se usuário já existe
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        user = User(
            username=data['username'], 
            email=data['email'],
            user_type=data.get('user_type', 'client'),
            message_balance=data.get('message_balance', 0)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.json
        
        user.username = data.get('username', user.username)
        user.email = data.get('email', user.email)
        user.user_type = data.get('user_type', user.user_type)
        user.message_balance = data.get('message_balance', user.message_balance)
        user.is_active = data.get('is_active', user.is_active)
        
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204

@user_bp.route('/users/<int:user_id>/add-messages', methods=['POST'])
@admin_required
def add_messages_to_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.json
        messages_to_add = data.get('messages', 0)
        
        user.message_balance += messages_to_add
        db.session.commit()
        
        return jsonify({
            'message': f'Added {messages_to_add} messages to user {user.username}',
            'new_balance': user.message_balance
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400
