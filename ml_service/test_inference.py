import urllib.request
import json

def test_inference():
    url = "http://localhost:5001/score/behavioral"
    payload = {
        "cif": "CIF100001",
        "features": {
            "login_hour": 14,
            "login_time_deviation": 1.2,
            "amount_ratio": 1.15,
            "is_new_device": False,
            "is_new_ip": False,
            "is_new_location": False,
            "typing_variance": 40.5,
            "typing_deviation": 0.05,
            "navigation_depth": 4,
            "navigation_deviation": 0.5,
            "actions_per_minute": 12.0,
            "idle_periods": 1,
            "copy_paste_detected": False
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )

    try:
        with urllib.request.urlopen(req) as res:
            response_body = res.read().decode('utf-8')
            print("Response:", response_body)
    except Exception as e:
        print("Error sending request:", e)

if __name__ == "__main__":
    test_inference()
