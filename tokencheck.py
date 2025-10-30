from app import db, User
user = User.query.filter_by(username="mulkisuyadi").first()
print(user.remember_token)

