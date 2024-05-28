const express = require("express");
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
router.post("/addAsset", createAsset);
router.get("/count", getAssetCount);
router.get("/", getAllAssets);
router.get("/unreachableAssets", getAllUnreachableAssets);
router.post("/updateStatus", updateAssetStatus);
router.get("/runningAssets", getRunningAssetsCount);
router.get("/unreachableAssets/count", getUnreachableAssetsCount);
router.get("/analytics", getAnalytics);
router.get("/:linkId", getAssetByLinkId);
router.put("/:linkId", updateAssetByLinkId);
router.delete("/:linkId", deleteAssetByLinkId);

module.exports = router;