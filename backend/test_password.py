import bcrypt

# Replace with your new password
new_password = "admin123"

# Generate bcrypt hash
hashed_password = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt())

# Print the hashed password
print("New bcrypt hash:", hashed_password.decode())  # Store this in MySQL


