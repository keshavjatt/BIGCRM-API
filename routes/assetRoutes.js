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
} = require("../controller/assetController");

const router = express.Router();

// Routes for CRUD operations on assets
router.post("/addAsset", createAsset);
router.get("/count", getAssetCount);
router.get("/", getAllAssets);
router.get("/unreachableAssets", getAllUnreachableAssets);
router.get("/runningAssets", getRunningAssetsCount);
router.get("/unreachableAssets/count", getUnreachableAssetsCount);
router.get("/:linkId", getAssetByLinkId);
router.put("/:linkId", updateAssetByLinkId);
router.delete("/:linkId", deleteAssetByLinkId);

module.exports = router;