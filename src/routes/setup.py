from flask import Blueprint, jsonify
from database import db, User, MessagePackage

setup_bp = Blueprint('setup', __name__)

@setup_bp.route('/api/setup/admin', methods=['POST'])
def create_admin():
    """Forçar criação do usuário admin"""
    try:
        # Verificar se admin já existe
        admin = User.query.filter_by(username='admin').first()
        if admin:
            return jsonify({
                'status': 'exists',
                'message': 'Usuário admin já existe',
                'admin_id': admin.id,
                'email': admin.email,
                'message_balance': admin.message_balance
            })
        
        # Criar usuário admin
        admin = User(
            username='admin',
            email='admin@sensustec.com.br',
            user_type='admin',
            message_balance=1000
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        
        return jsonify({
            'status': 'created',
            'message': 'Usuário admin criado com sucesso',
            'credentials': {
                'username': 'admin',
                'password': 'admin123'
            },
            'admin_id': admin.id
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erro ao criar admin: {str(e)}'
        }), 500

@setup_bp.route('/api/setup/check', methods=['GET'])
def check_setup():
    """Verificar status do setup do sistema"""
    try:
        # Verificar usuários
        total_users = User.query.count()
        admin_exists = User.query.filter_by(username='admin').first() is not None
        
        # Verificar pacotes
        total_packages = MessagePackage.query.count()
        
        # Listar todos os usuários para debug
        users = User.query.all()
        user_list = []
        for user in users:
            user_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'user_type': user.user_type,
                'message_balance': user.message_balance
            })
        
        return jsonify({
            'status': 'success',
            'database_status': 'connected',
            'total_users': total_users,
            'admin_exists': admin_exists,
            'total_packages': total_packages,
            'users': user_list
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erro ao verificar setup: {str(e)}'
        }), 500

@setup_bp.route('/api/setup/reset-admin', methods=['POST'])
def reset_admin():
    """Resetar senha do admin"""
    try:
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            return jsonify({
                'status': 'error',
                'message': 'Usuário admin não encontrado'
            }), 404
        
        # Resetar senha
        admin.set_password('admin123')
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Senha do admin resetada para admin123',
            'credentials': {
                'username': 'admin',
                'password': 'admin123'
            }
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erro ao resetar admin: {str(e)}'
        }), 500

