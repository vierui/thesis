"""
Metrics configuration.

Controls whether metrics collection is enabled via environment variable.
"""

import os

# Enable metrics via environment variable (default: False)
ENABLE_METRICS = os.getenv('ENABLE_METRICS', 'false').lower() == 'true'