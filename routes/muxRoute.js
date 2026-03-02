const express = require("express");
const router = express.Router();
const video = require("../utils/mux"); // lowercase

router.post("/create-upload", async (req, res) => {
  try {
    const upload = await video.uploads.create({
      new_asset_settings: { playback_policy: ["public"] },
      cors_origin: "*",
    });

    res.json({
      uploadUrl: upload.url,
      uploadId: upload.id,
    });
  } catch (error) {
    console.error("Mux upload creation error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to create Mux upload" });
  }
});

router.get("/get-playback/:uploadId", async (req, res) => {
  try {
    const { uploadId } = req.params;
    const upload = await video.uploads.retrieve(uploadId);
    const assetId = upload.asset_id;

    if (!assetId) {
      return res.status(404).json({ error: "Asset not ready yet" });
    }

    const asset = await video.assets.retrieve(assetId);
    const playbackId = asset.playback_ids?.[0]?.id;

    res.json({ assetId, playbackId });
  } catch (error) {
    console.error("Error fetching playback ID:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
