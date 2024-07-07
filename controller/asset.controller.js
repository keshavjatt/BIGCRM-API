const ping = require("ping");
const Asset = require("../model/asset.model.js");
const Ticket = require("../model/ticket.model.js");
const sendEmail = require("../utils/mailer.utils.js");
const moment = require("moment");
const os = require("os-utils");

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
const generateTicketNo = async () => {
  const latestTicket = await Ticket.findOne().sort({ SrNo: -1 }).exec();
  const newSrNo = latestTicket ? latestTicket.SrNo + 1 : 1;
  const ticketNo = `SR#${newSrNo.toString().padStart(3, "0")}`;
  return { newSrNo, ticketNo };
};

// Format date helper function
const formatDate = (date) => {
  return moment(date).format("DD-MM-YYYY HH:mm");
};

const MonitoringAssets = async (req, res) => {
  try {
    const projectName = req.user.projectName;
    const filter =
      req.user.userRole === "Admin"
        ? { status: "Active" }
        : { status: "Active", projectName: req.user.projectName };
    const assets = await Asset.find(filter);

    const pingPromises = assets.map((asset) => pingIPAddress(asset.ipAddress1));
    const pingResults = await Promise.all(pingPromises);

    const unreachableAssets = [];
    const updatePromises = [];
    const emailPromises = [];
    const ticketPromises = [];

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const isReachable = pingResults[i];

      const existingTicket = await Ticket.findOne({ LinkId: asset.linkId });

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

        let ticketStatus = "Pending";
        let ticketNo = null;

        if (existingTicket) {
          ticketStatus = existingTicket.Status;
          existingTicket.Down_Timer = downtime;
          await existingTicket.save();
          ticketNo = existingTicket.TicketNo;
        } else {
          const { newSrNo, ticketNo: newTicketNo } = await generateTicketNo();
          ticketNo = newTicketNo;
          const ticket = new Ticket({
            SrNo: newSrNo,
            TicketNo: ticketNo,
            SiteName: asset.siteName,
            LinkId: asset.linkId,
            Down_Timer: downtime,
            Up_Timer: "00:00:00", // Initialize Up_Timer when ticket is first created
            AssignedBy: "N/A",
            LastUpdateBy: "N/A",
            LastUpdateDate: null,
            projectName: asset.projectName,
            Status: ticketStatus,
          });
          const savedTicket = await ticket.save();
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

        const currentTime = new Date();
        const lastEmailSentTime = asset.lastEmailSentTime
          ? new Date(asset.lastEmailSentTime)
          : null;
        const emailTimeDiff = lastEmailSentTime
          ? (currentTime - lastEmailSentTime) / 3600000
          : null;

        if (
          asset.emailNotifications && // Yaha emailNotifications status check karna
          (!lastEmailSentTime || emailTimeDiff >= 1)
        ) {
          const emailList = asset.emailId.split(", ");
          const subject = `Alert: Asset with linkId ${asset.linkId} is unreachable`;

          emailList.forEach(async (email) => {
            try {
              await sendEmail(
                email,
                subject,
                asset.linkId,
                asset.ipAddress1,
                ticketNo,
                asset.projectName
              );
            } catch (error) {
              console.error("Error sending email:", error);
            }
          });

          asset.lastEmailSentTime = new Date();
        }

        asset.lastDownTime = new Date();
        updatePromises.push(asset.save());
      } else {
        // Asset is reachable
        if (asset.firstDownTime && existingTicket) {
          const firstDownTime = new Date(asset.firstDownTime);
          const currentTime = new Date();
          const diff = currentTime - firstDownTime;
          const hours = Math.floor(diff / 3600000);
          const minutes = Math.floor((diff % 3600000) / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          const downtime = `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

          existingTicket.Up_Timer = downtime;
          await existingTicket.save();
        }

        asset.firstDownTime = null;
        updatePromises.push(asset.save());
      }
    }

    await Promise.all(updatePromises);
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
      projectName,
    } = req.body;

    // Check if any field is empty
    if (
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

    // Fetch the highest linkId and generate a new one
    const highestAsset = await Asset.findOne().sort({ linkId: -1 }).exec();
    let newLinkId = 24001; // Default value if no assets found
    if (highestAsset) {
      newLinkId = parseInt(highestAsset.linkId) + 1;
    }

    const asset = new Asset({
      linkId: newLinkId.toString(),
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
      projectName,
    });

    await asset.save();
    res.status(201).json({ message: "Asset Added successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getAllAssets = async (req, res) => {
  try {
    const filter =
      req.user.userRole === "Admin"
        ? {}
        : { projectName: req.user.projectName };
    const assets = await Asset.find(filter);
    res.json(assets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getAssetByLinkId = async (req, res) => {
  try {
    let query = { linkId: req.params.linkId };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const asset = await Asset.findOne(query);

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
    let query = { linkId: req.params.linkId };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const asset = await Asset.findOneAndUpdate(
      query, // Filter by linkId and conditionally projectName
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
    let query = { linkId: req.params.linkId };

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const asset = await Asset.findOneAndDelete(query);

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
    let query = {};

    // Agar user ka role 'Executive' hai to projectName ke according filter karein
    if (req.user.userRole !== "Admin") {
      query.projectName = req.user.projectName;
    }

    const count = await Asset.countDocuments(query); // Filter by query
    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

const getRunningAssetsCount = async (req, res) => {
  try {
    const filter =
      req.user.userRole === "Admin"
        ? { status: "Active" }
        : { status: "Active", projectName: req.user.projectName };
    const assets = await Asset.find(filter);

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
    const filter =
      req.user.userRole === "Admin"
        ? { status: "Active" }
        : { status: "Active", projectName: req.user.projectName };
    const assets = await Asset.find(filter);

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

const pingIPAddressForPackets = async (ipAddress) => {
  try {
    let successCount = 0;
    const pingPromises = [];
    for (let i = 0; i < 100; i++) {
      pingPromises.push(
        ping.promise.probe(ipAddress).then((res) => {
          if (res.alive) {
            successCount++;
          }
        })
      );
    }
    await Promise.all(pingPromises);
    return successCount;
  } catch (error) {
    console.error("Error while pinging IP for packets:", error);
    return 0;
  }
};

const getAnalytics = async (req, res) => {
  try {
    const filter =
      req.user.userRole === "Admin"
        ? { status: "Active" }
        : { status: "Active", projectName: req.user.projectName };
    const assets = await Asset.find(filter);

    // Parallelize ping requests
    const pingPromises = assets.map(async (asset) => {
      const pingResult = await ping.promise.probe(asset.ipAddress1);
      const successCount = await pingIPAddressForPackets(asset.ipAddress1);
      const performance = pingResult.alive
        ? `${pingResult.time} ms`
        : "Request timed out.";

      const liveStatus = pingResult.alive ? "UP" : "DOWN";
      const packetLossRate = `${((100 - successCount) / 100) * 100}%`;

      return {
        linkId: asset.linkId,
        siteName: asset.siteName,
        ipAddress1: asset.ipAddress1,
        liveStatus: liveStatus,
        Performance: performance,
        Packet: packetLossRate,
        connectivity: asset.connectivity,
      };
    });

    const analyticsData = await Promise.all(pingPromises);

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

const updateAllEmailNotifications = async (req, res) => {
  try {
    const { emailNotifications } = req.body;

    const result = await Asset.updateMany({}, { emailNotifications });

    // Retrieve all assets after the update
    const assets = await Asset.find({});

    res.json({
      message: "Email notifications status updated successfully for all assets",
      assets,
    });
  } catch (error) {
    console.error(
      "Error while updating email notifications status for all assets:",
      error
    );
    res
      .status(500)
      .send("Error while updating email notifications status for all assets");
  }
};

const getCPUUsage = async (req, res) => {
  os.cpuUsage(function (v) {
    res.json({ cpuUsage: (v * 100).toFixed(2) + "%" });
  });
};

const getRAMUsage = async (req, res) => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usedMemoryPercentage = ((usedMemory / totalMemory) * 100).toFixed(2);

  res.json({ ramUsage: usedMemoryPercentage + "%" });
};

module.exports = {
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
};