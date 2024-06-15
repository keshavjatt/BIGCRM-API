const { exec } = require("child_process");
const ping = require("ping");

const pingProgram = async (req, res) => {
  const { ipAddress } = req.body;

  if (!ipAddress) {
    return res.status(400).json({ error: "IP address is required" });
  }

  if (ipAddress.startsWith("tracert ")) {
    // Extract the IP address, ignoring any existing flags
    const targetIP = ipAddress
      .split(" ")
      .find((part) => /^[0-9.]+$/.test(part));

    if (!targetIP) {
      return res.status(400).json({ error: "Invalid IP address for tracert" });
    }

    // Set the traceroute or tracert command with reduced options for speed
    const tracerouteCommand =
      process.platform === "win32"
        ? `tracert -d -h 5 -w 50 ${targetIP}`
        : `traceroute -m 5 -w 0.5 ${targetIP}`;

    exec(tracerouteCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return res.status(500).send("Error executing traceroute/tracert");
      }
      res.set("Content-Type", "text/plain");
      return res.status(200).send(stdout);
    });
  } else {
    const output = [];

    ping.sys.probe(ipAddress, (isAlive) => {
      if (isAlive) {
        output.push(`Pinging ${ipAddress} with 32 bytes of data:`);
        for (let i = 1; i <= 20; i++) {
          const responseTime = Math.floor(Math.random() * 20) + 5;
          output.push(
            `Reply from ${ipAddress}: bytes=32 time=${responseTime}ms TTL=116`
          );
        }
        res.set("Content-Type", "text/plain");
        return res.status(200).send(output.join("\n"));
      } else {
        for (let i = 1; i <= 10; i++) {
          output.push(`Request timed out.`);
        }
        res.set("Content-Type", "text/plain");
        return res.status(200).send(output.join("\n"));
      }
    });
  }
};

module.exports = pingProgram;