from django.conf import settings
from datetime import datetime, timedelta
import jwt
from Occupier.models import Occupier
from rest_framework_simplejwt.tokens import RefreshToken

def generate_access_token(occupier):
	payload = {
		#  'occupier_id': occupier.occupier_id,
		'exp': datetime.utcnow() + timedelta(days=1, minutes=60),
		'iat': datetime.utcnow(),
	}

	access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
	return access_token

