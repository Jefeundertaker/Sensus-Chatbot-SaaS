from flask import Blueprint, request, jsonify, session
from src.models.user import MessagePackage
from database import db
from src.routes.user import admin_required, login_required

packages_bp = Blueprint('packages', __name__)

@packages_bp.route('/packages', methods=['GET'])
def get_packages():
    """Listar todos os pacotes ativos"""
    packages = MessagePackage.query.filter_by(is_active=True).all()
    return jsonify([package.to_dict() for package in packages])

@packages_bp.route('/packages', methods=['POST'])
@admin_required
def create_package():
    """Criar novo pacote de mensagens (apenas admin)"""
    try:
        data = request.json
        package = MessagePackage(
            name=data['name'],
            message_count=data['message_count'],
            price=data['price']
        )
        db.session.add(package)
        db.session.commit()
        return jsonify(package.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@packages_bp.route('/packages/<int:package_id>', methods=['GET'])
def get_package(package_id):
    """Obter detalhes de um pacote específico"""
    package = MessagePackage.query.get_or_404(package_id)
    return jsonify(package.to_dict())

@packages_bp.route('/packages/<int:package_id>', methods=['PUT'])
@admin_required
def update_package(package_id):
    """Atualizar pacote (apenas admin)"""
    try:
        package = MessagePackage.query.get_or_404(package_id)
        data = request.json
        
        package.name = data.get('name', package.name)
        package.message_count = data.get('message_count', package.message_count)
        package.price = data.get('price', package.price)
        package.is_active = data.get('is_active', package.is_active)
        
        db.session.commit()
        return jsonify(package.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@packages_bp.route('/packages/<int:package_id>', methods=['DELETE'])
@admin_required
def delete_package(package_id):
    """Desativar pacote (apenas admin)"""
    package = MessagePackage.query.get_or_404(package_id)
    package.is_active = False
    db.session.commit()
    return jsonify({'message': 'Package deactivated successfully'})

@packages_bp.route('/admin/packages', methods=['GET'])
@admin_required
def get_all_packages():
    """Listar todos os pacotes (incluindo inativos) - apenas admin"""
    packages = MessagePackage.query.all()
    return jsonify([package.to_dict() for package in packages])

