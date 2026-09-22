from datetime import datetime,timedelta,timezone
import jwt
from pwdlib import PasswordHash
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
ph=PasswordHash.recommended(); oauth=OAuth2PasswordBearer(tokenUrl='/api/auth/login')
def hash_pw(x): return ph.hash(x)
def verify_pw(x,h): return ph.verify(x,h)
def token(uid):
    exp=datetime.now(timezone.utc)+timedelta(minutes=settings().access_token_expire_minutes); return jwt.encode({'sub':str(uid),'exp':exp},settings().jwt_secret,algorithm='HS256')
def decode(t): return jwt.decode(t,settings().jwt_secret,algorithms=['HS256'])
