from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    database_url:str='postgresql+psycopg://farming_user:farming_password@localhost:5432/smart_farming'
    jwt_secret:str='change-me-in-production'
    access_token_expire_minutes:int=60
    openweather_api_key:str=''
    openweather_units:str='metric'
    upload_dir:str='./uploads'
    model_path:str='./weights/disease_model.pt'
    classes_path:str='./weights/classes.json'
    cors_origins:str='http://localhost:5173,http://localhost:3000'
    max_upload_mb:int=8
    model_config=SettingsConfigDict(env_file='.env',extra='ignore')
    @property
    def origins(self): return [x.strip() for x in self.cors_origins.split(',') if x.strip()]
@lru_cache
def settings(): return Settings()
