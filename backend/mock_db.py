
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
            match = self._match_document(item, query)
            if match:
                filtered.append(item)
        return MockCursor(filtered)
    
    def _match_document(self, item, query):
        """Check if document matches query with MongoDB operator support"""
        for k, v in query.items():
            if k == "$or":
                # Logical OR operator
                if not isinstance(v, list):
                    return False
                or_match = False
                for or_clause in v:
                    if self._match_document(item, or_clause):
                        or_match = True
                        break
                if not or_match:
                    return False
            elif k == "$and":
                # Logical AND operator
                if not isinstance(v, list):
                    return False
                for and_clause in v:
                    if not self._match_document(item, and_clause):
                        return False
            elif k == "_id" and isinstance(v, ObjectId):
                if str(item.get("_id")) != str(v):
                    return False
            elif k == "_id" and isinstance(v, dict) and "$in" in v:
                # Handle $in query for _id
                target_ids = [str(tid) for tid in v["$in"]]
                if str(item.get("_id")) not in target_ids:
                    return False
            elif isinstance(v, dict):
                # Handle comparison operators
                field_value = item.get(k)
                if "$gte" in v:
                    if field_value is None or field_value < v["$gte"]:
                        return False
                if "$lte" in v:
                    if field_value is None or field_value > v["$lte"]:
                        return False
                if "$gt" in v:
                    if field_value is None or field_value <= v["$gt"]:
                        return False
                if "$lt" in v:
                    if field_value is None or field_value >= v["$lt"]:
                        return False
                if "$ne" in v:
                    if field_value == v["$ne"]:
                        return False
                if "$in" in v:
                    if field_value not in v["$in"]:
                        return False
                if "$regex" in v:
                    import re
                    pattern = v["$regex"]
                    options = v.get("$options", "")
                    flags = 0
                    if "i" in options:
                        flags |= re.IGNORECASE
                    if not re.search(pattern, str(field_value) if field_value else "", flags):
                        return False
            elif item.get(k) != v:
                return False
        return True

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

    async def delete_one(self, query):
        item = await self.find_one(query)
        if item:
            self.data = [d for d in self.data if d is not item]
            self.db.save()
            class Result:
                deleted_count = 1
            return Result()
        class Result:
            deleted_count = 0
        return Result()

    async def delete_many(self, query):
        cursor = self.find(query)
        items = await cursor.to_list()
        ids_to_delete = set()
        for item in items:
            ids_to_delete.add(str(item.get("_id")))
        original_count = len(self.data)
        self.data = [d for d in self.data if str(d.get("_id")) not in ids_to_delete]
        deleted_count = original_count - len(self.data)
        if deleted_count > 0:
            self.db.save()
        class Result:
            pass
        Result.deleted_count = deleted_count
        return Result()
    
    # Enhanced aggregation pipeline support
    def aggregate(self, pipeline):
        """Support MongoDB aggregation pipeline stages"""
        data = list(self.data)
        
        for stage in pipeline:
            if "$match" in stage:
                # Filter documents
                matched = []
                for doc in data:
                    if self._match_document(doc, stage["$match"]):
                        matched.append(doc)
                data = matched
            
            elif "$facet" in stage:
                # Multiple parallel aggregations
                result = {}
                for facet_name, facet_pipeline in stage["$facet"].items():
                    facet_result = self._execute_pipeline(data, facet_pipeline)
                    result[facet_name] = facet_result
                return MockCursor([result])
            
            elif "$group" in stage:
                # Group documents
                group_spec = stage["$group"]
                group_id = group_spec["_id"]
                
                if group_id is None:
                    # Group all into one
                    result = {"_id": None}
                    for field, expr in group_spec.items():
                        if field == "_id":
                            continue
                        result[field] = self._apply_accumulator(expr, data)
                    data = [result]
                elif isinstance(group_id, str) and group_id.startswith("$"):
                    # Group by field
                    field_name = group_id[1:]
                    groups = {}
                    for doc in data:
                        key = doc.get(field_name)
                        if key not in groups:
                            groups[key] = []
                        groups[key].append(doc)
                    
                    results = []
                    for key, docs in groups.items():
                        result = {"_id": key}
                        for field, expr in group_spec.items():
                            if field == "_id":
                                continue
                            result[field] = self._apply_accumulator(expr, docs)
                        results.append(result)
                    data = results
            
            elif "$addFields" in stage:
                add_fields_spec = stage["$addFields"]
                for doc in data:
                    for field, expr in add_fields_spec.items():
                        doc[field] = self._evaluate_expression(expr, doc)
            
            elif "$sort" in stage:
                # Sort documents
                sort_spec = stage["$sort"]
                for field, direction in reversed(list(sort_spec.items())):
                    # Use 0 as default for None values to avoid TypeError in comparison
                    data.sort(key=lambda x, f=field: x.get(f) if x.get(f) is not None else 0, reverse=(direction == -1))
            
            elif "$project" in stage:
                # Project fields
                projected = []
                for doc in data:
                    new_doc = {}
                    for field, value in stage["$project"].items():
                        if value == 1:
                            new_doc[field] = doc.get(field)
                        elif value == 0:
                            continue
                        else:
                            # Expression evaluation (simplified)
                            new_doc[field] = value
                    projected.append(new_doc)
                data = projected
        
        return MockCursor(data)
    
    def _execute_pipeline(self, data, pipeline):
        """Execute a sub-pipeline (for $facet)"""
        cursor = MockCursor(data)
        temp_collection = MockCollection("temp", self.db)
        temp_collection.data = data
        result_cursor = temp_collection.aggregate(pipeline)
        return result_cursor.data
    
    def _apply_accumulator(self, expr, docs):
        if isinstance(expr, dict):
            if "$sum" in expr:
                field_or_val = expr["$sum"]
                if isinstance(field_or_val, int):
                    return field_or_val * len(docs)
                elif isinstance(field_or_val, str) and field_or_val.startswith("$"):
                    field_path = field_or_val[1:].split(".")
                    total = 0
                    for doc in docs:
                        val = doc
                        for part in field_path:
                            val = val.get(part, 0) if isinstance(val, dict) else 0
                        total += val or 0
                    return total
                elif isinstance(field_or_val, dict):
                    total = 0
                    for doc in docs:
                        val = self._evaluate_expression(field_or_val, doc)
                        if isinstance(val, (int, float)):
                            total += val
                    return total
            elif "$max" in expr:
                field = expr["$max"][1:] if expr["$max"].startswith("$") else expr["$max"]
                values = [doc.get(field) for doc in docs if doc.get(field) is not None]
                return max(values, default=0) if values else 0
            elif "$avg" in expr:
                field = expr["$avg"][1:] if expr["$avg"].startswith("$") else expr["$avg"]
                values = [doc.get(field, 0) for doc in docs if doc.get(field) is not None]
                return sum(values) / len(values) if values else 0
            elif "$push" in expr:
                field = expr["$push"][1:] if isinstance(expr["$push"], str) and expr["$push"].startswith("$") else expr["$push"]
                return [doc.get(field) for doc in docs]
        return None
    
    def _evaluate_expression(self, expr, doc):
        if isinstance(expr, str):
            if expr.startswith("$"):
                field_path = expr[1:].split(".")
                val = doc
                for part in field_path:
                    val = val.get(part) if isinstance(val, dict) else None
                return val
            return expr
        
        if not isinstance(expr, dict):
            return expr
        
        if "$dateToString" in expr:
            date_expr = expr["$dateToString"]
            fmt = date_expr.get("format", "%Y-%m-%d")
            date_val = self._evaluate_expression(date_expr.get("date"), doc)
            
            if date_val is None:
                return None
            
            try:
                if isinstance(date_val, (int, float)):
                    from datetime import datetime
                    dt = datetime.fromtimestamp(date_val / 1000)
                    py_format = fmt.replace("%Y", "{year:04d}").replace("%m", "{month:02d}").replace("%d", "{day:02d}")
                    return py_format.format(year=dt.year, month=dt.month, day=dt.day)
                return str(date_val)
            except Exception:
                return None
        
        if "$toDate" in expr:
            val = self._evaluate_expression(expr["$toDate"], doc)
            return val
        
        if "$add" in expr:
            operands = expr["$add"]
            total = 0
            for operand in operands:
                val = self._evaluate_expression(operand, doc)
                if isinstance(val, (int, float)):
                    total += val
            return total
        
        if "$ifNull" in expr:
            operands = expr["$ifNull"]
            if len(operands) >= 2:
                val = self._evaluate_expression(operands[0], doc)
                return val if val is not None else self._evaluate_expression(operands[1], doc)
            return None
        
        return expr


class MockDatabase:
    def __init__(self):
        self.collections = {}
        data_dir = os.getenv("DATA_DIR", "/data")
        if not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)
        self.file_path = os.path.join(data_dir, "mock_db_data.json")
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
                                except Exception:
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
