from flask import Blueprint, request, jsonify, render_template
from models import db, QRRecord, User

api_bp = Blueprint('api', __name__)

def get_or_create_user(unique_id):
    """Helper to retrieve a user or create a new one based on client UUID."""
    user = User.query.filter_by(unique_id=unique_id).first()
    if not user:
        user = User(unique_id=unique_id)
        db.session.add(user)
        db.session.commit()
    return user

@api_bp.route('/save', methods=['POST'])
def save_qr():
    data = request.get_json()
    content = data.get('content', '').strip()
    user_uuid = data.get('user_id')

    if not content or not user_uuid:
        return jsonify({"error": "Missing content or user identification"}), 400

    try:
        user = get_or_create_user(user_uuid)
        new_record = QRRecord(content=content, user_id=user.id)
        db.session.add(new_record)
        db.session.commit()
        return jsonify(new_record.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@api_bp.route('/history', methods=['GET'])
def get_history():
    user_uuid = request.args.get('user_id')
    if not user_uuid:
        return jsonify([])

    user = User.query.filter_by(unique_id=user_uuid).first()
    if not user:
        return jsonify([])

    records = QRRecord.query.filter_by(user_id=user.id).order_by(QRRecord.created_at.desc()).all()
    return jsonify([r.to_dict() for r in records])

@api_bp.route('/history/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    user_uuid = request.args.get('user_id')
    user = User.query.filter_by(unique_id=user_uuid).first()
    
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    record = QRRecord.query.filter_by(id=record_id, user_id=user.id).first_or_404()
    try:
        db.session.delete(record)
        db.session.commit()
        return jsonify({"message": "Deleted"}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to delete"}), 500