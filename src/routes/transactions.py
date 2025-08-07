from flask import Blueprint, request, jsonify, session
from database import db, Transaction, User, MessagePackage
from src.routes.user import admin_required, login_required

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/transactions', methods=['GET'])
@login_required
def get_user_transactions():
    """Listar transações do usuário logado"""
    user_id = session['user_id']
    transactions = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.created_at.desc()).all()
    return jsonify([transaction.to_dict() for transaction in transactions])

@transactions_bp.route('/transactions', methods=['POST'])
@login_required
def create_transaction():
    """Criar nova transação (compra de pacote)"""
    try:
        data = request.json
        user_id = session['user_id']
        package_id = data['package_id']
        
        # Verificar se o pacote existe e está ativo
        package = MessagePackage.query.filter_by(id=package_id, is_active=True).first()
        if not package:
            return jsonify({'error': 'Package not found or inactive'}), 404
        
        # Criar transação
        transaction = Transaction(
            user_id=user_id,
            package_id=package_id,
            amount=package.price,
            status='pending'
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'transaction': transaction.to_dict(),
            'message': 'Transaction created successfully. Proceed with payment.'
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@transactions_bp.route('/transactions/<int:transaction_id>/complete', methods=['POST'])
@login_required
def complete_transaction(transaction_id):
    """Completar transação e adicionar mensagens ao saldo do usuário"""
    try:
        user_id = session['user_id']
        transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        if transaction.status != 'pending':
            return jsonify({'error': 'Transaction already processed'}), 400
        
        # Atualizar status da transação
        transaction.status = 'completed'
        
        # Adicionar mensagens ao saldo do usuário
        user = User.query.get(user_id)
        package = MessagePackage.query.get(transaction.package_id)
        user.message_balance += package.message_count
        
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction completed successfully',
            'messages_added': package.message_count,
            'new_balance': user.message_balance
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@transactions_bp.route('/transactions/<int:transaction_id>/cancel', methods=['POST'])
@login_required
def cancel_transaction(transaction_id):
    """Cancelar transação"""
    try:
        user_id = session['user_id']
        transaction = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
        
        if not transaction:
            return jsonify({'error': 'Transaction not found'}), 404
        
        if transaction.status != 'pending':
            return jsonify({'error': 'Transaction cannot be cancelled'}), 400
        
        transaction.status = 'failed'
        db.session.commit()
        
        return jsonify({'message': 'Transaction cancelled successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@transactions_bp.route('/admin/transactions', methods=['GET'])
@admin_required
def get_all_transactions():
    """Listar todas as transações (apenas admin)"""
    transactions = Transaction.query.order_by(Transaction.created_at.desc()).all()
    return jsonify([transaction.to_dict() for transaction in transactions])

@transactions_bp.route('/admin/transactions/<int:transaction_id>/complete', methods=['POST'])
@admin_required
def admin_complete_transaction(transaction_id):
    """Admin pode completar qualquer transação"""
    try:
        transaction = Transaction.query.get_or_404(transaction_id)
        
        if transaction.status != 'pending':
            return jsonify({'error': 'Transaction already processed'}), 400
        
        # Atualizar status da transação
        transaction.status = 'completed'
        
        # Adicionar mensagens ao saldo do usuário
        user = User.query.get(transaction.user_id)
        package = MessagePackage.query.get(transaction.package_id)
        user.message_balance += package.message_count
        
        db.session.commit()
        
        return jsonify({
            'message': 'Transaction completed successfully by admin',
            'messages_added': package.message_count,
            'user_new_balance': user.message_balance
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400

