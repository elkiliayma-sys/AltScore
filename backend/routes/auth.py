from flask import Blueprint, request, jsonify, session
from database.mongo_handler import MongoManager
from datetime import datetime
import bcrypt

auth_bp    = Blueprint('auth', __name__)
db_manager = MongoManager()


@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data     = request.json
    user_id  = data.get('user_id', '').strip()
    password = data.get('password', '').strip()
    role     = data.get('role', '')

    if not user_id or not password or role not in ['borrower', 'lender']:
        return jsonify({"error": "user_id, password et role obligatoires"}), 400

    if db_manager.get_user(user_id):
        return jsonify({"error": f"'{user_id}' existe deja."}), 409

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    doc = {
        "user_id":       user_id,
        "password_hash": password_hash,
        "role":          role,
        "created_at":    datetime.now()
    }
    db_manager.save_user(doc)
    session['user_id'] = user_id
    session['role']    = role

    return jsonify({"status": "registered", "user_id": user_id, "role": role})


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data     = request.json
    user_id  = data.get('user_id', '').strip()
    password = data.get('password', '').strip()
    role     = data.get('role', '')

    if not user_id or not password:
        return jsonify({"error": "user_id et password obligatoires"}), 400

    user = db_manager.get_user(user_id)
    if not user:
        return jsonify({"error": "Utilisateur introuvable"}), 404

    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
        return jsonify({"error": "Mot de passe incorrect"}), 401

    if user['role'] != role:
        return jsonify({"error": f"Ce compte n'est pas un compte {role}"}), 403

    session['user_id'] = user_id
    session['role']    = role

    return jsonify({"status": "logged_in", "user_id": user_id, "role": role})


@auth_bp.route('/auth/me', methods=['GET'])
def me():
    if 'user_id' not in session:
        return jsonify({"logged_in": False}), 401
    return jsonify({
        "logged_in": True,
        "user_id":   session['user_id'],
        "role":      session['role']
    })


@auth_bp.route('/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "logged_out"})