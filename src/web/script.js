// --- Load Devices and Status ---
async function loadDevices() {
  const res = await fetch("/api/devices");
  const devices = await res.json();

  const tbody = document.getElementById("devices");
  tbody.innerHTML = "";

  if (devices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No devices added yet.</td></tr>`;
    return;
  }

  devices.forEach(device => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${device.name}</td>
      <td>${device.mac}</td>
      <td>${device.ip || "-"}</td>
      <td>
        <button class="btn btn-success btn-sm me-2" onclick="wakeDevice(${device.id})">Wake</button>
        <button class="btn btn-danger btn-sm" onclick="removeDevice(${device.id})">Remove</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Wake Device ---
async function wakeDevice(id) {
  const res = await fetch(`/api/wake/${id}`, { method: "POST" });
  const text = await res.text();
  alert(text);
  loadDevices();
  loadLogs();
}

// --- Remove Device ---
async function removeDevice(id) {
  if (!confirm("Are you sure you want to remove this device?")) return;
  await fetch(`/api/devices/${id}`, { method: "DELETE" });
  loadDevices();
}

// --- Add Device Form ---
document.getElementById("addForm").addEventListener("submit", async e => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const mac = document.getElementById("mac").value.trim();
  const ip = document.getElementById("ip").value.trim();

  await fetch("/api/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mac, ip })
  });

  e.target.reset();
  loadDevices();
});

// --- Load WOL Logs ---
async function loadLogs() {
  const res = await fetch("/api/logs");
  const logs = await res.json();

  const tbody = document.getElementById("logs");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="1" class="text-center text-muted">No WOL logs yet.</td></tr>`;
    return;
  }

  logs.forEach(log => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${log}</td>`;
    tbody.appendChild(tr);
  });
}


loadDevices();
loadLogs();

setInterval(() => {
  loadDevices();
  loadLogs();
}, 15000);
