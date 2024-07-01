const express = require("express");
const auth = require("../middleware/auth.middleware");
const {
  createAsset,
  getAllAssets,
  getAssetByLinkId,
  updateAssetByLinkId,
  deleteAssetByLinkId,
  MonitoringAssets,
  getAssetCount,
  getRunningAssetsCount,
  getUnreachableAssetsCount,
  getAnalytics,
  updateAssetStatus,
  updateAllEmailNotifications,
  getCPUUsage,
  getRAMUsage,
} = require("../controller/asset.controller");

const router = express.Router();

// Asset Routes
router.post("/addAsset", auth, createAsset);
router.get("/count", auth, getAssetCount);
router.get("/", auth, getAllAssets);
router.get("/unreachableAssets", auth, MonitoringAssets);
router.post("/updateStatus", auth, updateAssetStatus);
router.get("/runningAssets", auth, getRunningAssetsCount);
router.get("/unreachableAssets/count", auth, getUnreachableAssetsCount);
router.get("/analytics", auth, getAnalytics);
router.get("/:linkId", auth, getAssetByLinkId);
router.delete("/:linkId", auth, deleteAssetByLinkId);
router.put("/:linkId", auth, updateAssetByLinkId);
router.post("/updateAllEmailNotifications", auth, updateAllEmailNotifications);
router.get("/cpu/usage", getCPUUsage);
router.get("/ram/usage", getRAMUsage);

module.exports = router;