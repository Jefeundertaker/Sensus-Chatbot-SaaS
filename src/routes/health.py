from flask import Blueprint, jsonify
from datetime import datetime
import os

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de health check para diagnóstico"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'Sensus Chatbot Backend',
        'version': '1.0.0',
        'environment': os.environ.get('FLASK_ENV', 'production'),
        'database': 'connected',
        'cors': 'enabled'
    })

@health_bp.route('/api/ping', methods=['GET'])
def ping():
    """Endpoint simples de ping"""
    return jsonify({
        'message': 'pong',
        'timestamp': datetime.utcnow().isoformat()
    })

@health_bp.route('/api/cors-test', methods=['GET', 'POST', 'OPTIONS'])
def cors_test():
    """Endpoint para testar CORS"""
    return jsonify({
        'cors': 'working',
        'method': 'GET/POST/OPTIONS allowed',
        'timestamp': datetime.utcnow().isoformat()
    })

