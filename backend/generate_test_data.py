"""
AutoRepo Test Data Generator
快速生成跨月份的测试数据，用于验证趋势图表功能

使用方法：
1. 确保后端服务运行在 http://localhost:8001
2. 运行此脚本：python generate_test_data.py
3. 按提示输入车辆 ID
"""

import requests
import random
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8001/api"

MAINTENANCE_TYPES = {
    "maintenance": "保养",
    "repair": "维修",
    "modification": "改装"
}

SAMPLE_RECORDS = [
    {"title": "更换机油", "type": "maintenance", "parts": 250, "labor": 80},
    {"title": "轮胎换位", "type": "maintenance", "parts": 0, "labor": 100},
    {"title": "更换空气滤清器", "type": "maintenance", "parts": 80, "labor": 50},
    {"title": "更换刹车片", "type": "repair", "parts": 600, "labor": 200},
    {"title": "四轮定位", "type": "maintenance", "parts": 0, "labor": 150},
    {"title": "更换火花塞", "type": "maintenance", "parts": 320, "labor": 100},
    {"title": "更换电池", "type": "repair", "parts": 500, "labor": 80},
    {"title": "冷却液更换", "type": "maintenance", "parts": 150, "labor": 80},
    {"title": "改装音响", "type": "modification", "parts": 1200, "labor": 300},
    {"title": "年检", "type": "maintenance", "parts": 0, "labor": 200},
]

def generate_monthly_records(repo_id, start_mileage=5000):
    """
    生成过去 6 个月的测试记录
    
    每月记录数量：
    - 2025-08: 3 条
    - 2025-09: 2 条
    - 2025-10: 4 条
    - 2025-11: 1 条
    - 2025-12: 3 条
    - 2026-01: 2 条
    """
    
    monthly_counts = [3, 2, 4, 1, 3, 2]
    current_mileage = start_mileage
    total_created = 0
    
    now = datetime.now()
    
    for i, count in enumerate(monthly_counts):
        month_offset = 5 - i
        target_date = now - timedelta(days=month_offset * 30)
        
        print(f"\n生成 {target_date.strftime('%Y-%m')} 的记录（{count} 条）...")
        
        for j in range(count):
            record = random.choice(SAMPLE_RECORDS).copy()
            
            day_offset = random.randint(1, 28)
            commit_date = target_date.replace(day=day_offset)
            timestamp = commit_date.timestamp() * 1000
            
            current_mileage += random.randint(500, 2000)
            
            commit_data = {
                "repo_id": repo_id,
                "title": record["title"],
                "type": record["type"],
                "mileage": current_mileage,
                "timestamp": timestamp,
                "cost": {
                    "parts": record["parts"],
                    "labor": record["labor"]
                },
                "message": f"测试数据 - {commit_date.strftime('%Y年%m月%d日')}"
            }
            
            try:
                response = requests.post(f"{BASE_URL}/commits", json=commit_data)
                if response.status_code == 200:
                    total_created += 1
                    result = response.json()
                    total_cost = record["parts"] + record["labor"]
                    print(f"  ✓ {commit_date.strftime('%Y-%m-%d')} | {record['title']} | {current_mileage}km | ¥{total_cost}")
                else:
                    print(f"  ✗ 创建失败: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"  ✗ 请求错误: {e}")
    
    print(f"\n{'='*60}")
    print(f"总计创建: {total_created} 条记录")
    print(f"最终里程: {current_mileage} km")
    print(f"{'='*60}\n")
    
    return total_created

def verify_trends(repo_id):
    """验证趋势端点是否返回正确数据"""
    
    print("验证趋势数据...")
    try:
        response = requests.get(f"{BASE_URL}/repos/{repo_id}/trends?months=6")
        if response.status_code == 200:
            data = response.json()
            months = data.get("months", [])
            
            print(f"\n趋势数据汇总（共 {len(months)} 个月）：")
            print("-" * 60)
            print(f"{'月份':<12} | {'费用':>8} | {'里程':>10} | {'记录数':>6}")
            print("-" * 60)
            
            for month_data in months:
                print(f"{month_data['month']:<12} | ¥{month_data['cost']:>7} | {month_data['mileage']:>9}km | {month_data['count']:>6}")
            
            print("-" * 60)
            print("✓ 趋势数据验证成功\n")
            return True
        else:
            print(f"✗ 获取趋势数据失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ 请求错误: {e}")
        return False

def list_repos():
    """列出所有车辆"""
    
    try:
        response = requests.get(f"{BASE_URL}/repos")
        if response.status_code == 200:
            repos = response.json()
            if repos:
                print("\n可用的车辆：")
                print("-" * 60)
                for repo in repos:
                    print(f"ID: {repo['_id']}")
                    print(f"名称: {repo['name']}")
                    print(f"当前里程: {repo.get('current_mileage', 0)} km")
                    print("-" * 60)
                return repos
            else:
                print("暂无车辆数据，请先在小程序中创建车辆")
                return []
        else:
            print(f"获取车辆列表失败: {response.status_code}")
            return []
    except Exception as e:
        print(f"请求错误: {e}")
        print("\n请确保后端服务已启动：")
        print("  cd backend")
        print("  uvicorn main:app --reload --port 8001")
        return []

def main():
    print("=" * 60)
    print("AutoRepo 测试数据生成器")
    print("=" * 60)
    
    repos = list_repos()
    
    if not repos:
        return
    
    print("\n请输入车辆 ID（或按 Enter 使用第一个车辆）：")
    repo_id = input().strip()
    
    if not repo_id and repos:
        repo_id = repos[0]['_id']
        print(f"使用车辆: {repos[0]['name']} (ID: {repo_id})")
    
    print("\n请输入起始里程（默认：5000）：")
    start_mileage_input = input().strip()
    start_mileage = int(start_mileage_input) if start_mileage_input else 5000
    
    print("\n开始生成测试数据...")
    print("=" * 60)
    
    created_count = generate_monthly_records(repo_id, start_mileage)
    
    if created_count > 0:
        verify_trends(repo_id)
        
        print("测试数据生成完成！")
        print("\n下一步：")
        print("1. 打开微信开发者工具")
        print("2. 导航到该车辆的详情页")
        print("3. 切换到「数据统计」标签页")
        print("4. 查看趋势图表是否正确显示")
        print("\n或者：")
        print(f"访问 http://localhost:8001/api/repos/{repo_id}/trends?months=6")
        print("查看原始 JSON 数据\n")

if __name__ == "__main__":
    main()
