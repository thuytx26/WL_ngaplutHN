# tests/conftest.py
import pytest

def pytest_addoption(parser):
    parser.addini("api_base_url", "Base URL for the API", default="http://127.0.0.1:8000")

@pytest.fixture
def api_base_url(pytestconfig):
    return pytestconfig.getini("api_base_url")
