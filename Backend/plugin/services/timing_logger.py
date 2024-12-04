import logging
import time
import functools
from pathlib import Path

# Create logs directory
log_dir = Path('logs')
log_dir.mkdir(exist_ok=True)

# Setup logging
logger = logging.getLogger('function_timer')
logger.setLevel(logging.INFO)

# Create file handler
handler = logging.FileHandler('logs/function_timing.log')
formatter = logging.Formatter('%(asctime)s | Function: %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

def log_time(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        logger.info(f"{func.__name__} | Time: {end - start:.4f} seconds")
        return result
    return wrapper
