const express = require("express");
const fs = require("fs");
const os = require("os");
const dgram = require("dgram");

const app = express();
app.use(express.json());
app.use(express.static("src/web"));

const DEVICES_FILE = "src/devices.json";
const LOG_DIR = "logs";
const LOG_FILE = `${LOG_DIR}/wol.log`;

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

// --- Load devices ---
function loadDevices() {
  try {
    if (!fs.existsSync(DEVICES_FILE)) {
      console.log("📄 devices.json not found, creating...");
      fs.writeFileSync(DEVICES_FILE, "[]", "utf-8");
      return [];
    }

    const data = fs.readFileSync(DEVICES_FILE, "utf-8").trim();
    if (!data) {
      console.log("⚠️ devices.json empty, starting empty list...");
      return [];
    }

    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Error reading devices.json, recreating file:", err);
    fs.writeFileSync(DEVICES_FILE, "[]", "utf-8");
    return [];
  }
}

let devices = loadDevices();

// --- WOL functions ---
function normalizeMac(mac) {
  return mac.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
}

function macToBuffer(mac) {
  const cleaned = normalizeMac(mac);
  if (cleaned.length !== 12) throw new Error("Invalid MAC address");
  const buf = Buffer.alloc(6);
  for (let i = 0; i < 6; i++) buf[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  return buf;
}

function createMagicPacket(mac) {
  const macBuf = macToBuffer(mac);
  const packet = Buffer.alloc(6 + 16 * 6);
  for (let i = 0; i < 6; i++) packet[i] = 0xff;
  for (let i = 0; i < 16; i++) macBuf.copy(packet, 6 + i * 6);
  return packet;
}

function ipToInt(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function intToIp(int) {
  return [(int >>> 24) & 0xff, (int >>> 16) & 0xff, (int >>> 8) & 0xff, int & 0xff].join(".");
}

function calculateBroadcast(ip, netmask) {
  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(netmask);
  const bcast = (ipInt & maskInt) | (~maskInt >>> 0);
  return intToIp(bcast);
}

async function sendMagicPacketDynamic(mac, port = 9) {
  const packet = createMagicPacket(mac);
  const socket = dgram.createSocket("udp4");
  socket.bind(() => socket.setBroadcast(true));

  const iface = Object.values(os.networkInterfaces())
    .flat()
    .find(i => i.family === "IPv4" && !i.internal && i.mac !== "00:00:00:00:00:00");

  if (!iface) throw new Error("No active network interface found.");

  const broadcast = calculateBroadcast(iface.address, iface.netmask);

  await new Promise(resolve => {
    socket.send(packet, 0, packet.length, port, broadcast, () => resolve());
  });

  socket.close();
}

// --- Logging WOL ---
function formatTimestamp(date) {
  const pad = n => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ` +
         `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function logWOL(device, success) {
  const timestamp = formatTimestamp(new Date());
  const line = `${timestamp} - ${device.name} (${device.mac}) - ${success ? "SUCCESS" : "FAIL"}\n`;
  fs.appendFileSync(LOG_FILE, line);
}


// --- Routes ---
app.get("/api/devices", (_, res) => res.json(devices));

app.post("/api/wake/:id", async (req, res) => {
  const device = devices.find(d => d.id == req.params.id);
  if (!device) return res.status(404).send("Device not found");

  try {
    await sendMagicPacketDynamic(device.mac);
    logWOL(device, true);
    res.send(`Magic Packet sent to ${device.name} via interface ${device.mac}`);
  } catch (err) {
    logWOL(device, false);
    console.error("Error sending WOL:", err);
    res.status(500).send("Error sending Magic Packet");
  }
});

app.post("/api/devices", (req, res) => {
  const { name, mac, ip } = req.body;
  if (!name || !mac) return res.status(400).send("Name and MAC address are required.");

  const newDevice = { id: Date.now(), name, mac, ip: ip || "" };
  devices.push(newDevice);
  fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
  res.json(newDevice);
});

app.delete("/api/devices/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = devices.findIndex((d) => d.id === id);
  if (index === -1) return res.status(404).send("Device not found");

  devices.splice(index, 1);
  fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
  res.sendStatus(204);
});

// Optional: get WOL logs
app.get("/api/logs", (_, res) => {
  if (!fs.existsSync(LOG_FILE)) return res.json([]);
  const logs = fs.readFileSync(LOG_FILE, "utf-8").split("\n").filter(Boolean);
  res.json(logs);
});

// --- Server ---
const port = 8093;
app.listen(port, () => {
  const iface = Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i.family === "IPv4" && !i.internal);
  const address = iface?.address || "localhost";
  console.log(`\n✅ WakeOnWeb running on http://${address}:${port}\n`);
});
