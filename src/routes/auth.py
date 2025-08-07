from flask import Blueprint, request, jsonify, session
from src.models.user import User
from database import db
from src.routes.user import login_required
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os

auth_bp = Blueprint('auth', __name__)

# Armazenar tokens de recuperação temporariamente (em produção, usar Redis ou banco)
password_reset_tokens = {}

@auth_bp.route('/auth/google', methods=['POST'])
def google_auth():
    """Autenticação com Google OAuth"""
    try:
        data = request.json
        google_token = data.get('google_token')
        
        # Em uma implementação real, você validaria o token com a API do Google
        # Por simplicidade, vamos simular a validação
        if not google_token:
            return jsonify({'error': 'Token do Google é obrigatório'}), 400
        
        # Simular dados do usuário do Google (em produção, obter da API do Google)
        google_user_data = {
            'email': data.get('email'),
            'name': data.get('name'),
            'google_id': data.get('google_id')
        }
        
        if not google_user_data['email']:
            return jsonify({'error': 'Email é obrigatório'}), 400
        
        # Verificar se usuário já existe
        user = User.query.filter_by(email=google_user_data['email']).first()
        
        if not user:
            # Criar novo usuário
            username = google_user_data['email'].split('@')[0]
            # Garantir que o username seja único
            base_username = username
            counter = 1
            while User.query.filter_by(username=username).first():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User(
                username=username,
                email=google_user_data['email'],
                user_type='client',
                message_balance=10  # Dar 10 mensagens grátis para novos usuários
            )
            # Definir uma senha aleatória (usuário não precisará dela)
            user.set_password(secrets.token_urlsafe(32))
            
            db.session.add(user)
            db.session.commit()
        
        # Fazer login
        session['user_id'] = user.id
        
        return jsonify({
            'message': 'Login com Google realizado com sucesso',
            'user': user.to_dict(),
            'is_new_user': user.created_at > datetime.utcnow() - timedelta(minutes=1)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Solicitar recuperação de senha"""
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email é obrigatório'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Por segurança, não revelar se o email existe ou não
            return jsonify({'message': 'Se o email existir, você receberá instruções para redefinir sua senha'}), 200
        
        # Gerar token de recuperação
        reset_token = secrets.token_urlsafe(32)
        password_reset_tokens[reset_token] = {
            'user_id': user.id,
            'expires_at': datetime.utcnow() + timedelta(hours=1)
        }
        
        # Em produção, enviar email real
        # Por enquanto, vamos simular o envio
        reset_link = f"https://5000-i77deijoxww6ml9zjt1p2-565aa505.manus.computer/reset-password?token={reset_token}"
        
        # Simular envio de email (em produção, usar SMTP real)
        print(f"Email de recuperação enviado para {email}")
        print(f"Link de recuperação: {reset_link}")
        
        return jsonify({
            'message': 'Se o email existir, você receberá instruções para redefinir sua senha',
            'reset_link': reset_link  # Apenas para demonstração
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/reset-password', methods=['POST'])
def reset_password():
    """Redefinir senha com token"""
    try:
        data = request.json
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token e nova senha são obrigatórios'}), 400
        
        # Verificar token
        token_data = password_reset_tokens.get(token)
        if not token_data:
            return jsonify({'error': 'Token inválido ou expirado'}), 400
        
        if datetime.utcnow() > token_data['expires_at']:
            del password_reset_tokens[token]
            return jsonify({'error': 'Token expirado'}), 400
        
        # Atualizar senha
        user = User.query.get(token_data['user_id'])
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        user.set_password(new_password)
        db.session.commit()
        
        # Remover token usado
        del password_reset_tokens[token]
        
        return jsonify({'message': 'Senha redefinida com sucesso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/validate-reset-token', methods=['POST'])
def validate_reset_token():
    """Validar token de recuperação"""
    try:
        data = request.json
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Token é obrigatório'}), 400
        
        token_data = password_reset_tokens.get(token)
        if not token_data:
            return jsonify({'valid': False, 'error': 'Token inválido'}), 200
        
        if datetime.utcnow() > token_data['expires_at']:
            del password_reset_tokens[token]
            return jsonify({'valid': False, 'error': 'Token expirado'}), 200
        
        user = User.query.get(token_data['user_id'])
        if not user:
            return jsonify({'valid': False, 'error': 'Usuário não encontrado'}), 200
        
        return jsonify({
            'valid': True,
            'user_email': user.email
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/auth/change-password', methods=['POST'])
@login_required
def change_password():
    """Alterar senha do usuário logado"""
    try:
        data = request.json
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        user = User.query.get(session['user_id'])
        
        if not user.check_password(current_password):
            return jsonify({'error': 'Senha atual incorreta'}), 400
        
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Senha alterada com sucesso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def send_email(to_email, subject, body):
    """Função auxiliar para envio de emails (implementação básica)"""
    try:
        # Configurações do email (em produção, usar variáveis de ambiente)
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = "noreply@sensustec.com.br"
        sender_password = "sua_senha_aqui"  # Em produção, usar variáveis de ambiente
        
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, to_email, text)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False

