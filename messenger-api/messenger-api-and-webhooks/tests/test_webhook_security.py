"""
Copyright (c) Meta Platforms, Inc. and affiliates.
All rights reserved.

Security regression tests for messenger-api-and-webhooks/app.py
These tests verify fixes for:
  - Finding #4 (HIGH): Hardcoded credentials, debug mode, signature bypass bug
"""

import hashlib
import hmac
import json
import os
import unittest
from unittest.mock import patch


class WebhookAppSecurityTest(unittest.TestCase):
    """Security regression tests for the webhook sample application."""

    def setUp(self) -> None:
        # Set environment variables before importing the app module
        os.environ["VERIFY_TOKEN"] = "test_verify_token_12345"
        os.environ["PAGE_ACCESS_TOKEN"] = "test_page_access_token"
        os.environ["APP_SECRET"] = "test_app_secret_key"

        # Import app module fresh so it picks up the env vars
        import importlib

        import messenger.messenger_platform_samples.messenger_api.messenger_api_and_webhooks.app as app_module

        importlib.reload(app_module)
        self.app_module = app_module
        self.app = app_module.app
        self.client = self.app.test_client()

    # ------------------------------------------------------------------
    # Finding #4a: Verify credentials are NOT hardcoded
    # ------------------------------------------------------------------

    def test_no_hardcoded_verify_token(self) -> None:
        """Verify that the VERIFY_TOKEN is read from environment, not hardcoded."""
        source_path = os.path.join(os.path.dirname(self.app_module.__file__), "app.py")
        self.assertTrue(
            os.path.exists(source_path),
            f"Source file not found at {source_path}",
        )
        with open(source_path) as f:
            source = f.read()
        self.assertNotIn(
            '"your-secret-token"',
            source,
            "TOKEN must not be hardcoded as 'your-secret-token'",
        )
        self.assertNotIn(
            '"secret_page_access_token"',
            source,
            "PAGE_ACCESS_TOKEN must not be hardcoded",
        )
        # Verify os.environ or os.environ.get is used
        self.assertIn(
            "os.environ",
            source,
            "Credentials must be loaded from environment variables",
        )

    # ------------------------------------------------------------------
    # Finding #4b: Verify debug mode is disabled
    # ------------------------------------------------------------------

    def test_debug_mode_disabled(self) -> None:
        """Verify that Flask debug mode is not enabled (RCE risk)."""
        source_path = os.path.join(os.path.dirname(self.app_module.__file__), "app.py")
        self.assertTrue(
            os.path.exists(source_path),
            f"Source file not found at {source_path}",
        )
        with open(source_path) as f:
            source = f.read()
        self.assertNotIn(
            "debug=True",
            source,
            "Flask app.run() must not use debug=True",
        )

    # ------------------------------------------------------------------
    # Finding #4c: Signature verification indentation fix
    # ------------------------------------------------------------------

    def test_valid_signature_accepted(self) -> None:
        """Verify that a request with a valid HMAC signature is accepted."""
        body = json.dumps(
            {
                "object": "page",
                "entry": [
                    {
                        "changes": [
                            {
                                "field": "feed",
                                "value": {"post_id": "123_456"},
                            }
                        ]
                    }
                ],
            }
        ).encode("utf-8")

        secret = os.environ["APP_SECRET"]
        sig = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()

        with patch("requests.post") as mock_post:
            mock_post.return_value.text = "ok"
            response = self.client.post(
                "/webhook",
                data=body,
                content_type="application/json",
                headers={"X-Hub-Signature-256": f"sha256={sig}"},
            )

        self.assertEqual(
            response.status_code,
            200,
            "Valid signature should be accepted with 200",
        )

    def test_invalid_signature_rejected(self) -> None:
        """Verify that a request with an invalid HMAC signature is rejected."""
        body = json.dumps({"object": "page", "entry": []}).encode("utf-8")

        response = self.client.post(
            "/webhook",
            data=body,
            content_type="application/json",
            headers={"X-Hub-Signature-256": "sha256=invalid_signature_here"},
        )

        self.assertEqual(
            response.status_code,
            403,
            "Invalid signature must be rejected with 403",
        )

    def test_signature_check_is_not_bypassed(self) -> None:
        """Regression: the original code had an indentation bug that caused
        ALL POST requests to return 403 regardless of signature validity.
        After the fix, valid signatures should return 200."""
        body = json.dumps(
            {
                "object": "page",
                "entry": [
                    {
                        "changes": [
                            {
                                "field": "feed",
                                "value": {"post_id": "test_post"},
                            }
                        ]
                    }
                ],
            }
        ).encode("utf-8")

        secret = os.environ["APP_SECRET"]
        sig = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()

        with patch("requests.post") as mock_post:
            mock_post.return_value.text = "ok"
            response = self.client.post(
                "/webhook",
                data=body,
                content_type="application/json",
                headers={"X-Hub-Signature-256": f"sha256={sig}"},
            )

        # The original buggy code would always return 403 due to wrong
        # indentation. The fixed code should return 200 for valid signatures.
        self.assertNotEqual(
            response.status_code,
            403,
            "Valid signature must NOT return 403 (indentation bug regression)",
        )

    # ------------------------------------------------------------------
    # Webhook verification (GET) tests
    # ------------------------------------------------------------------

    def test_webhook_verification_correct_token(self) -> None:
        """Verify that webhook verification succeeds with correct token."""
        response = self.client.get(
            "/webhook",
            query_string={
                "hub.mode": "subscribe",
                "hub.verify_token": "test_verify_token_12345",
                "hub.challenge": "challenge_123",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data.decode(), "challenge_123")

    def test_webhook_verification_wrong_token(self) -> None:
        """Verify that webhook verification fails with wrong token."""
        response = self.client.get(
            "/webhook",
            query_string={
                "hub.mode": "subscribe",
                "hub.verify_token": "WRONG_TOKEN",
                "hub.challenge": "challenge_123",
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_webhook_verification_missing_token(self) -> None:
        """Verify that missing token does not cause verification to succeed."""
        response = self.client.get(
            "/webhook",
            query_string={
                "hub.mode": "subscribe",
                "hub.challenge": "challenge_123",
            },
        )
        # Without verify_token, should not return 200 with challenge
        self.assertNotEqual(response.data.decode(), "challenge_123")

    # ------------------------------------------------------------------
    # POST body validation edge cases
    # ------------------------------------------------------------------

    def test_post_non_page_object_rejected(self) -> None:
        """Verify that webhook events not from page subscription are rejected."""
        body = json.dumps({"object": "not_a_page"}).encode("utf-8")

        secret = os.environ["APP_SECRET"]
        sig = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()

        response = self.client.post(
            "/webhook",
            data=body,
            content_type="application/json",
            headers={"X-Hub-Signature-256": f"sha256={sig}"},
        )

        self.assertEqual(
            response.status_code,
            403,
            "Non-page object type must be rejected",
        )
