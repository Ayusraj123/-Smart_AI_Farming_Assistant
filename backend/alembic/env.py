from alembic import context
from sqlalchemy import engine_from_config,pool
from app.core.config import settings
from app.db import Base
from app import models
config=context.config; config.set_main_option('sqlalchemy.url',settings().database_url); target_metadata=Base.metadata
def run_migrations_offline():
    context.configure(url=settings().database_url,target_metadata=target_metadata,literal_binds=True); context.run_migrations()
def run_migrations_online():
    c=engine_from_config(config.get_section(config.config_ini_section),prefix='sqlalchemy.',poolclass=pool.NullPool)
    with c.connect() as conn: context.configure(connection=conn,target_metadata=target_metadata); context.run_migrations()
if context.is_offline_mode(): run_migrations_offline()
else: run_migrations_online()
