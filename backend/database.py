from flask_mysqldb import MySQL
import logging

# Initialize MySQL instance
mysql = MySQL()

# Setup logger
logger = logging.getLogger(__name__)

def init_mysql(app):
    try:
        app.config['MYSQL_HOST'] = 'localhost'
        app.config['MYSQL_USER'] = 'root'
        app.config['MYSQL_PASSWORD'] = 'newpassword'  # 🛠️ Replace with your real password
        app.config['MYSQL_DB'] = 'prescription_db'
        app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

        mysql.init_app(app)
        logger.info("MySQL initialized successfully.")

        return mysql
    except Exception as e:
        logger.error(f"Failed to initialize MySQL: {str(e)}")
        raise
