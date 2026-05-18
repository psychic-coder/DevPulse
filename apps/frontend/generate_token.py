import jwt
import datetime

# From the grep command earlier
secret = "9245193a308630420c90f636cdef8c98334797e3fedf92e193e886c2db63a883"
# The user ID from the initial prompt's example token
user_id = "fab7bbd0-0543-4e0c-aeda-9045dbe555a4"

payload = {
    "sub": user_id,
    "githubUsername": "testuser",
    "iat": int(datetime.datetime.utcnow().timestamp()),
    "exp": int((datetime.datetime.utcnow() + datetime.timedelta(hours=1)).timestamp())
}

token = jwt.encode(payload, secret, algorithm="HS256")
print(token)
