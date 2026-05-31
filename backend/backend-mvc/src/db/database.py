from collections.abc import AsyncGenerator
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.config import Config

# libpq URL params that asyncpg.connect() does not accept as kwargs
_ASYNCPG_UNSUPPORTED_QUERY_PARAMS = frozenset({
    "sslmode",
    "channel_binding",
    "gssencmode",
    "krbsrvname",
    "service",
    "options",
})


def prepare_asyncpg_url(url: str) -> tuple[str, dict]:
    """Normalize DATABASE_URL for SQLAlchemy + asyncpg."""
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    parsed = urlparse(url)
    query = parse_qs(parsed.query, keep_blank_values=True)
    connect_args: dict = {}

    if "sslmode" in query:
        sslmode = query.pop("sslmode")[0].lower()
        if sslmode in ("require", "verify-ca", "verify-full", "prefer", "allow"):
            connect_args["ssl"] = True
        elif sslmode == "disable":
            connect_args["ssl"] = False

    for param in _ASYNCPG_UNSUPPORTED_QUERY_PARAMS:
        query.pop(param, None)

    flat_query = {k: (v[0] if len(v) == 1 else v) for k, v in query.items()}
    cleaned_url = urlunparse(parsed._replace(query=urlencode(flat_query, doseq=True)))
    return cleaned_url, connect_args


class Base(DeclarativeBase):
    pass


_database_url, _connect_args = prepare_asyncpg_url(Config.DATABASE_URL)

engine = create_async_engine(
    _database_url,
    connect_args=_connect_args,
    echo=Config.DEBUG,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
