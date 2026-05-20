from fastapi import FastAPI
from recommender import hybrid_recommendation

app = FastAPI()

@app.post("/recommend")
async def recommend(data: dict):
    try:

        interactions = data.get("interactions", [])
        contents = data.get("contents", [])
        user_id = data.get("userId")

        # ✅ COLD START (no interactions)
        if not interactions:
            return {
                "recommended": [str(c.get("_id")) for c in contents[:20]]
            }

        # ✅ SAFE CONVERSION (important for pandas)
        for i in interactions:
            i["content"] = str(i.get("content"))
            i["user"] = str(i.get("user"))

        # ✅ ALSO FIX CONTENT IDS
        for c in contents:
            c["_id"] = str(c.get("_id"))

        # ✅ BUILD FINAL DATA OBJECT (VERY IMPORTANT)
        payload = {
            "interactions": interactions,
            "contents": contents,
            "userId": str(user_id),
        }

        # ✅ CORRECT FUNCTION CALL (ONLY ONE ARGUMENT)
        result = hybrid_recommendation(payload)

        return {"recommended": result}

    except Exception as e:
        print("🔥 PYTHON ERROR:", str(e))
        return {"recommended": []}  # NEVER CRASH
