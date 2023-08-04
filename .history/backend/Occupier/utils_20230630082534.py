from django.conf import settings
from datetime import datetime, timedelta
import jwt


def generate_access_token(occupier):
	payload = {
		 'occupier_id': occupier.occupier_id,
		'exp': datetime.utcnow() + timedelta(days=1, minutes=60),
		'iat': datetime.utcnow(),
	}

	access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
	return access_token

def generate_refresh_token(occupier):
	refresh_token_payload = {
		'occupier_id' : occupier.id,
	}
	