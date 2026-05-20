import pandas as pd
import numpy as np

# ---------------- MATRIX ----------------
def build_matrix(df):
    weights = {
        "like": 8,
        "comment": 6,
        "watch": 4,
        "view": 1,
    }

    df["score"] = df["type"].map(weights).fillna(0)

    df["watchScore"] = df.get("watchTime", 0) / 30
    df.loc[df.get("watchTime", 0) < 3, "watchScore"] = 0

    df["score"] += df["watchScore"] * 3
    df["score"] += df.get("repeatViews", 0) * 4

    matrix = df.pivot_table(
        index="user",
        columns="content",
        values="score",
        aggfunc="sum",
        fill_value=0,
    )

    return matrix


# ---------------- COLLAB ----------------
def collaborative_scores(matrix, user_id):
    if user_id not in matrix.index:
        return {}

    user_vector = matrix.loc[user_id]

    similarity = matrix.dot(user_vector) / (
        np.linalg.norm(matrix, axis=1) * np.linalg.norm(user_vector) + 1e-9
    )

    similar_users = similarity.sort_values(ascending=False).drop(user_id)

    scores = {}
    for other_user, sim_score in similar_users.items():
        for content, val in matrix.loc[other_user].items():
            if val > 0:
                scores[content] = scores.get(content, 0) + sim_score * val

    return scores


# ---------------- CONTENT SIM ----------------
def content_similarity(contents, user_history):
    scores = {}

    for content in contents:
        cid = str(content["_id"])
        cats = set(content.get("categories", []))

        total_score = 0
        for hist in user_history:
            hist_cats = set(hist.get("categories", []))
            if cats and hist_cats:
                intersection = len(cats & hist_cats)
                union = len(cats | hist_cats)
                total_score += intersection / union

        scores[cid] = total_score

    return scores


# ---------------- TRENDING ----------------
def trending_content(contents):
    scores = {}
    now = pd.Timestamp.now(tz="UTC")

    for c in contents:
        try:
            created = pd.to_datetime(c.get("createdAt"), utc=True)
            recency = max((now - created).total_seconds(), 1)

            score = (
                c.get("views", 0)
                + c.get("watchTime", 0)
                + len(c.get("likes", [])) * 2
            ) / recency

            scores[str(c["_id"])] = score
        except:
            continue

    return scores


# ---------------- FINAL HYBRID ----------------
def hybrid_recommendation(data):
    interactions = pd.DataFrame(data.get("interactions", []))
    contents = data.get("contents", [])
    user_id = data.get("userId")

    if interactions.empty:
        return [str(c["_id"]) for c in contents[:20]]

    matrix = build_matrix(interactions)
    collab = collaborative_scores(matrix, user_id)

    user_history = interactions[interactions["user"] == user_id]

    user_history_ids = user_history["content"].astype(str).unique()

    user_history_content = [
        c for c in contents if str(c["_id"]) in user_history_ids
    ]

    content_scores = content_similarity(contents, user_history_content)
    trend_scores = trending_content(contents)

    final_scores = {}
    all_ids = set([str(c["_id"]) for c in contents])

    for cid in all_ids:
        base_score = (
            0.4 * collab.get(cid, 0) +
            0.4 * content_scores.get(cid, 0) +
            0.2 * trend_scores.get(cid, 0)
        )

        # 🔥 NEW DYNAMIC BOOST
        user_content_data = user_history[user_history["content"].astype(str) == cid]

        watch_time = user_content_data["watchTime"].sum() if "watchTime" in user_content_data else 0
        repeat = user_content_data["repeatViews"].sum() if "repeatViews" in user_content_data else 0
        types = user_content_data["type"].tolist()

        boost = 0

        if "view" in types:
            boost += 2

        if watch_time > 10:
            boost += 5
        if watch_time > 25:
            boost += 8

        if repeat > 0:
            boost += 6

        if "comment" in types:
            boost += 6

        if "like" in types:
            boost += 10

        final_scores[cid] = base_score + boost

    sorted_content = sorted(
        final_scores.items(),
        key=lambda x: x[1],
        reverse=True
    )

    return [cid for cid, _ in sorted_content]
