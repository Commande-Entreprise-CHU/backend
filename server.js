const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// -------- ARCHIVO DE PACIENTES ----------
const DATA_PATH = "./patients.json";

// Si no existe, lo crea vacío
if (!fs.existsSync(DATA_PATH)) {
  fs.writeJsonSync(DATA_PATH, []);
}

/* ============================
    🟢 CREAR NUEVO PACIENTE
   ============================ */
app.post("/api/patient", async (req, res) => {
  try {
    const data = await fs.readJson(DATA_PATH);
    const form = req.body;

    // 1️⃣ Verificar duplicados por name + prenom + dob
    const existing = data.find(
      (p) =>
        p.name?.toLowerCase() === form.name?.toLowerCase() &&
        p.prenom?.toLowerCase() === form.prenom?.toLowerCase() &&
        p.dob === form.dob
    );

    if (existing) {
      return res.json({
        success: false,
        duplicate: true,
        patient: existing,
        message: "Le patient existe déjà.",
      });
    }

    // 2️⃣ Crear un paciente COMPLETO
    const newPatient = {
      id: uuidv4(),
      name: form.name,
      prenom: form.prenom,
      ipp: form.ipp || null,
      dob: form.dob,
      sexe: form.sexe,
      preConsult: form,
      preOp: null,
      postOp3: null,
      postOp6: null,
    };

    // 3️⃣ Guardarlo
    data.push(newPatient);
    await fs.writeJson(DATA_PATH, data, { spaces: 2 });

    res.json({
      success: true,
      duplicate: false,
      patient: newPatient,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la sauvegarde.",
    });
  }
});



/* ============================
    🔵 BUSCAR PACIENTES
   ============================ */
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  const data = await fs.readJson(DATA_PATH);

  if (!q) return res.json(data);

  const filtered = data.filter((p) => {
    const haystack = [
      p.name,
      p.prenom,
      p.ipp,
      p.sexe
    ].join(" ").toLowerCase();

    return haystack.includes(q);
  });

  res.json(filtered);
});


/* ============================
    🟣 OBTENER UN PACIENTE
   ============================ */
app.get("/api/patient/:id", async (req, res) => {
  const data = await fs.readJson(DATA_PATH);

  const patient = data.find((p) => p.id === req.params.id);

  if (!patient) {
    return res.status(404).json({ message: "Not found" });
  }

  res.json(patient);
});

/* ============================
   🟣 ACTUALIZAR UNA SECCIÓN
   ============================ */
app.put("/api/patient/:id", async (req, res) => {
  try {
    const data = await fs.readJson(DATA_PATH);
    const patient = data.find((p) => p.id === req.params.id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient introuvable"
      });
    }

    const { section, values } = req.body;

    // validar que la sección exista
    if (!["preConsult", "preOp", "postOp3", "postOp6"].includes(section)) {
      return res.status(400).json({
        success: false,
        message: "Section invalide"
      });
    }

    // actualizar solo la sección
    patient[section] = values;

    await fs.writeJson(DATA_PATH, data, { spaces: 2 });

    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Erreur interne"
    });
  }
});



/* ============================
    🟠 GUARDAR FORMULARIOS
   ============================ */

app.put("/api/patient/:id/preconsult", async (req, res) => {
  const data = await fs.readJson(DATA_PATH);
  const index = data.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: "Paciente no encontrado" });
  }

  data[index].preConsult = req.body;

  await fs.writeJson(DATA_PATH, data, { spaces: 2 });

  res.json({ success: true, data: data[index] });
});


// Pre-operatorio
app.put("/api/patient/:id/preop", async (req, res) => {
  const data = await fs.readJson(DATA_PATH);
  const idx = data.findIndex((p) => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ message: "Not found" });

  data[idx].preOp = req.body;

  await fs.writeJson(DATA_PATH, data, { spaces: 2 });

  res.json({ success: true });
});

// Post-op 3 meses
app.put("/api/patient/:id/postop3", async (req, res) => {
  const data = await fs.readJson(DATA_PATH);
  const idx = data.findIndex((p) => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ message: "Not found" });

  data[idx].postOp3 = req.body;

  await fs.writeJson(DATA_PATH, data, { spaces: 2 });

  res.json({ success: true });
});

// Post-op 6 meses
app.put("/api/patient/:id/postop6", async (req, res) => {
  const data = await fs.readJson(DATA_PATH);
  const idx = data.findIndex((p) => p.id === req.params.id);

  if (idx === -1) return res.status(404).json({ message: "Not found" });

  data[idx].postOp6 = req.body;

  await fs.writeJson(DATA_PATH, data, { spaces: 2 });

  res.json({ success: true });
});

/* ============================
    SERVIDOR
   ============================ */
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Backend funcionando en http://localhost:${PORT}`));
