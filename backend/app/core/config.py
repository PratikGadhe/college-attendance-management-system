import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for the backend (where .env is located)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file
load_dotenv(dotenv_path=BASE_DIR / ".env")


class Settings:
    """Application and database configuration settings."""

    APP_NAME: str = os.getenv("APP_NAME", "Attendance Management System API")
    APP_VERSION: str = os.getenv("APP_VERSION", "0.1.0")

    # Database configuration
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME", "attendance_management")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")

    # CORS Configuration for React + Vite development
    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]



settings = Settings()

