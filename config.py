import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-12345')
    SQLALCHEMY_DATABASE_URI = 'sqlite:///qr_vault.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False