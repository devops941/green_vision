import logging
import sys


def setup_logging(debug: bool = True) -> logging.Logger:
    logger = logging.getLogger("greenvision")
    logger.setLevel(logging.DEBUG if debug else logging.INFO)

    if not logger.handlers:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG if debug else logging.INFO)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(filename)s:%(lineno)d - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger


logger = setup_logging()
