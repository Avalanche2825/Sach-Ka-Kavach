import json
import random
import os
from datetime import datetime, timedelta

def generate_seed_data():
    customers = [
        {"cif": "CIF100000", "name": "Aarav Sharma", "speed_mean": 220, "speed_std": 15, "var_mean": 20, "var_std": 3, "hours": [18, 19, 20, 21, 22], "depth_range": (3, 5), "actions_range": (15, 20), "idle_range": (0, 1)},
        {"cif": "CIF100001", "name": "Priya Patel", "speed_mean": 350, "speed_std": 25, "var_mean": 60, "var_std": 8, "hours": [8, 9, 10, 11, 12], "depth_range": (2, 4), "actions_range": (5, 8), "idle_range": (1, 2)},
        {"cif": "CIF100002", "name": "Rohan Verma", "speed_mean": 280, "speed_std": 20, "var_mean": 35, "var_std": 5, "hours": [12, 13, 14, 15, 16, 17], "depth_range": (4, 6), "actions_range": (10, 14), "idle_range": (0, 1)},
        {"cif": "CIF100003", "name": "Neha Iyer", "speed_mean": 420, "speed_std": 30, "var_mean": 90, "var_std": 12, "hours": [9, 10, 11, 12, 13, 14, 15, 16, 17, 18], "depth_range": (5, 8), "actions_range": (6, 9), "idle_range": (2, 4)},
        {"cif": "CIF100004", "name": "Siddharth Rao", "speed_mean": 160, "speed_std": 10, "var_mean": 12, "var_std": 2, "hours": [22, 23, 0, 1, 2, 3], "depth_range": (3, 4), "actions_range": (20, 25), "idle_range": (0, 0)},
        {"cif": "CIF100005", "name": "Anjali Nair", "speed_mean": 300, "speed_std": 18, "var_mean": 40, "var_std": 6, "hours": [7, 8, 9, 10, 19, 20, 21], "depth_range": (3, 5), "actions_range": (11, 15), "idle_range": (1, 1)}
    ]

    all_sessions = []
    base_date = datetime(2026, 8, 1, 22, 0, 0)

    for cust in customers:
        cif = cust["cif"]
        for idx in range(100):
            delta_days = 100 - idx
            session_hour = random.choice(cust["hours"])
            session_minute = random.randint(0, 59)
            session_date = base_date - timedelta(days=delta_days)
            session_date = session_date.replace(hour=session_hour, minute=session_minute, second=0)

            typing_speed = max(80, int(random.normalvariate(cust["speed_mean"], cust["speed_std"])))
            typing_variance = max(5, int(random.normalvariate(cust["var_mean"], cust["var_std"])))

            depth = random.randint(*cust["depth_range"])
            actions = random.randint(*cust["actions_range"])
            idle = random.randint(*cust["idle_range"])
            copy_paste = random.random() < 0.02

            session_doc = {
                "sessionId": f"sess_{cif}_{idx}",
                "cif": cif,
                "loginTimestamp": session_date.isoformat() + "Z",
                "typingVariance": typing_variance,
                "typingSpeedAvg": typing_speed,
                "navigationDepth": depth,
                "actionsPerMinute": actions,
                "idlePeriods": idle,
                "copyPasteDetected": copy_paste
            }
            all_sessions.append(session_doc)

    output_dir = os.path.join(os.path.dirname(__file__), 'models')
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'seed_sessions.json')

    with open(output_path, 'w') as f:
        json.dump(all_sessions, f, indent=2)
    
    print(f"Generated {len(all_sessions)} mock behavioral sessions inside {output_path}")

if __name__ == "__main__":
    generate_seed_data()
