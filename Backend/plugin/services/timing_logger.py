import logging
import time
import functools
from pathlib import Path
from plugin.models import FunctionLog
# Create logs directory
log_dir = Path('logs')
log_dir.mkdir(exist_ok=True)

# Setup logging
logger = logging.getLogger('function_timer')
logger.setLevel(logging.INFO)

# Create file handler
handler = logging.FileHandler(log_dir / 'function_timing.log')
formatter = logging.Formatter('%(asctime)s | Function: %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

def log_time(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        status = "Success"
        error_message = None

        try:
            # Execute the wrapped function
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            # Capture errors
            status = "Error"
            error_message = str(e)
            logger.error(f"Error in {func.__name__}: {e}")
            raise
        finally:
            end = time.perf_counter()
            execution_time = end - start
            logger.info(f"{func.__name__} | Time: {execution_time:.4f} seconds")

            # Save log to database
            FunctionLog.objects.create(
                function_name=func.__name__,
                execution_time=execution_time,
                status=status,
                error_message=error_message
            )
    return wrapper