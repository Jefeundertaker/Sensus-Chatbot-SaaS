from flask import Blueprint, jsonify, request, session
from src.models.user import ChatMessage, User, db
from src.routes.user import login_required
import openai
import os

chatbot_bp = Blueprint('chatbot', __name__)

# Base de conhecimento sobre Sensus e TOTVS Datasul
SENSUS_KNOWLEDGE = """
A Sensus é uma empresa especializada em tecnologia de automação que oferece soluções para diversos departamentos e setores das organizações. 

PRODUTOS E SERVIÇOS DA SENSUS:
- Sistema de Coleta de Dados: Controle na palma da mão, minimizando erros operacionais e integrado com máquinas e ERPs
- App Entrega EPI: Aplicativo para gestão de entrega de EPIs
- Checklist: Sistema para eliminar controles manuais e planilhas
- Manufatura: Sistemas para controle de produção descomplicados

SERVIÇOS:
- Consultoria: Implantação de Bloco K, obrigações fiscais, e-social, Produção, Estoque, Vendas, pedidos de compra. Especialização em ERP TOTVS linha Datasul
- Desenvolvimento: Programação em Progress, Dotnet e outras linguagens
- Suporte Especializado: Atendimento pessoal com foco em resolução de problemas em programas customizados e dúvidas para ERP TOTVS linha Datasul
- Integrações: Desenvolvimento de integrações de sistemas satélites com o ERP TOTVS linha Datasul (Mercos, Outplan, Preactor, Mercado Livre, Paradigma, entre outros)

CONTATO:
- Endereço: Rua Dona Francisca, 8.300 - Sala 310, Condomínio Perini Business Park - Ágora Uni no Ágora Tech Park, Zona Industrial Norte - CEP 89.219-600 – Joinville / SC
- Telefone: (47) 3029-2866
- E-mail: fale.com@sensustec.com.br

A Sensus tem expertise em consultoria e desenvolvimento ERP Totvs linhas Protheus e Datasul, produto para coleta de dados (winCE e Android), checklist, entre outros.
"""

DATASUL_KNOWLEDGE = """
TOTVS DATASUL é um ERP (Enterprise Resource Planning) robusto e completo, desenvolvido pela TOTVS especificamente para empresas de manufatura e indústrias.

PRINCIPAIS MÓDULOS DO DATASUL:
- Manufatura: Controle de produção, planejamento, sequenciamento
- Estoque: Gestão de materiais, movimentações, inventários
- Vendas: Gestão comercial, pedidos, faturamento
- Compras: Gestão de fornecedores, cotações, pedidos de compra
- Financeiro: Contas a pagar, contas a receber, fluxo de caixa
- Contabilidade: Escrituração fiscal, balancetes, demonstrativos
- Recursos Humanos: Folha de pagamento, benefícios, ponto eletrônico

CARACTERÍSTICAS TÉCNICAS:
- Linguagem de programação: Progress 4GL
- Banco de dados: Progress OpenEdge
- Arquitetura: Cliente/servidor e web
- Plataformas: Windows, Linux, Unix

OBRIGAÇÕES FISCAIS NO DATASUL:
- Bloco K: Controle de produção e estoque para o SPED Fiscal
- E-Social: Integração com eventos trabalhistas
- NFe: Emissão de notas fiscais eletrônicas
- SPED: Escrituração digital fiscal e contábil

INTEGRAÇÕES COMUNS:
- Sistemas de automação industrial
- Coletores de dados
- Sistemas de gestão de qualidade
- Plataformas de e-commerce
- Sistemas de BI (Business Intelligence)
"""

def get_chatbot_response(question, user_context="", user_id=None):
    """Gera resposta usando OpenAI com conhecimento da Sensus e TOTVS Datasul"""
    try:
        # Adicionar contexto do usuário para personalizar a resposta
        user_info = ""
        if user_id:
            user = User.query.get(user_id)
            if user:
                user_info = f"Usuário: {user.username} (ID: {user_id})"
        
        system_prompt = f"""
        Você é um assistente especializado em TOTVS Datasul e nos serviços da empresa Sensus RS.
        
        {user_info}
        
        CONHECIMENTO SOBRE A SENSUS:
        {SENSUS_KNOWLEDGE}
        
        CONHECIMENTO SOBRE TOTVS DATASUL:
        {DATASUL_KNOWLEDGE}
        
        INSTRUÇÕES:
        - Responda sempre em português brasileiro
        - Seja preciso e técnico quando necessário
        - Se a pergunta for sobre Sensus, use as informações fornecidas
        - Se a pergunta for sobre TOTVS Datasul, use seu conhecimento técnico
        - Se não souber algo específico, seja honesto e sugira contatar a Sensus
        - Mantenha um tom profissional e prestativo
        - Priorize informações práticas e aplicáveis
        - Cada conversa é individual e isolada por usuário
        """
        
        client = openai.OpenAI()
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        return f"Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente ou entre em contato com nosso suporte: (47) 3029-2866"

@chatbot_bp.route('/chat', methods=['POST'])
@login_required
def chat():
    """Processar pergunta do chatbot"""
    try:
        data = request.json
        question = data.get('question', '').strip()
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        user_id = session['user_id']
        user = User.query.get(user_id)
        
        # Verificar se o usuário tem saldo de mensagens
        if user.message_balance <= 0:
            return jsonify({
                'error': 'Insufficient message balance',
                'message': 'Você não possui saldo de mensagens. Adquira um pacote para continuar usando o chatbot.'
            }), 402
        
        # Gerar resposta do chatbot
        answer = get_chatbot_response(question, user_context="", user_id=user_id)
        
        # Salvar conversa no histórico
        chat_message = ChatMessage(
            user_id=user_id,
            question=question,
            answer=answer
        )
        
        # Decrementar saldo de mensagens
        user.message_balance -= 1
        
        db.session.add(chat_message)
        db.session.commit()
        
        return jsonify({
            'question': question,
            'answer': answer,
            'remaining_balance': user.message_balance
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chatbot_bp.route('/chat/history', methods=['GET'])
@login_required
def get_chat_history():
    """Obter histórico de conversas do usuário - ISOLADO POR USUÁRIO"""
    user_id = session['user_id']
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Garantir isolamento absoluto por usuário
    messages = ChatMessage.query.filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.created_at.desc())\
     .paginate(page=page, per_page=per_page, error_out=False)
    
    # Filtrar novamente no Python para garantia extra
    filtered_messages = []
    for msg in messages.items:
        if msg.user_id == user_id:
            msg_dict = msg.to_dict()
            msg_dict['isolated_user_id'] = user_id  # Adicionar confirmação de isolamento
            filtered_messages.append(msg_dict)
    
    return jsonify({
        'messages': filtered_messages,
        'total': len(filtered_messages),
        'pages': messages.pages,
        'current_page': page,
        'user_id': user_id,  # Confirmar o usuário
        'isolation_check': True
    })

@chatbot_bp.route('/admin/chat/history', methods=['GET'])
@login_required
def get_all_chat_history():
    """Admin pode ver todo o histórico de conversas"""
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    if user.user_type != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    messages = ChatMessage.query.order_by(ChatMessage.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'messages': [msg.to_dict() for msg in messages.items],
        'total': messages.total,
        'pages': messages.pages,
        'current_page': page
    })

@chatbot_bp.route('/chat/stats', methods=['GET'])
@login_required
def get_chat_stats():
    """Estatísticas de uso do chatbot para o usuário"""
    user_id = session['user_id']
    
    total_messages = ChatMessage.query.filter_by(user_id=user_id).count()
    user = User.query.get(user_id)
    
    return jsonify({
        'total_messages_sent': total_messages,
        'remaining_balance': user.message_balance,
        'user_since': user.created_at.isoformat() if user.created_at else None
    })

