# WakeOnWeb

[![Status](https://img.shields.io/badge/status-active-brightgreen)](https://github.com/seuusuario/wakeonweb)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Automate Wake-on-LAN in your Linux homelab, remotely power on network devices effortlessly.

---

## 💡 Project

**WakeOnWeb** is a Node.js app to **wake up computers remotely via Wake-on-LAN** through a web interface.  
It also provides a **systemd service** to run automatically as a daemon on Linux.

![](https://i.imgur.com/CUqoxzv.png)

---

## ⚙️ Features

- Web interface to send **Wake-on-LAN packets**  
- **systemd service** to run Node.js server as a daemon  
- Auto-detects local IP and shows access URL  
- Works on Linux (Ubuntu/Debian recommended)  
- Auto-creates or updates systemd service even if moved  
- Dependency checks (`node`, `npm`)
---

## 🚀 Installation (Linux)

### 1️⃣ Clone the repo

```bash
git clone https://github.com/Gomaink/wakeonweb.git
cd wakeonweb
```

### 2️⃣ Clone the repo

```bash
./install.sh
```

#### The script will:

**1.** Check/install node and npm

**2.** Run npm install
  
**3.** Detect script path and create/update systemd service
  
**4.** Restart service if it exists

**5.** Display access URL `http://IP:8093`

### 3️⃣ Access web interface

Open in browser:

```
http://IP:8093
```

### 🔄 Service Update

To update or move the project:
```
./install.sh
```

### ⚠️ Common Issues

- `server.js` not found → ensure repo is downloaded correctly
- Existing service points to a different path → auto-updated by script
- Firewall blocking port 8093 → allow it in Linux

### 📌 Notes

- Wake-on-LAN may not work on all PCs depending on BIOS/network card settings
- Future features: device monitoring, Wake-on-LAN logs
