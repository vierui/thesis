# import unittest
# from waitress import serve
# from app.main import create_app
# import logging
# from flask import request

# app = create_app('dev')

# app.app_context().push()

# logging.basicConfig(level=logging.INFO,
#                     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
#                     handlers=[
#                         logging.FileHandler("waitress.log"),
#                         logging.StreamHandler()
#                     ])

# logger = logging.getLogger('waitress')

# # def log_request_info():
# #     logger.info(f"Route: {request.path}, Method: {request.method}")
    
# @app.cli.command()
# def test():
#     """Runs the unit tests."""
#     tests = unittest.TestLoader().discover('app/test', pattern='test*.py')
#     result = unittest.TextTestRunner(verbosity=2).run(tests)

#     if result.wasSuccessful():
#         return 0
#     return 1


# if __name__ == "__main__":
#     logger = logging.getLogger('waitress')
#     logger.setLevel(logging.INFO)
#     serve(app, host='0.0.0.0', port=5000, _quiet=False)


    
import unittest
import uvicorn
import os
from asgiref.wsgi import WsgiToAsgi

from app.main import create_app

# Get environment from FLASK_ENV environment variable, default to 'dev'
env = os.getenv('FLASK_ENV', 'dev')
app = create_app(env)

app.app_context().push()

# Wrap Flask WSGI app with ASGI adapter to run with uvicorn (supports async views)
asgi_app = WsgiToAsgi(app)


@app.cli.command()
def test():
    """Runs the unit tests."""
    tests = unittest.TestLoader().discover('app/test', pattern='test*.py')
    result = unittest.TextTestRunner(verbosity=2).run(tests)

    if result.wasSuccessful():
        return 0
    return 1


if __name__ == "__main__":
    uvicorn.run(asgi_app, host="0.0.0.0", port=5000, log_level="info")
    