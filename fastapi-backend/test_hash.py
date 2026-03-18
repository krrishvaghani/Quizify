from models.user_model import UserModel

try:
    hash_val = UserModel.get_password_hash("password")
    print("Hash:", hash_val)
except Exception as e:
    print("Error:", e)
