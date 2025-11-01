// --- Load Devices ---
async function loadDevices() {
  const res = await fetch("/api/devices");
  const devices = await res.json();
  const tbody = document.getElementById("devices");
  tbody.innerHTML = "";

  if (devices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No devices added yet.</td></tr>`;
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
  showToast(text, "success");
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
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted">No WOL logs yet.</td></tr>`;
    return;
  }

  logs.reverse().forEach(log => {
    const [timestampRaw, device, status] = log.split(" - ");
    const date = new Date(timestampRaw);
    const formattedTime = date.toLocaleString();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formattedTime}</td>
      <td>${device || "-"}</td>
      <td>${status || "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Theme Toggle ---
const body = document.getElementById("body");
const themeToggle = document.getElementById("themeToggle");

function setTheme(theme) {
  if (theme === "dark") {
    body.classList.add("dark");
    themeToggle.innerText = "☀️ Light Mode";
  } else {
    body.classList.remove("dark");
    themeToggle.innerText = "🌙 Dark Mode";
  }
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const current = body.classList.contains("dark") ? "dark" : "light";
  setTheme(current === "dark" ? "light" : "dark");
});

const savedTheme = localStorage.getItem("theme") || "light";
setTheme(savedTheme);

// --- Toast ---
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer");

  const toast = document.createElement("div");
  toast.className = "toast align-items-center text-white border-0"; // string correta
  toast.role = "alert";
  toast.ariaLive = "assertive";
  toast.ariaAtomic = "true";

  let bg = "#6c757d"; // default gray
  if (type === "success") bg = "#198754";
  if (type === "error") bg = "#dc3545";
  if (type === "warning") bg = "#ffc107";

  toast.style.backgroundColor = bg;

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}



// --- Initial Load ---
loadDevices();
loadLogs();
setInterval(() => {
  loadDevices();
  loadLogs();
}, 15000);
