async function loadDevices() {
  const res = await fetch("/api/devices");
  const devices = await res.json();

  const tbody = document.getElementById("devices");
  tbody.innerHTML = "";

  if (devices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum dispositivo adicionado ainda.</td></tr>`;
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

async function wakeDevice(id) {
  const res = await fetch(`/api/wake/${id}`, { method: "POST" });
  const text = await res.text();
  alert(text);
  loadDevices();
}

async function removeDevice(id) {
  if (!confirm("Tem certeza que deseja remover este dispositivo?")) return;
  await fetch(`/api/devices/${id}`, { method: "DELETE" });
  loadDevices();
}

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

loadDevices();
