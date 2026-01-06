#!/usr/bin/env python3
"""
Cron job script to run AI safety analysis on all tourists
Run this script periodically (e.g., every 5 minutes) using a cron job
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_safety_engine import analyze_all_tourists

if __name__ == '__main__':
    print("[v0] Starting scheduled AI safety analysis...")
    success = analyze_all_tourists()
    
    if success:
        print("[v0] Scheduled analysis completed successfully")
        sys.exit(0)
    else:
        print("[v0] Scheduled analysis failed")
        sys.exit(1)
