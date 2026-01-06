"""
Background service to periodically analyze all tourists for safety anomalies.
This script should be run as a cron job every 5-10 minutes.
"""
import requests
import time
from datetime import datetime

API_BASE_URL = "http://localhost:5000"  # Update for production

def run_ai_analysis():
    """Trigger AI safety analysis for all active tourists"""
    try:
        print(f"[{datetime.now()}] Starting AI safety analysis...")
        
        response = requests.post(f"{API_BASE_URL}/api/ai/analyze-all")
        
        if response.status_code == 200:
            print(f"[{datetime.now()}] AI analysis completed successfully")
        else:
            print(f"[{datetime.now()}] AI analysis failed: {response.status_code}")
            
    except Exception as e:
        print(f"[{datetime.now()}] Error running AI analysis: {e}")

if __name__ == "__main__":
    print("Starting AI Safety Analyzer Background Service")
    print("This will run AI analysis every 5 minutes")
    print("Press Ctrl+C to stop")
    
    while True:
        run_ai_analysis()
        time.sleep(300)  # Wait 5 minutes
