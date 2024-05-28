const ping = require("ping");
const Asset = require("../model/assetModel");
const sendEmail = require("../utils/mailer.js");

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
    const assets = await Asset.find({ status: "Active" }); // Fetch only 'Active' assets

    // Parallelize ping requests
    const pingPromises = assets.map((asset) => pingIPAddress(asset.ipAddress1));
    const pingResults = await Promise.all(pingPromises);

    const unreachableAssets = [];
    const updatePromises = [];
    const emailPromises = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const isReachable = pingResults[i];

      if (!isReachable) {
        // Calculate the downtime
        let downtime = "00:00:00"; // Initial value

        if (asset.firstDownTime) {
          const firstDownTime = new Date(asset.firstDownTime);
          const currentTime = new Date();
          const diff = currentTime - firstDownTime;
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          downtime = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        } else {
          // Set the firstDownTime if it's not already set
          asset.firstDownTime = new Date();
        }

        // Push the asset details with additional fields
        unreachableAssets.push({
          linkId: asset.linkId,
          siteName: asset.siteName,
          ipAddress1: asset.ipAddress1,
          DownFor: downtime,
          LiveStatus: "DOWN", // Hardcoded value
          connectivity: asset.connectivity,
          Status: "LINK DOWN", // Hardcoded value
        });

        // Update lastDownTime for the asset
        asset.lastDownTime = new Date();
        updatePromises.push(asset.save());

        // Send email notification
        const emailList = asset.emailId.split(", ");
        const subject = `Alert: Asset with linkId ${asset.linkId} is unreachable`;
        emailList.forEach((email) => {
          emailPromises.push(
            sendEmail(email, subject, asset.linkId, asset.ipAddress1)
          );
        });
      }
    }

    // Await all updates and email sends
    await Promise.all(updatePromises);
    await Promise.all(emailPromises);

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
    const assets = await Asset.find({ status: "Active" }); // Only find active assets

    // Parallelize ping requests
    const pingPromises = assets.map(asset => ping.promise.probe(asset.ipAddress1));
    const pingResults = await Promise.all(pingPromises);

    // Count the number of running assets
    const runningAssetsCount = pingResults.filter(pingResult => pingResult.alive).length;

    res.json({ runningAssetsCount });
  } catch (error) {
    console.error("Error while counting running assets:", error);
    res.status(500).send("Server Error");
  }
};

const getUnreachableAssetsCount = async (req, res) => {
  try {
    const assets = await Asset.find({ status: "Active" }); // Only find active assets

    // Parallelize ping requests
    const pingPromises = assets.map(asset => ping.promise.probe(asset.ipAddress1));
    const pingResults = await Promise.all(pingPromises);

    // Count the number of unreachable assets
    const unreachableAssetsCount = pingResults.filter(pingResult => !pingResult.alive).length;

    res.json({ unreachableAssetsCount });
  } catch (error) {
    console.error("Error while counting unreachable assets:", error);
    res.status(500).send("Server Error");
  }
};

const getAnalytics = async (req, res) => {
  try {
    const assets = await Asset.find({ status: "Active" }); // Only find active assets

    // Parallelize ping requests
    const pingPromises = assets.map((asset) =>
      ping.promise.probe(asset.ipAddress1)
    );
    const pingResults = await Promise.all(pingPromises);

    // Collect analytics data based on ping results
    const analyticsData = assets.map((asset, index) => {
      const pingResult = pingResults[index];
      const performance = pingResult.alive
        ? `${pingResult.time} ms`
        : "Request timed out.";

      const liveStatus = pingResult.alive ? "UP" : "DOWN";

      return {
        linkId: asset.linkId,
        siteName: asset.siteName,
        ipAddress1: asset.ipAddress1,
        liveStatus: liveStatus,
        Performance: performance,
        connectivity: asset.connectivity,
      };
    });

    res.json(analyticsData);
  } catch (error) {
    console.error("Error while fetching analytics data:", error);
    res.status(500).send("Server Error");
  }
};

const updateAssetStatus = async (req, res) => {
  try {
    const { linkId, status } = req.body;

    if (!linkId || !status) {
      return res
        .status(400)
        .json({ message: "Link ID and status are required" });
    }

    // Check if the status provided is valid
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided" });
    }

    const updatedAsset = await Asset.updateStatus(linkId, status);

    if (!updatedAsset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({
      message: "Asset status updated successfully",
      asset: updatedAsset,
    });
  } catch (error) {
    console.error("Error updating asset status:", error);
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
  getAnalytics,
  updateAssetStatus,
};