
from app import app, db, UserProgress, User, session

# === DELETE TEST DATA === #
'''
with app.app_context():
    UserProgress.query.filter(UserProgress.user_id == 1, UserProgress.test_name == "English Quiz 2").delete()
    
    user = User.query.get(2)
    print(user.username, user.longname)
    db.session.commit()
    print("Data deleted.")
'''
# === DELETE TEST DATA === #


# === DELETE USERNAME === #
with app.app_context():
    #user = User.query.get(2)  # or filter_by(username='adi123').first()
    user = User.query.get(12) # or filter_by(username='adi123').first()
    if user:
        db.session.delete(user)
        db.session.commit()
        print(f"Deleted user: {user.username}")
        print(f"Deleted user: {user.email}")
    else:
        print("User not found.")

# === DELETE USERNAME === #

