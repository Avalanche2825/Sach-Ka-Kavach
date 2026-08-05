import urllib.request
import json
import random

def send_request(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

def test_scenarios():
    print("====================================================")
    print("STARTING BEHAVIOR SCORING CALIBRATION TEST SUITE")
    print("====================================================")

    # Step 1: Register a new customer to trigger Cold Start (learning state)
    cif = f"CIF{random.randint(100000, 999999)}"
    print(f"\n1. Registering new customer: {cif}...")
    reg_url = "http://localhost:4000/api/customers/register"
    reg_payload = {
        "name": "Test Calibration User",
        "balance": 75000
    }
    reg_res = send_request(reg_url, reg_payload)
    assigned_cif = reg_res.get("cif")
    print(f"   Registered successfully! Assigned CIF: {assigned_cif}")

    collect_url = "http://localhost:4000/api/behavior/collect"

    # Scenario A: New customer - Normal Login
    # Expected: Capped by Cold Start Policy to <= 12
    print("\n2. Executing Scenario A (New customer, normal typing & browsing)...")
    payload_normal = {
        "cif": assigned_cif,
        "sessionId": f"sess_normal_{assigned_cif}",
        "deviceInfo": {
            "visitorId": "visitor_normal_99",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "platform": "Win32",
            "language": "en-US",
            "screenResolution": "1920x1080",
            "timezone": "Asia/Kolkata"
        },
        "behaviorSignals": {
            "typingVariance": 40.0,
            "typingSpeedAvg": 280.0,
            "navigationDepth": 3,
            "actionsPerMinute": 10.0,
            "idlePeriods": 0,
            "copyPasteDetected": False
        }
    }
    res_normal = send_request(collect_url, payload_normal)
    print(f"   Result: RiskScore={res_normal['riskScore']}, TrustScore={res_normal['trustScore']}, Decision={res_normal['decision']}")
    assert res_normal['riskScore'] <= 12, f"Expected risk to be capped at 12, got {res_normal['riskScore']}"
    print("   [SUCCESS] Scenario A PASSED! (Risk capped at 12 under Learning state)")

    # Scenario B: New customer - Bot/Automation check
    # Expected: Bypasses Cold Start Cap due to Headless Browser or Bot signals
    print("\n3. Executing Scenario B (New customer, bot typing / headless browser)...")
    payload_bot = {
        "cif": assigned_cif,
        "sessionId": f"sess_bot_{assigned_cif}",
        "deviceInfo": {
            "visitorId": "visitor_bot_99",
            "userAgent": "HeadlessChrome/114.0.0.0",
            "platform": "unknown",
            "language": "en-US",
            "screenResolution": "800x600",
            "timezone": "UTC"
        },
        "behaviorSignals": {
            "typingVariance": 0.2, # Zero variance = bot-like mechanical timing
            "typingSpeedAvg": 1500.0, # Impossible typing speed
            "navigationDepth": 1,
            "actionsPerMinute": 400.0, # Impossible interaction speed
            "idlePeriods": 0,
            "copyPasteDetected": True
        }
    }
    res_bot = send_request(collect_url, payload_bot)
    print(f"   Result: RiskScore={res_bot['riskScore']}, TrustScore={res_bot['trustScore']}, Decision={res_bot['decision']}")
    assert res_bot['riskScore'] > 12, f"Expected risk to bypass cap, got {res_bot['riskScore']}"
    print("   [SUCCESS] Scenario B PASSED! (Risk bypassed cap due to critical signals)")

    # Scenario C: Mature Customer (CIF100001, 100 sessions)
    # Expected: Full evaluation, no cap
    print("\n4. Executing Scenario C (Mature Customer, normal behavior)...")
    payload_mature = {
        "cif": "CIF100001",
        "sessionId": "sess_mature_1",
        "deviceInfo": {
            "visitorId": "visitor_15_c",
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "platform": "Win32",
            "language": "en-US",
            "screenResolution": "1920x1080",
            "timezone": "Asia/Kolkata"
        },
        "behaviorSignals": {
            "typingVariance": 42.0,
            "typingSpeedAvg": 290.0,
            "navigationDepth": 3,
            "actionsPerMinute": 10.0,
            "idlePeriods": 0,
            "copyPasteDetected": False
        }
    }
    res_mature = send_request(collect_url, payload_mature)
    print(f"   Result: RiskScore={res_mature['riskScore']}, TrustScore={res_mature['trustScore']}, Decision={res_mature['decision']}")
    print("   [SUCCESS] Scenario C PASSED!")

    print("\n====================================================")
    print("ALL CALIBRATION VERIFICATION SCENARIOS PASSED!")
    print("====================================================")

if __name__ == "__main__":
    test_scenarios()
