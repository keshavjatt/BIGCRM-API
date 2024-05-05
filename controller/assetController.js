const ping = require("ping");
const Asset = require("../model/assetModel");

const pingIPAddress = async (ipAddress) => {
  try {
    const res = await ping.promise.probe(ipAddress);
    return res.alive ? ipAddress : null;
  } catch (error) {
    console.error("Error while pinging IP:", error);
    return null;
  }
};

const getAllUnreachableAssets = async (req, res) => {
  try {
    const assets = await Asset.find();
    const unreachableAssets = [];

    for (const asset of assets) {
      const isReachable = await pingIPAddress(asset.ipAddress1);
      if (!isReachable) {
        unreachableAssets.push(asset);
      }
    }

    res.json(unreachableAssets);
  } catch (error) {
    console.error("Error while fetching unreachable assets:", error);
    res.status(500).send("Server Error");
  }
};

const createAsset = async (req, res) => {
  try {
    const {
      linkId,
      siteName,
      address,
      modelMake,
      serialNo,
      ipAddress1,
      ipAddress2,
      connectivity,
      linkBW,
      discoveryDate,
      emailId,
    } = req.body;

    // Check if any field is empty
    if (
      !linkId ||
      !siteName ||
      !address ||
      !modelMake ||
      !serialNo ||
      !ipAddress1 ||
      !ipAddress2 ||
      !connectivity ||
      !linkBW ||
      !discoveryDate ||
      !emailId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if linkId already exists
    const existingAsset = await Asset.findOne({ linkId });
    if (existingAsset) {
      return res.status(400).json({ message: "Link ID already exists" });
    }

    const asset = new Asset(req.body);
    await asset.save();
    res.status(201).json({ message: "Asset Added successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.find();
    res.json(assets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getAssetByLinkId = async (req, res) => {
  try {
    const asset = await Asset.findOne({ linkId: req.params.linkId });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json(asset);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const updateAssetByLinkId = async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { linkId: req.params.linkId },
      { $set: req.body },
      { new: true }
    );

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({ message: "Asset successfully updated", asset });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const deleteAssetByLinkId = async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({ linkId: req.params.linkId });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({ message: "Asset deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getAssetCount = async (req, res) => {
  try {
    const count = await Asset.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getRunningAssetsCount = async (req, res) => {
  try {
    const assets = await Asset.find();
    let runningAssetsCount = 0;

    for (const asset of assets) {
      const isRunning = await pingIPAddress(asset.ipAddress1);
      if (isRunning) {
        runningAssetsCount++;
      }
    }

    res.json({ runningAssetsCount });
  } catch (error) {
    console.error("Error while counting running assets:", error);
    res.status(500).send("Server Error");
  }
};

const getUnreachableAssetsCount = async (req, res) => {
  try {
    const assets = await Asset.find();
    let unreachableAssetsCount = 0;

    for (const asset of assets) {
      const isRunning = await pingIPAddress(asset.ipAddress1);
      if (!isRunning) {
        unreachableAssetsCount++;
      }
    }

    res.json({ unreachableAssetsCount });
  } catch (error) {
    console.error("Error while counting unreachable assets:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  createAsset,
  getAllAssets,
  getAssetByLinkId,
  updateAssetByLinkId,
  deleteAssetByLinkId,
  getAllUnreachableAssets,
  getAssetCount,
  getRunningAssetsCount,
  getUnreachableAssetsCount,
};