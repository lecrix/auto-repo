
import json
import os
from datetime import datetime
from bson import ObjectId

class MockCursor:
    def __init__(self, data):
        self.data = data
        self.idx = 0

    def sort(self, key_or_list, direction=None):
        # Very basic sort implementation
        if isinstance(key_or_list, list):
            # Just take the first sort key for simplicity
            key, direction = key_or_list[0]
        else:
            key = key_or_list
            direction = direction or 1
            
        reverse = direction == -1
        self.data.sort(key=lambda x: x.get(key, 0), reverse=reverse)
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        if self.idx < len(self.data):
            val = self.data[self.idx]
            self.idx += 1
            return val
        else:
            raise StopAsyncIteration

    async def to_list(self, length=None):
        if length:
            return self.data[:length]
        return self.data

class MockCollection:
    def __init__(self, name, db):
        self.name = name
        self.db = db
        self.data = []

    def find(self, query=None):
        if not query:
            return MockCursor(list(self.data))
        
        filtered = []
        for item in self.data:
            match = True
            for k, v in query.items():
                if k == "_id" and isinstance(v, ObjectId):
                     if str(item.get("_id")) != str(v):
                         match = False; break
                elif k == "_id" and isinstance(v, dict) and "$in" in v:
                     # Handle $in query for _id
                     target_ids = [str(tid) for tid in v["$in"]]
                     if str(item.get("_id")) not in target_ids:
                         match = False; break
                elif isinstance(v, dict) and "$ne" in v:
                    if item.get(k) == v["$ne"]:
                         match = False; break
                elif item.get(k) != v:
                    match = False
                    break
            if match:
                filtered.append(item)
        return MockCursor(filtered)

    async def find_one(self, query):
        cursor = self.find(query)
        result = await cursor.to_list()
        return result[0] if result else None

    async def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = ObjectId()
        self.data.append(document)
        
        # Save to file persistence
        self.db.save()
        
        class Result:
            inserted_id = document["_id"]
        return Result()

    async def update_one(self, query, update):
        item = await self.find_one(query)
        if item:
            if "$set" in update:
                for k, v in update["$set"].items():
                    item[k] = v
            self.db.save()
        return None

    async def update_many(self, query, update):
        # Simplified update many
        cursor = self.find(query)
        items = await cursor.to_list()
        count = 0
        for item in items:
            if "$set" in update:
                for k, v in update["$set"].items():
                    item[k] = v
            count += 1
        if count > 0:
            self.db.save()
    
    # Very basic aggregation for stats
    def aggregate(self, pipeline):
        # Only support specific stats pipeline used in routes.py
        # This is hardcoded for the specific use case of Phase 3
        # Pipeline 0: match repo_id
        # Pipeline 1: group total costs
        
        # This is too complex to mock generically, returning empty valid structure
        # or trying to implement basic match/group
        
        # Let's try to interpret the first $match
        filtered = self.data
        if len(pipeline) > 0 and "$match" in pipeline[0]:
            match_q = pipeline[0]["$match"]
            # reusing find logic
            c = self.find(match_q)
            filtered = c.data
            
        if len(pipeline) > 1 and "$group" in pipeline[1]:
            # Hardcoded logic for the specific stats endpoint
            total_parts = sum(doc.get("cost", {}).get("parts", 0) for doc in filtered)
            total_labor = sum(doc.get("cost", {}).get("labor", 0) for doc in filtered)
            count = len(filtered)
            
            # Use 'type' grouping if _id is type (for composition)
            group_id = pipeline[1]["$group"]["_id"]
            
            if group_id == "$type":
                 # Composition chart
                 groups = {}
                 for doc in filtered:
                     t = doc.get("type", "Other")
                     cost = doc.get("cost", {}).get("parts", 0) + doc.get("cost", {}).get("labor", 0)
                     groups[t] = groups.get(t, 0) + cost
                 
                 return MockCursor([{"_id": k, "value": v} for k, v in groups.items()])
            else:
                # Summary stats
                return MockCursor([{
                    "total_parts": total_parts,
                    "total_labor": total_labor,
                    "count": count
                }])
                
        return MockCursor(filtered)


class MockDatabase:
    def __init__(self):
        self.collections = {}
        self.file_path = "mock_db_data.json"
        self.load()

    def __getattr__(self, name):
        if name not in self.collections:
            self.collections[name] = MockCollection(name, self)
        return self.collections[name]

    def load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for col_name, col_data in data.items():
                        c = self.__getattr__(col_name)
                        # Restore ObjectIds
                        for doc in col_data:
                            if "_id" in doc:
                                try:
                                    doc["_id"] = ObjectId(doc["_id"])
                                except:
                                    pass
                        c.data = col_data
            except Exception as e:
                print(f"Error loading mock DB: {e}")

    def save(self):
        data = {}
        for name, col in self.collections.items():
            # Convert ObjectIds to strings for JSON
            serializable_data = []
            for doc in col.data:
                d = doc.copy()
                if "_id" in d:
                    d["_id"] = str(d["_id"])
                serializable_data.append(d)
            data[name] = serializable_data
            
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
