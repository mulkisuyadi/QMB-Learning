from flask import Flask, render_template, request, redirect, session, url_for, make_response, g, flash, jsonify

from werkzeug.security import generate_password_hash, check_password_hash

import secrets

from datetime import timedelta, datetime

from dotenv import load_dotenv

import os

load_dotenv()

from flask_wtf.csrf import CSRFProtect

from flask_limiter import Limiter

from flask_limiter.util import get_remote_address

from flask_sqlalchemy import SQLAlchemy

from flask_migrate import Migrate

from flask.cli import with_appcontext

import click

from sqlalchemy import create_engine, Column, Integer, String

from sqlalchemy.orm import declarative_base, sessionmaker

from sqlalchemy.exc import IntegrityError

import time

from flask_mail import Mail, Message

from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

from flask import make_response



app = Flask(__name__)

# ✅ Get DB URL from Railway or fallback to SQLite locally
db_url = os.getenv("DATABASE_URL")

# ✅ Railway gives postgres:// but SQLAlchemy needs postgresql://
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if os.getenv("RAILWAY_ENVIRONMENT"):
    app.config["SERVER_NAME"] = "qmblearning.up.railway.app"
    app.config["PREFERRED_URL_SCHEME"] = "https"


app.config.update(
    SECRET_KEY=os.getenv("SECRET_KEY") or "dev-secret-key",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,  # ⚠️ set True after https
    SESSION_COOKIE_SAMESITE="Lax",
    
    # ✅ Database settings
    SQLALCHEMY_DATABASE_URI=db_url or "sqlite:///users.db",
    SQLALCHEMY_TRACK_MODIFICATIONS=False,

    # Email
    MAIL_SERVER="smtp.gmail.com",
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME="nerdboy166@gmail.com",
    MAIL_PASSWORD="hfvl xtdm tqhp szyq",
    MAIL_DEFAULT_SENDER=("QMB Mandarin Learning", "nerdboy166@gmail.com")
)


print("SECRET KEY:", app.config["SECRET_KEY"])
print("Database_URL:", app.config["SQLALCHEMY_DATABASE_URI"])


mail = Mail(app)

serializer = URLSafeTimedSerializer(app.secret_key)
serializer = URLSafeTimedSerializer(app.config["SECRET_KEY"])

@click.command(name="create_tables")
@with_appcontext
def create_tables():
    db.create_all()
app.cli.add_command(create_tables)



db = SQLAlchemy(app)
migrate = Migrate(app, db)
#print(SQLAlchemy)
#print(Migrate)

class User(db.Model):
    __tablename__ = "users"   # 👈 add this
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    longname = db.Column(db.String(120), nullable=False)  # 👈 UNIQUE removed
    idcard = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    remember_token = db.Column(db.String(200))
    confirmed = db.Column(db.Boolean, default=False, nullable=False)
    confirmed_on = db.Column(db.DateTime, nullable=True)
    progress = db.relationship("UserProgress", back_populates="user", cascade="all, delete")
    
class UserProgress(db.Model):
    __tablename__ = "users_progress"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable = False)
    test_name = db.Column(db.String(120), nullable = False)
    score = db.Column(db.Integer, nullable = False)
    date_taken = db.Column(db.DateTime, server_default = db.func.now())
    #Optional: Relationship back to user
    user = db.relationship("User", back_populates="progress")

csrf = CSRFProtect(app)

TOKEN_LIFETIME = timedelta(days=7)

def nocache(view):
    def no_cache(*args, **kwargs):
        response = make_response(view(*args, **kwargs))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    no_cache.__name__ = view.__name__
    return no_cache

def user_or_ip():
    # If logged in -> use username
    if "username" in session:
        return session["username"]
    #Otherwise fallback to IP
    return get_remote_address()

limiter = Limiter (
    key_func = user_or_ip,
    app = app
)

#def generate_token(email:str, salt: str):
    #return serializer.dumps(email, salt=salt)

#def confirm_token(token: str, salt: str, expiration: int=3600):
    #return email if valid, raises exception if invalid/expired
    #return serializer.loads(token, salt=salt, max_age=expiration)

def generate_confirmation_token(email):
    serializer = URLSafeTimedSerializer(app.secret_key)
    return serializer.dumps(email, salt="email-confirm-salt")

def confirm_token(token: str, expiration=3600):  # 1 hour = 3600 seconds
    serializer = URLSafeTimedSerializer(app.secret_key)
    try:
        email = serializer.loads(token, salt="email-confirm-salt", max_age=expiration)
    except SignatureExpired:
        return None  # Token expired
    except BadSignature:
        return None  # Invalid token
    return email

def send_email(subject: str, recipients: list, html_body: str=None, text_body: str=None):
    msg = Message(subject, recipients=recipients)
    if text_body:
        msg.body = text_body
    if html_body:
        msg.html=html_body
    mail.send(msg)


#--------------------------------------------
#ROUTES
#--------------------------------------------


@app.errorhandler(429)
def ratelimit_handler(e):
    if request.is_json:
        return jsonify(error="Too many requests. Try again later."), 429
    flash("Too many login attempts! Please wait a minute before trying again.", "danger")
    return render_template("login.html"), 429


#====================================================================================
# === Temporary variable per request === #
@app.before_request
def before_request():
    g.login_failed = False
#====================================================================================
# === Temporary variable per request === #


#====================================================================================
# === AUTOMATIC REDIRECT TO LOGIN PAGE === #
@app.route("/")
def home():
    return redirect(url_for("login"))
#====================================================================================
# === AUTOMATIC REDIRECT TO LOGIN PAGE === #


def get_user_by_username(username):
    return User.query.filter_by(username=username).first() #Don't forget to write return!

print("LINE 1-190 IF FINE")
#====================================================================================
# === LOGIN PAGE === #
# Limit login attempts: 5 per minute per IP
@app.route("/login", methods=["GET", "POST"])
@limiter.limit("5 per minute", key_func=get_remote_address, deduct_when=lambda r: getattr(g, "login_failed", False))
def login():
    
    #If user is locked, check timeout
    lock_time = session.get("lock_time")
    if lock_time:
        if time.time() - lock_time < 60: #Still locked within 60 sec
            flash("Too many attempts! Please wait 1 minute.", "danger")
            return render_template("login.html", lock_time=lock_time, current_time=time.time())
        else:
            #Unlock after 60 seconds
            session.pop("lock_time", None)
            session["login_attempts"] = 0

    print("LINE 190-209 IF FINE")

    g.login_failed = False  # default

    token = request.cookies.get("remember_token")
    if token:
        # Find the user who has this token
        user = User.query.filter_by(remember_token=token).first()
        #print("Found user:", user)
        if user:
            # Put username into session and redirect back to /index (now logged in)
            session["user_id"] = user.id
            #print("Logged in via remember token.")
            return redirect(url_for("index"))

        # Optional: token exists but no user — remove the stale cookie so it won't reappear
        resp = make_response(redirect(url_for("login")))
        resp.set_cookie("remember_token", "", expires=0)
        return resp

    if request.method == "POST":
        login_input = request.form["usernameemail"]
        password = request.form["password"]
        remember = request.form.get("remember")  # checkbox value ("on" if checked)
        
        if "@" in login_input and "." in login_input:
            user = User.query.filter_by(email=login_input).first()
        else:
            user = User.query.filter_by(username=login_input).first()


        if user and check_password_hash(user.password, password):
            
            # 🚧 Add this BEFORE setting session
            if not user.confirmed:
                # ✅ Auto-resend confirmation email
                token = generate_confirmation_token(user.email)
                confirm_url = url_for('confirm_email', token=token, _external=True)

                # You can use your existing send_email() helper here
                send_email(
                    subject="Please confirm your email",
                    recipients=[user.email],
                    text_body=f"Hello {user.username}, please confirm your email by clicking this link: {confirm_url}",
                    html_body=render_template("confirm.html", confirm_url=confirm_url, username=user.username)
                )

                flash("Your email is not confirmed. We've sent a new confirmation link to your inbox.", "warning")
                return render_template("login.html")
            
            # ✅ Successful login
            session["user_id"] = user.id
            test123 = session["user_id"]
            print(test123)
            print("190-263 IS FINE")
            session.pop("login_attempts", None)
            session.pop("lock_time", None)
            
            resp = make_response(redirect(url_for("index")))

            if remember:
                token = secrets.token_hex(16)
                resp.set_cookie("remember_token", token, max_age=TOKEN_LIFETIME.total_seconds())
                user.remember_token = token
                db.session.commit()
            return resp
        

        

        # 🚨 Failed login
        g.login_failed = True
        attempts = session.get("login_attempts", 0) + 1
        session["login_attempts"] = attempts

        if attempts >= 5:
            session["lock_time"] = time.time()
            flash("Too many failed attempts! Locked for 1 minute.", "danger")
            
        else:
            flash(f"Invalid login attempt #{attempts}", "warning")
        return render_template("login.html", lock_time=session.get("lock_time"), current_time=time.time())
    
    # Default GET (first visit)
    return render_template("login.html", lock_time=session.get("lock_time"), current_time=time.time())
#====================================================================================
# === LOGIN PAGE === #


#====================================================================================
# === RESEND CONFIRMATION === #
@app.route("/resend-confirmation", methods=["GET", "POST"])
def resend_confirmation():
    if request.method == "POST":
        email = request.form["email"]
        user = User.query.filter_by(email=email).first()

        if not user:
            flash("No account found with that email.", "danger")
            return redirect(url_for("resend_confirmation"))

        if user.confirmed:
            flash("Account already confirmed. Please log in.", "info")
            return redirect(url_for("login"))

        # Generate new token & resend email
        token = serializer.dumps(user.email, salt="email-confirm-salt")
        confirm_url = url_for("confirm_email", token=token, _external=True)
        html_body = render_template("confirm.html", confirm_url=confirm_url, username=user.username)
        text_body = f"Hi {user.username}, please confirm your email here: {confirm_url}"

        send_email("Resend: Confirm your email", [user.email], html_body=html_body, text_body=text_body)
        flash("A new confirmation email has been sent. Please check your inbox.", "info")
        return redirect(url_for("login"))

    return render_template("resend_confirmation.html")
#====================================================================================
# === RESEND CONFIRMATION === #


#====================================================================================
# === INDEX PAGE === #
@app.route("/index")
@nocache
def index():
    

    # 1) If already logged-in via session, just show the page
    if "user_id" in session:
        user = User.query.get(session["user_id"])
        if user:
            return render_template("index.html", username=user.username, email=user.email)
        

    # 2) Otherwise check the "remember me" cookie
    token = request.cookies.get("remember_token")

    if token:
        # Find the user who has this token
        user = User.query.filter_by(remember_token=token).first()
        #print("Found user:", user)
        if user:
            # Put username into session and redirect back to /index (now logged in)
            session["user_id"] = user.id
            #print("Logged in via remember token.")
            return render_template("index.html", username=user.username)

        # Optional: token exists but no user — remove the stale cookie so it won't reappear
        resp = make_response(redirect(url_for("login")))
        resp.set_cookie("remember_token", "", expires=0)
        return resp

    # 3) No session and no valid remember token → go to login
    return redirect(url_for("login"))
#====================================================================================
# === INDEX PAGE === #


#====================================================================================
# === LOGOUT PAGE === #
@app.route("/logout", methods=["POST"])
def logout():    
    
    user = User.query.get(session["user_id"]) #See if user is logged in
    
    if user:
        user.remember_token = None
        db.session.commit()

    #clear Flask session
    session.clear()
    #clear remember_token cookie
    resp = make_response(redirect(url_for("login")))
    resp.set_cookie("remember_token", "", expires=0)

    return resp
#====================================================================================
# === LOGOUT PAGE === #


#====================================================================================
# === SIGNUP PAGE === #
@limiter.limit("12 per 8 hours")
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form["username"]
        longname = request.form["longname"]
        idcard = request.form["idcard"]
        password = request.form["password"]
        email = request.form["email"]
        
        #Hash the password before saving
        hashed_pw = generate_password_hash(password)
        
        if not username or not email or not password:
            flash("Please fill required fields.", "danger")
            return redirect(url_for("signup"))

        # Check existing username / email
        if User.query.filter_by(username=username).first():
            flash("Username already taken.", "danger")
            return redirect(url_for("signup"))

        if User.query.filter_by(email=email).first():
            flash("Email already registered.", "danger")
            return redirect(url_for("signup"))

        #Create a new user object
        new_user = User(
            username = username,
            email = email,
            longname = longname,
            idcard = idcard,
            password = hashed_pw
        )
        try:
            db.session.add(new_user)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            flash("Database error: " + str(e), "danger")
            return redirect(url_for("signup"))
        
        user = get_user_by_username(username)
       
        # Generate confirmation token and URL
        token = generate_confirmation_token(user.email)
        confirm_url = url_for("confirm_email", token=token, _external = True)

        #Prepare message - both text and html optional
        subject = "Confirm your email"
        text_body = f"Hi {username}, \n\nPlease confirm your email by clicking the link: {confirm_url}\n\nIf you didn't sign up, ignore this email."
        html_body = render_template("confirm.html", confirm_url=confirm_url, username=username)

        send_email(subject, [email], html_body=html_body, text_body=text_body)

        flash("A confirmation email has been sent. Please check your inbox.", "info")

        return redirect(url_for("login"))
    return render_template("signup.html")
#====================================================================================
# === SIGNUP PAGE === #


#====================================================================================
# === EMAIL CONFIRMATION === #
@app.route("/confirm/<token>")
def confirm_email(token):
    
    try:
        # verify token using the same salt
        email = serializer.loads(token, salt="email-confirm-salt", max_age=3600)
    except SignatureExpired:
        flash("Your confirmation link has expired. Please sign up again.", "danger")
        return redirect(url_for("resend_confirmation"))
    except BadSignature:
        flash("Invalid confirmation link.", "danger")
        return redirect(url_for("login"))

    # find the user by email
    user = User.query.filter_by(email=email).first()
    if not user:
        flash("No account found for this email.", "danger")
        return redirect(url_for("signup"))

    # mark user as confirmed
    if user.confirmed:
        flash("Your email is already confirmed.", "info")
    else:
        user.confirmed = True
        user.confirmed_on = datetime.utcnow()
        db.session.commit()
        flash("Email confirmed successfully! You can now log in.", "success")

    flash("Email confirmed successfully! You can now log in.", "success")
    return redirect(url_for("login"))
#====================================================================================
# === EMAIL CONFIRMATION === #


#====================================================================================
# === FORGOT PASSWORD === #
@app.route("/forgot", methods=["GET", "POST"])
def forgot():
    if request.method=="POST":
        email = request.form["email"].strip().lower()
        user = User.query.filter_by(email=email).first()
        # Security option: Do not reveal whether email exists.
        # Always flash a generic message.
        if user:
            token = serializer.dumps(user.email, salt="password-reset-salt")
            reset_url = url_for("reset_password", token=token, _external=True)

            subject = "Password reset requested"
            reset_url = url_for("reset_password", token=token, _external=True)

            text_body = f"To reset your password, click: {reset_url}\nIf you did not request this, ignore."
            html_body = render_template("redirectemail.html", reset_url=reset_url, username=user.username)

            send_email(subject, [user.email], html_body=html_body, text_body=text_body)
            print("🔗 DEBUG RESET LINK:", reset_url)
        #Generic message (prevents account enumeration)
        flash("If the email exists in our system, a password reset link was sent.", "info")
        return redirect(url_for("login"))
    return render_template("forgot.html")
#====================================================================================
# === FORGOT PASSWORD === #


#====================================================================================
# === RESET PASSWORD === #
@app.route("/reset/<token>", methods = ["GET", "POST"])
def reset_password(token):
    
    # 1) validate token
    try:
        email = serializer.loads(token, salt="password-reset-salt", max_age = 3600)
        # Token valid for 1 hour
    except SignatureExpired:
        flash("The reset link has expired. Please request a new one.", "danger")
        return redirect(url_for("forgot"))
    except BadSignature:
        flash("The reset link is invalid.", "danger")
        return redirect(url_for("forgot"))
    
    # 2) find user by email
    user = User.query.filter_by(email=email).first()
    if not user:
        flash("No account found for that email.", "danger")
        return redirect(url_for("forgot"))
    
    # 3) handle form submit
    if request.method == "POST":
        new_password = request.form["password"]
        if not new_password:
            flash("Please enter a new password.", "warning")
            return render_template("reset.html", token=token)   # re-render the form
        user.password = generate_password_hash(new_password)
        db.session.commit()

        flash("Your password has been updated! You can now log in.", "success")
         # redirect to login (relative or absolute both OK)
        return redirect(url_for("login"))
    # GET → show the reset form
    return render_template("reset.html", token=token)
#====================================================================================
# === RESET PASSWORD === #


#====================================================================================
# === PERCAKAPAN === #
@app.route("/percakapan")
@nocache
def percakapan():
    # 1) If already logged-in via session, just show the page
    if "user_id" in session:
        
        user = User.query.get(session["user_id"])
        
        if user:
            return render_template("percakapan.html", username=user.username)
        else:
            # User deleted → clear session and redirect
            session.pop("username", None)
            flash("Your account no longer exists. Please log in again.", "warning")
            return redirect(url_for("login"))
    
    # 2) Otherwise check the "remember me" cookie
    token = request.cookies.get("remember_token")

    if token:
        # Find the user who has this token
        user = User.query.filter_by(remember_token=token).first()
        if user:
            # Put username into session and redirect back to /home (now logged in)
            session["user_id"] = user.id
            return redirect(url_for("percakapan"))

        # Optional: token exists but no user — remove the stale cookie so it won't reappear
        resp = make_response(redirect(url_for("login")))
        resp.set_cookie("remember_token", "", expires=0)
        return resp

    # 3) No session and no valid remember token → go to login
    return redirect(url_for("login"))
# === PERCAKAPAN === #
#====================================================================================


#====================================================================================
# === HSK 1 === #
@app.route("/hsk1")
@nocache
def hsk1():
    # Check session
    # 1) If already logged-in via session, just show the page
    if "user_id" in session:
        user = User.query.get(session["user_id"])
        if user:
            return render_template("hsk1.html", username=user.username)
        else:
            # User deleted → clear session and redirect
            session.pop("username", None)
            flash("Your account no longer exists. Please log in again.", "warning")
            return redirect(url_for("login"))
    
    # 2) Otherwise check the "remember me" cookie
    token = request.cookies.get("remember_token")

    if token:
        # Find the user who has this token
        user = User.query.filter_by(remember_token=token).first()
        if user:
            # Put username into session and redirect back to /home (now logged in)
            session["user_id"] = user.id
            return redirect(url_for("hsk1"))

        # Optional: token exists but no user — remove the stale cookie so it won't reappear
        resp = make_response(redirect(url_for("login")))
        resp.set_cookie("remember_token", "", expires=0)
        return resp

    # 3) No session and no valid token
    # 3) No session and no valid remember token → go to login
    return redirect(url_for("login"))
# === HSK 1 === #
#====================================================================================


#====================================================================================
# === PROGRESS === #
@app.route("/progress")
@nocache
def progress():
    
    if "user_id" in session:
        
        user = User.query.get(session["user_id"])
        
        if user:
            
            # ✅ Query UserProgress for this user, newest first
            results = sorted(user.progress, key=lambda p: p.date_taken or datetime.min, reverse=True)

            converted_results = []
            
            for row in results:
                
                if row.date_taken: #Make sure it's not null
                    utc_dt = row.date_taken
                    wita_dt = utc_dt + timedelta(hours=8)
                    formatted_time = wita_dt.strftime("%Y-%m-%d %H:%M:%S") + " " + "WITA"
 
                else:
                    formatted_time = "Unknown"
                converted_results.append((row.test_name, row.score, formatted_time))
            return render_template("progress.html", results=converted_results, username=user.username)

        else:
            # User deleted → clear session and redirect
            session.pop("username", None)
            flash("Your account no longer exists. Please log in again.", "warning")
            return redirect(url_for("login"))
    
    # 2) Otherwise check the "remember me" cookie
    token = request.cookies.get("remember_token")

    if token:
        # Find the user who has this token
        user = User.query.filter_by(remember_token=token).first()
        
        if user:
            # Put username into session and redirect back to /home (now logged in)
            session["user_id"] = user.id
            return redirect(url_for("progress"))

        # Optional: token exists but no user — remove the stale cookie so it won't reappear
        resp = make_response(redirect(url_for("login")))
        resp.set_cookie("remember_token", "", expires=0)
        return resp
    
# === PROGRESS === #
#====================================================================================


#====================================================================================
# === SAVE PROGRESS === #
@limiter.limit("20 per hour")
@app.route("/save_progress", methods=["POST"])
def save_progress():
    
    if "user_id" not in session:
        return redirect(url_for("login"))
    test_name = request.form.get("test_name")
    score = request.form.get("score")

    #print("DEBUG >>> test_name:", test_name)
    #print("DEBUG >>> raw score:", score)

    '''
    #Validate Inputs
    if not test_name or score is None:
        return "Invalid input", 400
    try:
        score = int(score) #Ensures it's a real integer
    except ValueError:
        return f"Invalid input (bad integer): {score}", 400
    '''

    # Get user_id from username
    user = User.query.get(session["user_id"])
    if not user:
        session.clear()  # destroy all session data
        return "User not found", 404
    new_value = UserProgress(
            user_id = user.id,
            test_name = test_name,
            score = score
    )
    db.session.add(new_value)
    db.session.commit()
    return "", 204
# === SAVE PROGRESS === #
#====================================================================================


#====================================================================================
# === UJIAN PERCAKAPAN === #
@app.route("/ujianpercakapan")
@nocache
def ujianpercakapan():
    
    # 1) If already logged-in via session, just show the page
    if "user_id" in session:
        user = User.query.get(session["user_id"])
        return render_template("ujianpercakapan.html", username=user.username)
    
    # 2) Otherwise check the "remember me" cookie
    token = request.cookies.get("remember_token")

    if token:
        # Find the user who has this token
        user = User.query.filter_by(remember_token=token).first()
        if user:
            # Put username into session and redirect back to /home (now logged in)
            session["user_id"] = user.id
            return redirect(url_for("ujianpercakapan"))

        # Optional: token exists but no user — remove the stale cookie so it won't reappear
        resp = make_response(redirect(url_for("login")))
        resp.set_cookie("remember_token", "", expires=0)
        return resp

    # 3) No session and no valid remember token → go to login
    return redirect(url_for("login"))
# === UJIAN PERCAKAPAN === #
#====================================================================================


#====================================================================================
# === PROFILE === #
@app.route("/user_profile")
@nocache
def user_profile():

    if "user_id" in session:
        
        user = User.query.get(session["user_id"])
        
        if user:
            
            if user.confirmed_on:
                wita_dt = user.confirmed_on + timedelta(hours=8)
                formatted_time = wita_dt.strftime("%Y-%m-%d %H:%M:%S") + " WITA"
            else:
                formatted_time = "Unknown"

            converted_result = (user.username, user.email, user.longname, user.idcard, user.confirmed, formatted_time)

            #print("Belakangoke", converted_results)
            return render_template("user_profile.html", userss=[converted_result], username=user.username)

        else:
            # User deleted → clear session and redirect
            session.pop("username", None)
            flash("Your account no longer exists. Please log in again.", "warning")
            return redirect(url_for("login"))
    
    # 2) Otherwise check the "remember me" cookie
    token = request.cookies.get("remember_token")

    if token:
        # Find the user who has this token
        user = User.query.filter_by(remember_token=token).first()
        
        if user:
            # Put username into session and redirect back to /home (now logged in)
            session["user_id"] = user.id
            return redirect(url_for("user_profile"))

        # Optional: token exists but no user — remove the stale cookie so it won't reappear
        resp = make_response(redirect(url_for("login")))
        resp.set_cookie("remember_token", "", expires=0)
        return resp

# === UJIAN PERCAKAPAN === #
#====================================================================================

@app.route("/test")
def test():
    print("TEST PRINT REACHED")
    return "OK"


@app.route("/test-email")
def test_email():
    msg = Message("Hello from Flask", recipients=["mulki.suyadi@gmail.com"]) #Send to this address
    msg.body = "This is a test email sent from Flask using Gmail SMTP."
    mail.send(msg)
    return "✅ Email sent!"


if __name__ == "__main__":
    #app.run(debug=True)
    app.run(host='0.0.0.0', port=5000)