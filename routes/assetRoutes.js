const express = require("express");
const auth = require("../middleware/auth");
const {
  createAsset,
  getAllAssets,
  getAssetByLinkId,
  updateAssetByLinkId,
  deleteAssetByLinkId,
  getAllUnreachableAssets,
  getAssetCount,
  getRunningAssetsCount,
  getUnreachableAssetsCount,
  getAnalytics,
  updateAssetStatus,
} = require("../controller/assetController");

const router = express.Router();

// Asset Routes
router.post("/addAsset", auth, createAsset);
router.get("/count", auth, getAssetCount);
router.get("/", auth, getAllAssets);
router.get("/unreachableAssets", auth, getAllUnreachableAssets);
router.post("/updateStatus", auth, updateAssetStatus);
router.get("/runningAssets", auth, getRunningAssetsCount);
router.get("/unreachableAssets/count", auth, getUnreachableAssetsCount);
router.get("/analytics", auth, getAnalytics);
router.get("/:linkId", auth, getAssetByLinkId);
router.put("/:linkId", auth, updateAssetByLinkId);
router.delete("/:linkId", auth, deleteAssetByLinkId);

module.exports = router;