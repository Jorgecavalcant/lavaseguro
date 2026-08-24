from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+pysqlite:///./lavaseguro.db"
    api_cors_origins: str = "http://localhost:3000"
    app_secret: str = "dev-only-change-me"
    # Provedor de cobrança padrão (pluggable). MVP: manual.
    # Cliente configura o banco/adquirente dele — NÃO há adquirente fixo da Tech42.
    payment_provider: str = "manual"

    # JWT operador — default herda de app_secret para não exigir nova var no MVP.
    jwt_secret: str = ""
    jwt_expire_minutes: int = 480
    jwt_algorithm: str = "HS256"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(",") if o.strip()]

    @property
    def effective_jwt_secret(self) -> str:
        return self.jwt_secret or self.app_secret


@lru_cache
def get_settings() -> Settings:
    return Settings()
