import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cron from "node-cron";
import { createServer } from "http";
import { Server } from "socket.io";
import excelJS from "exceljs";

dotenv.config();
const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const JWT_SECRET = process.env.JWT_SECRET || "centrawork_super_secret_key";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
});

io.on("connection", (socket) => {
  console.log("🟢 Klien terhubung:", socket.id);
  socket.on("disconnect", () => console.log("🔴 Klien terputus:", socket.id));
});

const catatAudit = async (
  userId: string,
  aktor: string,
  aksi: string,
  detail: string,
) => {
  try {
    await prisma.auditLog.create({
      data: { user_id: userId, aktor, aksi, detail },
    });
  } catch (error) {
    console.error("Gagal mencatat audit log:", error);
  }
};

// ==========================================
// 1. ROUTE AUTENTIKASI & PASSWORD
// ==========================================
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const { nama_lengkap, email, password, role_id } = req.body;

    if (!password || password.length < 6)
      return res.status(400).json({ error: "Password minimal 6 karakter!" });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email sudah terdaftar!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await prisma.user.create({
      data: {
        nama_lengkap,
        email,
        password: hashedPassword,
        role_id: role_id || 6,
      },
    });

    let namaAktor = "Sistem / Guest";
    let aktorId = newUser.id;
    const token = req.header("Authorization")?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          id: string;
          nama_lengkap?: string;
          email?: string;
        };
        namaAktor = decoded.nama_lengkap || decoded.email || namaAktor;
        aktorId = decoded.id || aktorId;
      } catch {
        // Abaikan jika token tidak valid
      }
    }
    await catatAudit(
      aktorId,
      namaAktor,
      "TAMBAH PENGGUNA",
      `Mendaftarkan akun baru: ${nama_lengkap}`,
    );

    res.status(201).json({ message: "Registrasi berhasil!", user: newUser });
  } catch (error) {
    console.error("Eror Registrasi:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user) return res.status(404).json({ error: "Akun tidak ditemukan!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Password salah!" });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role.nama_role,
        nama_lengkap: user.nama_lengkap,
        level_akses: user.role.level_akses,
      },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
    await catatAudit(
      user.id,
      user.nama_lengkap,
      "LOGIN",
      "Pengguna melakukan login ke sistem.",
    );
    res.json({
      message: "Login sukses!",
      token,
      user: {
        id: user.id,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        role: user.role.nama_role,
        level_akses: user.role.level_akses,
        foto_profil: user.foto_profil,
      },
    });
  } catch (error) {
    console.error("Eror Login:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
});

const authenticate = (
  req: Request,
  res: Response,
  next: express.NextFunction,
): void => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Akses ditolak." });
    return;
  }
  try {
    res.locals.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    console.error("JWT Error:", error);
    res.status(400).json({ error: "Token tidak valid." });
  }
};

// ==========================================
// 2. DATA MASTER (ROLES & USERS)
// ==========================================
app.get("/api/roles", authenticate, async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { level_akses: "asc" },
    });
    res.json(roles);
  } catch (error) {
    console.error("Eror Tarik Roles:", error);
    res.status(500).json({ error: "Gagal menarik daftar divisi." });
  }
});

app.get("/api/users", authenticate, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama_lengkap: true,
        email: true,
        status_aktif: true,
        role: { select: { nama_role: true, level_akses: true } },
      },
      orderBy: { created_at: "desc" },
    });
    res.json(users);
  } catch (error) {
    console.error("Eror Tarik Users:", error);
    res.status(500).json({ error: "Gagal menarik daftar pengguna." });
  }
});

app.delete(
  "/api/users/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      if (res.locals.user.role === "Super HR")
        return res
          .status(403)
          .json({ error: "Super HR tidak memiliki akses hapus." });
      const targetUser = await prisma.user.findUnique({
        where: { id: req.params.id as string },
      });
      await prisma.user.delete({ where: { id: req.params.id as string } });
      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      const namaTarget = targetUser?.nama_lengkap || req.params.id;
      await catatAudit(
        res.locals.user.id,
        namaAktor,
        "HAPUS PENGGUNA",
        `Menghapus akun milik: ${namaTarget}`,
      );
      res.json({ message: "Pengguna berhasil dihapus." });
    } catch (error) {
      console.error("Eror Hapus User:", error);
      res.status(500).json({ error: "Gagal menghapus pengguna." });
    }
  },
);

// ==========================================
// 3. DASHBOARD, TUGAS & LAPORAN
// ==========================================
app.get("/api/dashboard", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = res.locals.user.id;
    const profileData = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    const taskData = await prisma.taskAssignment.findMany({
      where: { penerima_id: userId },
      include: { task: { select: { judul_tugas: true, jenis_tugas: true } } },
      orderBy: { diselesaikan_pada: "desc" },
    });
    res.json({ profile: profileData, tasks: taskData });
  } catch (error) {
    console.error("Eror Dashboard:", error);
    res.status(500).json({ error: "Gagal menarik data dashboard." });
  }
});

app.get("/api/tasks", authenticate, async (req: Request, res: Response) => {
  try {
    const userRole = res.locals.user.role;
    const userId = res.locals.user.id;
    let whereClause = {};
    if (userRole !== "Super Admin" && userRole !== "Super HR") {
      whereClause = { penerima_id: userId };
    }
    const taskData = await prisma.taskAssignment.findMany({
      where: whereClause,
      include: {
        task: {
          select: {
            id: true,
            judul_tugas: true,
            jenis_tugas: true,
            deskripsi: true,
            tenggat_waktu: true,
            pembuat: { select: { nama_lengkap: true } },
          },
        },
        penerima: { select: { id: true, nama_lengkap: true, role_id: true } },
      },
      orderBy: { diselesaikan_pada: "desc" },
    });
    res.json(taskData);
  } catch (error) {
    console.error("Eror Tarik Tugas:", error);
    res.status(500).json({ error: "Gagal menarik daftar tugas." });
  }
});

// PERBAIKAN: Menerima foto_bukti pada pembaruan tugas
app.patch(
  "/api/tasks/:id/status",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { status, laporan, foto_bukti } = req.body;
      const assignmentInfo = await prisma.taskAssignment.findUnique({
        where: { id: req.params.id as string },
        include: { task: true },
      });

      const updateData: {
        status?: string;
        diselesaikan_pada?: Date | null;
        laporan?: string | null;
        foto_bukti?: string | null;
      } = {};

      if (status !== undefined) {
        updateData.status = status;
        updateData.diselesaikan_pada = status === "Selesai" ? new Date() : null;
      }
      if (laporan !== undefined) updateData.laporan = laporan;
      if (foto_bukti !== undefined) updateData.foto_bukti = foto_bukti;

      const updatedTask = await prisma.taskAssignment.update({
        where: { id: req.params.id as string },
        data: updateData,
      });

      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      const judulTugas = assignmentInfo?.task?.judul_tugas || "Tugas";
      const pesanLog =
        status === "Selesai"
          ? `Menyelesaikan tugas: "${judulTugas}"`
          : status
            ? `Mengubah status tugas "${judulTugas}" menjadi ${status}`
            : `Menyimpan bukti/laporan pada tugas "${judulTugas}"`;

      await catatAudit(
        res.locals.user.id,
        namaAktor,
        status === "Selesai" ? "SELESAIKAN TUGAS" : "UBAH STATUS TUGAS",
        pesanLog,
      );
      io.emit("refresh_data");
      res.json({ message: "Status tugas diperbarui", task: updatedTask });
    } catch (error) {
      console.error("Eror Update Status:", error);
      res.status(500).json({ error: "Gagal memperbarui status tugas." });
    }
  },
);

app.post("/api/tasks", authenticate, async (req: Request, res: Response) => {
  try {
    const { judul_tugas, deskripsi, jenis_tugas, penerima_id, tenggat_waktu } =
      req.body;
    const pembuatId = res.locals.user.id;

    let deadline = null;
    if (tenggat_waktu) {
      const d = new Date(tenggat_waktu);
      d.setHours(23, 59, 59, 999);
      deadline = d;
    }

    const newTask = await prisma.task.create({
      data: {
        pembuat_id: pembuatId,
        judul_tugas,
        deskripsi,
        jenis_tugas,
        tenggat_waktu: deadline,
      },
    });

    let penerimaArray: string[] = [];
    if (jenis_tugas === "Mandiri") {
      penerimaArray = [pembuatId];
    } else {
      if (Array.isArray(penerima_id)) {
        penerimaArray = penerima_id;
      } else if (penerima_id) {
        penerimaArray = [penerima_id];
      }
    }

    const assignments = penerimaArray.map((id) => ({
      task_id: newTask.id,
      penerima_id: id,
      status: "Pending",
    }));
    await prisma.taskAssignment.createMany({ data: assignments });

    const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
    await catatAudit(
      pembuatId,
      namaAktor,
      "BUAT TUGAS BARU",
      `Judul: "${judul_tugas}" ditugaskan ke ${penerimaArray.length} orang.`,
    );
    io.emit("refresh_data");
    res.status(201).json({ message: "Tugas berhasil dibuat!" });
  } catch (error) {
    console.error("Eror Buat Tugas:", error);
    res.status(500).json({ error: "Gagal membuat tugas." });
  }
});

app.get("/api/reports", authenticate, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { status_aktif: true },
      select: {
        id: true,
        nama_lengkap: true,
        role_id: true,
        role: { select: { nama_role: true } },
      },
    });
    const assignments = await prisma.taskAssignment.findMany({
      include: { task: { select: { poin: true } } },
    });
    const stats = users.map((user) => {
      const userTasks = assignments.filter((a) => a.penerima_id === user.id);
      const totalTugas = userTasks.length;

      const selesai = userTasks.filter((a) => a.status === "Selesai");
      const pending = userTasks.filter((a) => a.status === "Pending");
      const gagal = userTasks.filter((a) => a.status === "Tidak Dikerjakan");

      const totalPoin = selesai.reduce(
        (acc, curr) => acc + (curr.task?.poin || 0),
        0,
      );
      const produktivitas =
        totalTugas > 0 ? Math.round((selesai.length / totalTugas) * 100) : 0;

      return {
        id: user.id,
        nama_lengkap: user.nama_lengkap,
        nama_role: user.role?.nama_role || "-",
        role_id: user.role_id,
        total_tugas: totalTugas,
        tugas_selesai: selesai.length,
        tugas_pending: pending.length,
        tugas_gagal: gagal.length,
        poin: totalPoin,
        produktivitas,
      };
    });
    res.json(stats);
  } catch (error) {
    console.error("Eror Laporan:", error);
    res.status(500).json({ error: "Gagal menarik laporan." });
  }
});

app.get(
  "/api/reports/export",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        where: { status_aktif: true },
        select: {
          id: true,
          nama_lengkap: true,
          role: { select: { nama_role: true } },
        },
      });
      const assignments = await prisma.taskAssignment.findMany({
        include: { task: { select: { poin: true } } },
      });
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Produktivitas");
      worksheet.columns = [
        { header: "Nama Karyawan", key: "nama", width: 30 },
        { header: "Divisi / Role", key: "role", width: 25 },
        { header: "Total Tugas", key: "total", width: 15 },
        { header: "Tugas Selesai", key: "selesai", width: 15 },
        { header: "Produktivitas (%)", key: "produktivitas", width: 20 },
        { header: "Total Poin", key: "poin", width: 15 },
      ];
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF007BFF" },
      };

      users.forEach((user) => {
        const userTasks = assignments.filter((a) => a.penerima_id === user.id);
        const totalTugas = userTasks.length;
        const selesai = userTasks.filter((a) => a.status === "Selesai");
        const totalPoin = selesai.reduce(
          (acc, curr) => acc + (curr.task?.poin || 0),
          0,
        );
        const produktivitas =
          totalTugas > 0 ? Math.round((selesai.length / totalTugas) * 100) : 0;
        worksheet.addRow({
          nama: user.nama_lengkap,
          role: user.role?.nama_role || "-",
          total: totalTugas,
          selesai: selesai.length,
          produktivitas: produktivitas,
          poin: totalPoin,
        });
      });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Laporan_Produktivitas_CentraWork.xlsx",
      );
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Eror Export Excel:", error);
      res.status(500).json({ error: "Gagal mengekspor laporan." });
    }
  },
);

app.get(
  "/api/audit-logs",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      if (
        res.locals.user.role !== "Super Admin" &&
        res.locals.user.role !== "Super HR"
      )
        return res.status(403).json({ error: "Akses ditolak." });
      const logs = await prisma.auditLog.findMany({
        orderBy: { waktu: "desc" },
        take: 150,
      });
      res.json(logs);
    } catch (error) {
      console.error("Eror Tarik Audit:", error);
      res.status(500).json({ error: "Gagal menarik histori sistem." });
    }
  },
);

// ==========================================
// 4. NOTIFIKASI & TUGAS DEFAULT
// ==========================================
app.get(
  "/api/default-tasks",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const tasks = await prisma.defaultTask.findMany({
        orderBy: { created_at: "desc" },
      });
      const roles = await prisma.role.findMany();
      const formattedTasks = tasks.map((task) => {
        if (task.target_role_id === 0)
          return { ...task, role: { nama_role: "Seluruh Divisi" } };
        const role = roles.find((r) => r.id === task.target_role_id);
        return { ...task, role: role ? { nama_role: role.nama_role } : null };
      });
      res.json(formattedTasks);
    } catch (error) {
      console.error("Eror Tugas Default:", error);
      res.status(500).json({ error: "Gagal menarik daftar tugas rutin." });
    }
  },
);

app.post(
  "/api/default-tasks",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const {
        judul_tugas,
        deskripsi,
        target_role_id,
        jam_tenggat,
        status_aktif,
      } = req.body;
      const newTask = await prisma.defaultTask.create({
        data: {
          judul_tugas,
          deskripsi,
          target_role_id,
          jam_tenggat,
          status_aktif,
        },
      });

      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      await catatAudit(
        res.locals.user.id,
        namaAktor,
        "BUAT TUGAS RUTIN",
        `Membuat template tugas rutin: "${newTask.judul_tugas}"`,
      );

      res.status(201).json({ message: "Tugas rutin berhasil disimpan!" });
    } catch (error) {
      console.error("Eror Tambah Tugas Default:", error);
      res.status(500).json({ error: "Gagal menyimpan tugas rutin." });
    }
  },
);

app.put(
  "/api/default-tasks/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const {
        judul_tugas,
        deskripsi,
        target_role_id,
        jam_tenggat,
        status_aktif,
      } = req.body;
      const updatedTask = await prisma.defaultTask.update({
        where: { id: req.params.id as string },
        data: {
          judul_tugas,
          deskripsi,
          target_role_id,
          jam_tenggat,
          status_aktif,
        },
      });

      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      await catatAudit(
        res.locals.user.id,
        namaAktor,
        "EDIT TUGAS RUTIN",
        `Memperbarui template tugas rutin: "${updatedTask.judul_tugas}"`,
      );

      res.json({ message: "Tugas rutin diperbarui!", task: updatedTask });
    } catch (error) {
      console.error("Eror Update Tugas Default:", error);
      res.status(500).json({ error: "Gagal memperbarui tugas rutin." });
    }
  },
);

app.delete(
  "/api/default-tasks/:id",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      if (res.locals.user.role === "Super HR")
        return res
          .status(403)
          .json({ error: "Super HR tidak memiliki akses hapus." });

      const targetTask = await prisma.defaultTask.findUnique({
        where: { id: req.params.id as string },
      });
      await prisma.defaultTask.delete({
        where: { id: req.params.id as string },
      });

      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      await catatAudit(
        res.locals.user.id,
        namaAktor,
        "HAPUS TUGAS RUTIN",
        `Menghapus template tugas rutin: "${targetTask?.judul_tugas || req.params.id}"`,
      );

      res.json({ message: "Tugas rutin dihapus." });
    } catch (error) {
      console.error("Eror Hapus Tugas Default:", error);
      res.status(500).json({ error: "Gagal menghapus tugas rutin." });
    }
  },
);

app.get(
  "/api/notifications",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const notifs = await prisma.userNotification.findMany({
        where: { penerima_id: res.locals.user.id },
        include: {
          notification: {
            select: {
              judul_notifikasi: true,
              isi_pesan: true,
              created_at: true,
            },
          },
        },
        orderBy: { notification: { created_at: "desc" } },
      });
      res.json(notifs);
    } catch (error) {
      console.error("Eror Get Notif:", error);
      res.status(500).json({ error: "Gagal menarik notifikasi." });
    }
  },
);

app.post(
  "/api/notifications/broadcast",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { judul, pesan, targetPenerima } = req.body;
      const pengirimId = res.locals.user.id;
      const users =
        targetPenerima === "semua"
          ? await prisma.user.findMany({
              where: { status_aktif: true },
              select: { id: true },
            })
          : await prisma.user.findMany({
              where: { status_aktif: true, role_id: parseInt(targetPenerima) },
              select: { id: true },
            });

      if (!users || users.length === 0)
        return res
          .status(404)
          .json({ error: "Tidak ada target penerima aktif." });

      const newNotif = await prisma.notification.create({
        data: {
          pengirim_id: pengirimId,
          judul_notifikasi: judul,
          isi_pesan: pesan,
        },
      });
      const userNotifData = users.map((u) => ({
        notification_id: newNotif.id,
        penerima_id: u.id,
      }));
      await prisma.userNotification.createMany({ data: userNotifData });

      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      await catatAudit(
        pengirimId,
        namaAktor,
        "KIRIM NOTIFIKASI",
        `Menyiarkan: "${judul}"`,
      );
      io.emit("refresh_data");
      res
        .status(201)
        .json({ message: `Berhasil dikirim ke ${users.length} orang.` });
    } catch (error) {
      console.error("Eror Broadcast:", error);
      res.status(500).json({ error: "Gagal menyiarkan pengumuman." });
    }
  },
);

app.patch(
  "/api/notifications/read-all",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await prisma.userNotification.updateMany({
        where: { penerima_id: res.locals.user.id, is_read: false },
        data: { is_read: true },
      });
      res.json({ message: "Semua ditandai dibaca." });
    } catch (error) {
      console.error("Eror Read All:", error);
      res.status(500).json({ error: "Gagal update notifikasi." });
    }
  },
);

app.patch(
  "/api/notifications/:id/read",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      await prisma.userNotification.update({
        where: { id: req.params.id as string },
        data: { is_read: true },
      });
      res.json({ message: "Ditandai dibaca." });
    } catch (error) {
      console.error("Eror Read One:", error);
      res.status(500).json({ error: "Gagal update notifikasi." });
    }
  },
);

// =====================================
// 5. SISTEM ROBOT CRON JOB
// =====================================
cron.schedule("0 7 * * *", async () => {
  try {
    const activeDefaultTasks = await prisma.defaultTask.findMany({
      where: { status_aktif: true },
    });

    for (const taskItem of activeDefaultTasks) {
      const defaultTask = taskItem as unknown as {
        judul_tugas: string;
        deskripsi: string | null;
        target_role_id: number;
        jam_tenggat: string | null;
      };

      let targetUsers: { id: string }[] = [];
      if (defaultTask.target_role_id === 0) {
        targetUsers = await prisma.user.findMany({
          where: { status_aktif: true },
          select: { id: true },
        });
      } else {
        targetUsers = await prisma.user.findMany({
          where: { role_id: defaultTask.target_role_id, status_aktif: true },
          select: { id: true },
        });
      }

      if (targetUsers.length > 0) {
        let deadline = null;
        if (defaultTask.jam_tenggat) {
          const [hours, minutes] = defaultTask.jam_tenggat.split(":");
          const now = new Date();
          deadline = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            parseInt(hours),
            parseInt(minutes),
            0,
          );
        }

        const newTask = await prisma.task.create({
          data: {
            judul_tugas: defaultTask.judul_tugas,
            deskripsi: defaultTask.deskripsi,
            jenis_tugas: "Rutin",
            poin: 10,
            tenggat_waktu: deadline,
          },
        });
        const assignments = targetUsers.map((user) => ({
          task_id: newTask.id,
          penerima_id: user.id,
          status: "Pending",
        }));
        await prisma.taskAssignment.createMany({ data: assignments });
      }
    }
  } catch (error) {
    console.error("❌ Gagal menjalankan Robot Tugas Rutin:", error);
  }
});

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const expiredAssignments = await prisma.taskAssignment.findMany({
      where: { status: "Pending", task: { tenggat_waktu: { lt: now } } },
      include: { task: true },
    });

    if (expiredAssignments.length > 0) {
      for (const assignment of expiredAssignments) {
        await prisma.taskAssignment.update({
          where: { id: assignment.id },
          data: { status: "Tidak Dikerjakan" },
        });
        await catatAudit(
          assignment.penerima_id,
          "Sistem Otomatis",
          "TUGAS KADALUWARSA",
          `Tugas "${assignment.task?.judul_tugas}" melewati batas waktu dan ditandai sebagai Tidak Dikerjakan.`,
        );
      }
      io.emit("refresh_data");
    }
  } catch (error) {
    console.error("❌ Gagal menjalankan Robot Kedaluwarsa:", error);
  }
});

// ==========================================
// 6. ROUTE UPDATE PENGGUNA & PASSWORD
// ==========================================
app.put(
  "/api/auth/password",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = res.locals.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword || newPassword.length < 6)
        return res
          .status(400)
          .json({ error: "Password baru minimal 6 karakter!" });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        return res.status(404).json({ error: "User tidak ditemukan." });

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ error: "Password saat ini salah!" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      await catatAudit(
        userId,
        namaAktor,
        "GANTI PASSWORD MANDIRI",
        "Mengubah password milik sendiri.",
      );
      res.json({ message: "Password berhasil diubah!" });
    } catch (error) {
      console.error("Eror Ganti Password:", error);
      res.status(500).json({ error: "Gagal mengganti password." });
    }
  },
);

app.put("/api/users/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { nama_lengkap, email, password, role_id, status_aktif } = req.body;

    if (password && password.trim() !== "" && password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter!" });
    }

    const updateData: {
      nama_lengkap: string;
      email: string;
      role_id: number;
      status_aktif: boolean;
      password?: string;
    } = { nama_lengkap, email, role_id, status_aktif };

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: req.params.id as string },
    });
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id as string },
      data: updateData,
    });
    const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
    const namaTarget = targetUser?.nama_lengkap || updatedUser.nama_lengkap;
    await catatAudit(
      res.locals.user.id,
      namaAktor,
      "EDIT PENGGUNA",
      `Memperbarui data akun milik: ${namaTarget}`,
    );

    res.json({ message: "Data pengguna diperbarui!", user: updatedUser });
  } catch (error) {
    console.error("Eror Update User:", error);
    res.status(500).json({ error: "Gagal memperbarui pengguna." });
  }
});

app.put(
  "/api/users/:id/photo",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { foto_profil } = req.body;
      await prisma.user.update({
        where: { id: req.params.id as string },
        data: { foto_profil },
      });

      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      await catatAudit(
        res.locals.user.id,
        namaAktor,
        "UBAH FOTO PROFIL",
        "Memperbarui foto profil akun.",
      );

      res.json({ message: "Foto profil disimpan ke database!" });
    } catch (error) {
      console.error("Eror Simpan Foto:", error);
      res.status(500).json({ error: "Gagal menyimpan foto profil." });
    }
  },
);

app.put(
  "/api/users/:id/password",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6)
        return res
          .status(400)
          .json({ error: "Password baru minimal 6 karakter!" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const targetUser = await prisma.user.findUnique({
        where: { id: req.params.id as string },
      });
      await prisma.user.update({
        where: { id: req.params.id as string },
        data: { password: hashedPassword },
      });

      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      const namaTarget = targetUser?.nama_lengkap || req.params.id;

      await catatAudit(
        res.locals.user.id,
        namaAktor,
        "RESET PASSWORD KARYAWAN",
        `Me-reset password milik: ${namaTarget}`,
      );
      res.json({ message: "Password karyawan berhasil direset!" });
    } catch (error) {
      console.error("Eror Reset Password:", error);
      res.status(500).json({ error: "Gagal mereset password." });
    }
  },
);

app.put("/api/tasks/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { judul_tugas, deskripsi } = req.body;
    const assignment = await prisma.taskAssignment.findUnique({
      where: { id: req.params.id as string },
      include: { task: true },
    });
    if (assignment && assignment.task) {
      await prisma.task.update({
        where: { id: assignment.task.id },
        data: { judul_tugas, deskripsi },
      });

      const namaAktor = res.locals.user.nama_lengkap || res.locals.user.email;
      await catatAudit(
        res.locals.user.id,
        namaAktor,
        "EDIT TUGAS MANDIRI",
        `Mengubah detail tugas: "${judul_tugas}"`,
      );

      io.emit("refresh_data");
      res.json({ message: "Tugas berhasil diperbarui!" });
    } else {
      res.status(404).json({ error: "Tugas tidak ditemukan." });
    }
  } catch (error) {
    console.error("Eror Update Tugas Mandiri:", error);
    res.status(500).json({ error: "Gagal memperbarui tugas." });
  }
});

httpServer.listen(process.env.PORT || 5000, () => {
  console.log(
    `🚀 Server berjalan di http://localhost:${process.env.PORT || 5000}`,
  );
});
