import os
import sys

# Add the app directory to the path
sys.path.insert(0, '/app')

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Allow sync ORM operations in Jupyter's async context
os.environ['DJANGO_ALLOW_ASYNC_UNSAFE'] = 'true'

import django
django.setup()

print("Django loaded successfully. All models are available.")
