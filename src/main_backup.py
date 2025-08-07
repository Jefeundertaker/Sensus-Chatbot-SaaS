import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db, User, MessagePackage
from src.routesfrom routes.user import user_bp
from routes.packages import packages_bp
from routes.transactions import transactions_bp
from routes.chatbot import chatbot_bp
from routes.admin import admin_bp
from routes.auth import auth_bp
from routes.health import health_bpt auth_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'sensus-chatbot-system-2025-secret-key'

# Habilitar CORS para permitir requisições do frontend
CORS(app, supports_credentials=True)

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(packages_bp, url_prefix='/api')
app.register_blueprint(transactions_bp, url_prefix='/api')
app.register_blueprint(chatbot_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def init_database():
    """Inicializar banco de dados com dados padrão"""
    with app.app_context():
        db.create_all()
        
        # Criar usuário admin padrão se não existir
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@sensustec.com.br',
                user_type='admin',
                message_balance=1000
            )
            admin.set_password('admin123')
            db.session.add(admin)
        
        # Criar pacotes padrão se não existirem
        if MessagePackage.query.count() == 0:
            packages = [
                MessagePackage(name='Pacote Básico', message_count=500, price=49.90),
                MessagePackage(name='Pacote Intermediário', message_count=1000, price=90.00),
                MessagePackage(name='Pacote Avançado', message_count=2000, price=160.00),
                MessagePackage(name='Pacote Premium', message_count=5000, price=350.00)
            ]
            
            for package in packages:
                db.session.add(package)
        
        db.session.commit()
        print("Database initialized successfully!")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "Frontend not found. Please build and place the React app in the static folder.", 404

if __name__ == '__main__':
    init_database()
    app.run(host='0.0.0.0', port=5000, debug=True)
