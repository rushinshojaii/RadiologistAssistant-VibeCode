import os
import sys
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

# Ensure the backend directory is in the path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

import main

# Mock the Gemini client to avoid making real API calls during tests
mock_client = MagicMock()
main.client = mock_client

client = TestClient(main.app)

def test_health_check():
    """Verify that the health check endpoint returns the correct status."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    print("Health check endpoint test: PASSED")

def test_generate_report_empty():
    """Verify that an empty transcript returns an empty report immediately."""
    response = client.post("/generate-report", json={"transcript": ""})
    assert response.status_code == 200
    assert response.json()["report"] == ""
    print("Empty transcript endpoint test: PASSED")

def test_generate_report_mocked():
    """Verify that a normal transcript is sent to the LLM and the report is returned."""
    # Setup mock response from Gemini
    mock_response = MagicMock()
    mock_response.text = (
        "Examination\nChest X-ray\n\n"
        "Findings\nLungs are clear. Normal cardiomediastinal silhouette.\n\n"
        "Impression\nNormal chest X-ray."
    )
    mock_client.models.generate_content.return_value = mock_response

    # Make post request
    response = client.post(
        "/generate-report", 
        json={"transcript": "chest x-ray findings lungs are clear heart is normal"}
    )
    
    assert response.status_code == 200
    report_text = response.json()["report"]
    assert "Chest X-ray" in report_text
    assert "Findings" in report_text
    assert "Impression" in report_text
    
    # Assert that client was called with correct model
    mock_client.models.generate_content.assert_called_with(
        model="gemini-2.5-flash",
        contents="chest x-ray findings lungs are clear heart is normal",
        config=main.types.GenerateContentConfig(
            system_instruction=main.SYSTEM_PROMPT,
            temperature=0.1
        )
    )
    print("Report generation endpoint mock test: PASSED")

if __name__ == "__main__":
    print("Running backend unit tests...")
    try:
        test_health_check()
        test_generate_report_empty()
        test_generate_report_mocked()
        print("\nAll backend tests passed successfully!")
    except AssertionError as e:
        print(f"\nTest FAILED: {e}")
        sys.exit(1)
