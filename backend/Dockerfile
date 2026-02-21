### Dockerfile for the FastAPI Backend
# use official Python runtime as a parent image
FROM python:3.12-slim

# 2. Install system build dependencies for compiling packages like scikit-learn
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      build-essential \
      gcc \
      gfortran \
      libopenblas-dev \
      liblapack-dev \
      python3-dev && \
    rm -rf /var/lib/apt/lists/*

# set working directory
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.8.17 /uv /uvx /bin/

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/.venv/bin:$PATH"

# https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

# copy the application code
COPY app/ /app/app

COPY uv.lock pyproject.toml /app/

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

# expose the port your app runs on
EXPOSE 8000

# start the FastAPI server with Uvicorn
CMD ["fastapi", "dev", "app/main.py", "--host", "0.0.0.0"]
