import jwt
from fastapi import Depends,HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User
from app.security import oauth,decode
def current_user(t:str=Depends(oauth),db:Session=Depends(get_db)):
    try: uid=int(decode(t)['sub'])
    except (jwt.PyJWTError,KeyError,ValueError,TypeError): raise HTTPException(401,'Invalid or expired token')
    u=db.get(User,uid)
    if not u or not u.is_active: raise HTTPException(401,'Invalid user')
    return u
