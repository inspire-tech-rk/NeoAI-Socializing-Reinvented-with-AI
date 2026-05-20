import SavedCollection from "../models/SavedCollection.js";


/* ---------------- CREATE COLLECTION ---------------- */
export const createCollection = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json("Collection name required");

    const collection = await SavedCollection.create({
      user: req.user._id,
      name,
    });

    res.status(201).json(collection);
  } catch (err) {
    res.status(500).json("Failed to create collection");
  }
};

/* ---------------- GET MY COLLECTIONS ---------------- */
export const getMyCollections = async (req, res) => {
  const collections = await SavedCollection.find({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  res.json(collections);
};

/* ---------------- ADD POST TO COLLECTION ---------------- */
export const addPostToCollection = async (req, res) => {
  const { collectionId, postId } = req.params;

  const collection = await SavedCollection.findOne({
    _id: collectionId,
    user: req.user._id,
  });

  if (!collection) return res.status(404).json("Collection not found");

  if (!collection.posts.includes(postId)) {
    collection.posts.push(postId);
    await collection.save();
  }

  res.json({ success: true });
};

/* ---------------- REMOVE POST FROM COLLECTION ---------------- */
export const removePostFromCollection = async (req, res) => {
  const { collectionId, postId } = req.params;

  const collection = await SavedCollection.findOne({
    _id: collectionId,
    user: req.user._id,
  });

  if (!collection) return res.status(404).json("Collection not found");

  collection.posts.pull(postId);
  await collection.save();

  res.json({ success: true });
};

/* ---------------- GET COLLECTION WITH POSTS ---------------- */
export const getCollectionPosts = async (req, res) => {
  const collection = await SavedCollection.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate({
    path: "posts",
    populate: { path: "user", select: "username dp" },
  });

  if (!collection) return res.status(404).json("Collection not found");

  res.json(collection);
};

/* ---------------- DELETE COLLECTION ---------------- */
export const deleteCollection = async (req, res) => {
  const collection = await SavedCollection.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!collection) return res.status(404).json("Collection not found");

  res.json({ success: true });
};
