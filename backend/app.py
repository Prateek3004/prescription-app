from flask import Flask, jsonify
from flask_cors import CORS
from database import init_mysql, mysql
from routes.users import users_bp
from routes.prescription import prescriptions_bp
import logging
from routes.dashboard import dashboard_bp
# Initialize app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MySQL
init_mysql(app)

# Register Blueprints
app.register_blueprint(users_bp, url_prefix='/users')
app.register_blueprint(prescriptions_bp, url_prefix='/prescriptions')
app.register_blueprint(dashboard_bp)

# Root route for testing
@app.route('/')
def home():
    return jsonify({
        "message": "Backend is running!",
        "routes": {
            "Users": "/users",
            "Prescriptions": "/prescriptions"
        }
    })

# Custom Error Handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

# Run server
if __name__ == '__main__':
    logger.info("Starting Flask backend...")
    app.run(debug=True)
