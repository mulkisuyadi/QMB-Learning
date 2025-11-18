from app import app, db, User, UserProgress  # import models and db from your app
from tabulate import tabulate  # for pretty output

with app.app_context():
    users = User.query.all()
    """
    data = [(u.id, u.username, u.email, u.longname, u.idcard, u.confirmed, u.confirmed_on, u.password) for u in users]
    print(tabulate(data, headers=["ID", "Username", "Email", "Long Name", "ID Card", "Confirmed", "Confirmed_on", "Password" ]))
    """
    data = [(u.id, u.username, u.email, u.longname, u.idcard, u.password) for u in users]
    print(tabulate(data, headers=["ID", "Username", "Email", "Long Name", "ID Card", "Password" ]))

with app.app_context():
    progress = UserProgress.query.all()
    data = [(p.id, p.user_id, p.test_name, p.score, p.date_taken) for p in progress]
    print(tabulate(data, headers=["ID", "User ID", "Test Name", "Score", "Date Taken"]))

