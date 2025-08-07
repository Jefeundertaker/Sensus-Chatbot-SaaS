from flask import Blueprint, request, jsonify, session
from database import db, User, ChatMessage, Transaction, MessagePackage
from src.routes.user import admin_required
from sqlalchemy import func, desc
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/dashboard', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Estatísticas gerais do sistema para o dashboard admin"""
    try:
        # Contadores básicos
        total_users = User.query.filter_by(user_type='client').count()
        total_messages = ChatMessage.query.count()
        total_revenue = db.session.query(func.sum(Transaction.amount)).filter_by(status='completed').scalar() or 0
        
        # Usuários ativos (que enviaram mensagens nos últimos 30 dias)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users = db.session.query(ChatMessage.user_id).filter(
            ChatMessage.created_at >= thirty_days_ago
        ).distinct().count()
        
        # Mensagens por dia nos últimos 7 dias
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        daily_messages = db.session.query(
            func.date(ChatMessage.created_at).label('date'),
            func.count(ChatMessage.id).label('count')
        ).filter(
            ChatMessage.created_at >= seven_days_ago
        ).group_by(func.date(ChatMessage.created_at)).all()
        
        # Top 5 usuários por mensagens
        top_users = db.session.query(
            User.username,
            User.email,
            func.count(ChatMessage.id).label('message_count')
        ).join(ChatMessage).group_by(User.id).order_by(desc('message_count')).limit(5).all()
        
        return jsonify({
            'total_users': total_users,
            'total_messages': total_messages,
            'total_revenue': float(total_revenue),
            'active_users': active_users,
            'daily_messages': [{'date': str(dm.date), 'count': dm.count} for dm in daily_messages],
            'top_users': [{'username': tu.username, 'email': tu.email, 'message_count': tu.message_count} for tu in top_users]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/users', methods=['GET'])
@admin_required
def get_all_users():
    """Listar todos os usuários com informações detalhadas"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search', '')
        
        query = User.query.filter_by(user_type='client')
        
        if search:
            query = query.filter(
                (User.username.contains(search)) | 
                (User.email.contains(search))
            )
        
        users = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Adicionar estatísticas para cada usuário
        users_data = []
        for user in users.items:
            message_count = ChatMessage.query.filter_by(user_id=user.id).count()
            total_spent = db.session.query(func.sum(Transaction.amount)).filter_by(
                user_id=user.id, status='completed'
            ).scalar() or 0
            last_activity = db.session.query(func.max(ChatMessage.created_at)).filter_by(
                user_id=user.id
            ).scalar()
            
            user_data = user.to_dict()
            user_data.update({
                'message_count': message_count,
                'total_spent': float(total_spent),
                'last_activity': last_activity.isoformat() if last_activity else None
            })
            users_data.append(user_data)
        
        return jsonify({
            'users': users_data,
            'total': users.total,
            'pages': users.pages,
            'current_page': page,
            'per_page': per_page
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/users/<int:user_id>/history', methods=['GET'])
@admin_required
def get_user_history(user_id):
    """Obter histórico detalhado de um usuário específico"""
    try:
        user = User.query.get_or_404(user_id)
        
        # Histórico de mensagens
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        messages = ChatMessage.query.filter_by(user_id=user_id).order_by(
            ChatMessage.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        # Histórico de transações
        transactions = Transaction.query.filter_by(user_id=user_id).order_by(
            Transaction.created_at.desc()
        ).all()
        
        # Estatísticas do usuário
        total_messages = ChatMessage.query.filter_by(user_id=user_id).count()
        total_spent = db.session.query(func.sum(Transaction.amount)).filter_by(
            user_id=user_id, status='completed'
        ).scalar() or 0
        
        # Atividade por mês nos últimos 6 meses
        six_months_ago = datetime.utcnow() - timedelta(days=180)
        monthly_activity = db.session.query(
            func.strftime('%Y-%m', ChatMessage.created_at).label('month'),
            func.count(ChatMessage.id).label('count')
        ).filter(
            ChatMessage.user_id == user_id,
            ChatMessage.created_at >= six_months_ago
        ).group_by('month').all()
        
        return jsonify({
            'user': user.to_dict(),
            'messages': {
                'items': [msg.to_dict() for msg in messages.items],
                'total': messages.total,
                'pages': messages.pages,
                'current_page': page
            },
            'transactions': [t.to_dict() for t in transactions],
            'stats': {
                'total_messages': total_messages,
                'total_spent': float(total_spent),
                'monthly_activity': [{'month': ma.month, 'count': ma.count} for ma in monthly_activity]
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/users/<int:user_id>/add-balance', methods=['POST'])
@admin_required
def add_user_balance(user_id):
    """Adicionar saldo de mensagens para um usuário"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.json
        messages_to_add = data.get('messages', 0)
        
        if messages_to_add <= 0:
            return jsonify({'error': 'Quantidade de mensagens deve ser maior que zero'}), 400
        
        user.message_balance += messages_to_add
        db.session.commit()
        
        return jsonify({
            'message': f'Adicionadas {messages_to_add} mensagens ao usuário {user.username}',
            'new_balance': user.message_balance
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/users/<int:user_id>/toggle-status', methods=['POST'])
@admin_required
def toggle_user_status(user_id):
    """Ativar/desativar usuário"""
    try:
        user = User.query.get_or_404(user_id)
        user.is_active = not user.is_active
        db.session.commit()
        
        status = 'ativado' if user.is_active else 'desativado'
        return jsonify({
            'message': f'Usuário {user.username} foi {status}',
            'is_active': user.is_active
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/messages/recent', methods=['GET'])
@admin_required
def get_recent_messages():
    """Obter mensagens recentes de todos os usuários"""
    try:
        limit = request.args.get('limit', 50, type=int)
        
        messages = db.session.query(ChatMessage).join(User).order_by(
            ChatMessage.created_at.desc()
        ).limit(limit).all()
        
        return jsonify([msg.to_dict() for msg in messages])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/export/users', methods=['GET'])
@admin_required
def export_users():
    """Exportar dados dos usuários (formato JSON)"""
    try:
        users = User.query.filter_by(user_type='client').all()
        users_data = []
        
        for user in users:
            message_count = ChatMessage.query.filter_by(user_id=user.id).count()
            total_spent = db.session.query(func.sum(Transaction.amount)).filter_by(
                user_id=user.id, status='completed'
            ).scalar() or 0
            
            user_data = user.to_dict()
            user_data.update({
                'message_count': message_count,
                'total_spent': float(total_spent)
            })
            users_data.append(user_data)
        
        return jsonify({
            'export_date': datetime.utcnow().isoformat(),
            'total_users': len(users_data),
            'users': users_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

