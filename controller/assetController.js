const ping = require("ping");
const Asset = require("../model/assetModel");
const Ticket = require("../model/ticketModel.js");
const sendEmail = require("../utils/mailer.js");
const moment = require("moment");

const pingIPAddress = async (ipAddress) => {
  try {
    const res = await ping.promise.probe(ipAddress);
    return res.alive ? ipAddress : null;
  } catch (error) {
    console.error("Error while pinging IP:", error);
    return null;
  }
};

// Helper function to generate ticket number
let currentSrNo = 1;
const generateTicketNo = () => {
  const ticketNo = `SR#${currentSrNo.toString().padStart(3, "0")}`;
  currentSrNo++;
  return ticketNo;
};

// Format date helper function
const formatDate = (date) => {
  return moment(date).format("DD-MM-YYYY hh:mm A");
};

// getAllUnreachableAssets function ko modify karte hain
const getAllUnreachableAssets = async (req, res) => {
  try {
    const projectName = req.user.projectName;
    const assets = await Asset.find({ status: "Active", projectName });

    const pingPromises = assets.map((asset) => pingIPAddress(asset.ipAddress1));
    const pingResults = await Promise.all(pingPromises);

    const unreachableAssets = [];
    const updatePromises = [];
    const emailPromises = [];
    const ticketPromises = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const isReachable = pingResults[i];

      if (!isReachable) {
        let downtime = "00:00:00";

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
          asset.firstDownTime = new Date();
        }

        const existingTicket = await Ticket.findOne({ LinkId: asset.linkId });
        let ticketStatus = "Pending";
        let ticketNo = null;

        if (existingTicket) {
          ticketStatus = existingTicket.Status;
          existingTicket.Down_Timer = downtime;
          await existingTicket.save();
          ticketNo = existingTicket.TicketNo;
        } else {
          const ticket = new Ticket({
            SrNo: currentSrNo,
            TicketNo: generateTicketNo(),
            SiteName: asset.siteName,
            LinkId: asset.linkId,
            Down_Timer: downtime,
            AssignedBy: "N/A",
            LastUpdateBy: "N/A",
            LastUpdateDate: null,
            projectName: projectName, // Pass projectName from asset
            Status: ticketStatus,
          });
          const savedTicket = await ticket.save();
          ticketNo = savedTicket.TicketNo;
          ticketPromises.push(savedTicket);
        }

        unreachableAssets.push({
          linkId: asset.linkId,
          siteName: asset.siteName,
          ipAddress1: asset.ipAddress1,
          DownFor: downtime,
          LiveStatus: "DOWN",
          connectivity: asset.connectivity,
          TicketStatus: ticketStatus,
        });

        asset.lastDownTime = new Date();
        updatePromises.push(asset.save());

        const emailList = asset.emailId.split(", ");
        const subject = `Alert: Asset with linkId ${asset.linkId} is unreachable`;

        emailList.forEach((email) => {
          emailPromises.push(
            sendEmail(email, subject, asset.linkId, asset.ipAddress1, ticketNo)
          );
        });
      }
    }

    await Promise.all(updatePromises);
    await Promise.all(emailPromises);
    await Promise.all(ticketPromises);

    const formattedTickets = unreachableAssets.map((ticket) => ({
      ...ticket,
      CreatedDate: formatDate(ticket.CreatedDate),
    }));

    res.json(formattedTickets);
  } catch (error) {
    console.error("Error while fetching unreachable assets:", error);
    res.status(500).send("Error while fetching unreachable assets");
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
      projectName
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
      !emailId ||
      !projectName
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
    const assets = await Asset.find({ projectName: req.user.projectName }); // Filter by projectName
    res.json(assets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getAssetByLinkId = async (req, res) => {
  try {
    const asset = await Asset.findOne({ linkId: req.params.linkId, projectName: req.user.projectName });

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
      { linkId: req.params.linkId, projectName: req.user.projectName }, // Filter by linkId and projectName
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
    const asset = await Asset.findOneAndDelete({ linkId: req.params.linkId, projectName: req.user.projectName });

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
    const count = await Asset.countDocuments({ projectName: req.user.projectName }); // Filter by projectName
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getRunningAssetsCount = async (req, res) => {
  try {
    // Filter by projectName and status "Active"
    const assets = await Asset.find({ status: "Active", projectName: req.user.projectName });

    // Parallelize ping requests
    const pingPromises = assets.map((asset) =>
      ping.promise.probe(asset.ipAddress1)
    );
    const pingResults = await Promise.all(pingPromises);

    // Count the number of running assets
    const runningAssetsCount = pingResults.filter(
      (pingResult) => pingResult.alive
    ).length;

    res.json({ runningAssetsCount });
  } catch (error) {
    console.error("Error while counting running assets:", error);
    res.status(500).send("Server Error");
  }
};

const getUnreachableAssetsCount = async (req, res) => {
  try {
    // Filter by projectName and status "Active"
    const assets = await Asset.find({ status: "Active", projectName: req.user.projectName });

    // Parallelize ping requests
    const pingPromises = assets.map((asset) =>
      ping.promise.probe(asset.ipAddress1)
    );
    const pingResults = await Promise.all(pingPromises);

    // Count the number of unreachable assets
    const unreachableAssetsCount = pingResults.filter(
      (pingResult) => !pingResult.alive
    ).length;

    res.json({ unreachableAssetsCount });
  } catch (error) {
    console.error("Error while counting unreachable assets:", error);
    res.status(500).send("Server Error");
  }
};

const getAnalytics = async (req, res) => {
  try {
    // Filter by projectName and status "Active"
    const assets = await Asset.find({ status: "Active", projectName: req.user.projectName });

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