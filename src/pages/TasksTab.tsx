import React, { useState, useEffect, useRef } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonFab,
  IonFabButton,
  IonIcon,
  IonText,
  IonButton,
  IonSpinner,
  useIonViewWillEnter,
  IonButtons,
  IonMenuButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonToast,
  IonSearchbar,
  IonCheckbox,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  add,
  createOutline,
  closeOutline,
  documentTextOutline,
  alertCircleOutline,
  imageOutline,
} from "ionicons/icons";
import { io } from "socket.io-client";
import api from "../api";

interface TaskAssignment {
  id: string;
  status: string;
  laporan?: string;
  foto_bukti?: string;
  task: {
    id: string;
    judul_tugas: string;
    jenis_tugas: string;
    deskripsi?: string;
    tenggat_waktu?: string;
    pembuat?: { nama_lengkap: string } | null;
  } | null;
  penerima: { id: string; nama_lengkap: string; role_id?: number } | null;
}
interface RoleItem {
  id: number;
  nama_role: string;
}

const TasksTab: React.FC = () => {
  const [filter, setFilter] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [tasksList, setTasksList] = useState<TaskAssignment[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const [userRole, setUserRole] = useState(() => {
    const storedUser = localStorage.getItem("centrawork_user");
    return storedUser ? JSON.parse(storedUser).role : "";
  });
  const [currentUserId, setCurrentUserId] = useState(() => {
    const storedUser = localStorage.getItem("centrawork_user");
    return storedUser ? JSON.parse(storedUser).id : "";
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("centrawork_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserRole(parsed.role);
      setCurrentUserId(parsed.id);
    }
  }, []);

  const [detailModal, setDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);
  const [laporanText, setLaporanText] = useState("");
  const [fotoBukti, setFotoBukti] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [editJudul, setEditJudul] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:5000");
    socket.on("refresh_data", () => {
      fetchTasks(false);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const syncFavicon = () => {
    const icon = localStorage.getItem("centrawork_app_icon");
    if (icon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = icon;
    }
  };

  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [tasksRes, rolesRes] = await Promise.all([
        api.get<TaskAssignment[]>("/tasks"),
        api.get<RoleItem[]>("/roles"),
      ]);
      setTasksList(tasksRes.data);
      setRoles(rolesRes.data);
    } catch {
      console.error("Gagal menarik data tugas");
    } finally {
      setIsLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchTasks();
    syncFavicon();
  });

  const formatTanggalHanyaDate = (iso?: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const openTaskDetail = (item: TaskAssignment) => {
    setSelectedTask(item);
    setLaporanText(item.laporan || "");
    setFotoBukti(item.foto_bukti || "");
    setDetailModal(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSaving(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        setFotoBukti(base64);
        setIsSaving(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleStatus = async (item: TaskAssignment) => {
    if (item.status === "Tidak Dikerjakan") return;
    const newStatus = item.status === "Selesai" ? "Pending" : "Selesai";
    setTasksList((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, status: newStatus } : t)),
    );
    try {
      await api.patch(`/tasks/${item.id}/status`, { status: newStatus });
    } catch {
      setTasksList((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, status: item.status } : t)),
      );
      setToastMsg("Gagal memperbarui status tugas.");
    }
  };

  const submitLaporanOnly = async () => {
    if (!selectedTask) return;
    setIsSaving(true);
    try {
      await api.patch(`/tasks/${selectedTask.id}/status`, {
        laporan: laporanText,
        foto_bukti: fotoBukti,
      });
      setToastMsg("Laporan / Bukti berhasil disimpan!");
      setDetailModal(false);
      fetchTasks(false);
    } catch {
      setToastMsg("Gagal menyimpan laporan.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (e: React.MouseEvent, item: TaskAssignment) => {
    e.stopPropagation();
    setEditId(item.id);
    setEditJudul(item.task?.judul_tugas || "");
    setEditDesc(item.task?.deskripsi || "");
    setShowEdit(true);
  };

  const executeEdit = async () => {
    setIsSaving(true);
    try {
      await api.put(`/tasks/${editId}`, {
        judul_tugas: editJudul,
        deskripsi: editDesc,
      });
      setToastMsg("Tugas diperbarui!");
      setShowEdit(false);
    } catch {
      setToastMsg("Gagal memperbarui tugas.");
    } finally {
      setIsSaving(false);
    }
  };

  const baseTasks = tasksList.filter((item) => {
    const taskTitle = item.task?.judul_tugas?.toLowerCase() || "";
    const userName = item.penerima?.nama_lengkap?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    if (!taskTitle.includes(query) && !userName.includes(query)) return false;
    if (
      selectedRole !== "semua" &&
      item.penerima?.role_id !== Number(selectedRole)
    )
      return false;

    if (filter === "semua") return true;
    if (filter === "rutin" && item.task?.jenis_tugas === "Rutin") return true;
    if (filter === "delegasi" && item.task?.jenis_tugas === "Delegasi")
      return true;
    if (filter === "mandiri" && item.task?.jenis_tugas === "Mandiri")
      return true;
    return false;
  });

  const sortedTasks = baseTasks.sort((a, b) => {
    if (a.status === "Pending" && b.status !== "Pending") return -1;
    if (a.status !== "Pending" && b.status === "Pending") return 1;
    return 0;
  });

  const countSelesai = sortedTasks.filter((t) => t.status === "Selesai").length;
  const countPending = sortedTasks.filter((t) => t.status === "Pending").length;
  const countGagal = sortedTasks.filter(
    (t) => t.status === "Tidak Dikerjakan",
  ).length;
  const countTotal = sortedTasks.length;
  const filteredTasks = sortedTasks.filter(
    (t) => statusFilter === "semua" || t.status === statusFilter,
  );
  const isExecutive = userRole === "Super Admin" || userRole === "Super HR";

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            <b>Daftar Tugas</b>
          </IonTitle>
        </IonToolbar>
        <IonToolbar color="primary">
          <IonSegment
            value={filter}
            onIonChange={(e) => {
              setFilter(e.detail.value as string);
              setStatusFilter("semua");
            }}
            color="light"
            scrollable
          >
            <IonSegmentButton value="semua">
              <IonLabel>Semua</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="rutin">
              <IonLabel>Rutin</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="delegasi">
              <IonLabel>{isExecutive ? "Delegasi" : "Dari Atasan"}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="mandiri">
              <IonLabel>Mandiri</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ backgroundColor: "#f4f5f8" }}>
        <div style={{ backgroundColor: "white", padding: "10px 15px 0 15px" }}>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
            placeholder="Cari tugas atau nama pekerja..."
            animated={true}
            style={{ padding: 0, paddingBottom: "10px" }}
          />

          {isExecutive && (
            <>
              <IonSelect
                value={selectedRole}
                onIonChange={(e) => setSelectedRole(e.detail.value)}
                placeholder="Filter Divisi"
                interface="action-sheet"
                style={{
                  backgroundColor: "#f4f5f8",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                <IonSelectOption value="semua">
                  🏢 Lihat Semua Divisi
                </IonSelectOption>
                {roles.map((r) => (
                  <IonSelectOption key={r.id} value={r.id}>
                    {r.nama_role}
                  </IonSelectOption>
                ))}
              </IonSelect>

              <IonGrid className="ion-no-padding" style={{ padding: "10px 0" }}>
                <IonRow>
                  <IonCol size="3" onClick={() => setStatusFilter("semua")}>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "8px 5px",
                        backgroundColor:
                          statusFilter === "semua" ? "#e8f0fe" : "#f4f5f8",
                        borderRadius: "8px",
                        border:
                          statusFilter === "semua"
                            ? "1px solid #3880ff"
                            : "1px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontWeight: "bold",
                          color: "#3880ff",
                        }}
                      >
                        {countTotal}
                      </h3>
                      <p
                        style={{
                          margin: "2px 0 0 0",
                          fontSize: "0.65rem",
                          color: "gray",
                        }}
                      >
                        Total
                      </p>
                    </div>
                  </IonCol>
                  <IonCol size="3" onClick={() => setStatusFilter("Selesai")}>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "8px 5px",
                        backgroundColor:
                          statusFilter === "Selesai" ? "#d1e7dd" : "#f4f5f8",
                        borderRadius: "8px",
                        border:
                          statusFilter === "Selesai"
                            ? "1px solid #198754"
                            : "1px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontWeight: "bold",
                          color: "#198754",
                        }}
                      >
                        {countSelesai}
                      </h3>
                      <p
                        style={{
                          margin: "2px 0 0 0",
                          fontSize: "0.65rem",
                          color: "gray",
                        }}
                      >
                        Selesai
                      </p>
                    </div>
                  </IonCol>
                  <IonCol size="3" onClick={() => setStatusFilter("Pending")}>
                    <div
                      style={{
                        textAlign: "center",
                        padding: "8px 5px",
                        backgroundColor:
                          statusFilter === "Pending" ? "#fff3cd" : "#f4f5f8",
                        borderRadius: "8px",
                        border:
                          statusFilter === "Pending"
                            ? "1px solid #ffc107"
                            : "1px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontWeight: "bold",
                          color: "#ffc107",
                        }}
                      >
                        {countPending}
                      </h3>
                      <p
                        style={{
                          margin: "2px 0 0 0",
                          fontSize: "0.65rem",
                          color: "gray",
                        }}
                      >
                        Pending
                      </p>
                    </div>
                  </IonCol>
                  <IonCol
                    size="3"
                    onClick={() => setStatusFilter("Tidak Dikerjakan")}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        padding: "8px 5px",
                        backgroundColor:
                          statusFilter === "Tidak Dikerjakan"
                            ? "#f8d7da"
                            : "#f4f5f8",
                        borderRadius: "8px",
                        border:
                          statusFilter === "Tidak Dikerjakan"
                            ? "1px solid #dc3545"
                            : "1px solid transparent",
                        cursor: "pointer",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontWeight: "bold",
                          color: "#dc3545",
                        }}
                      >
                        {countGagal}
                      </h3>
                      <p
                        style={{
                          margin: "2px 0 0 0",
                          fontSize: "0.65rem",
                          color: "gray",
                        }}
                      >
                        Gagal
                      </p>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <div className="ion-padding-horizontal">
            <IonList
              style={{ background: "transparent", marginTop: "10px" }}
              lines="none"
            >
              {filteredTasks.length === 0 ? (
                <p
                  style={{
                    color: "gray",
                    textAlign: "center",
                    marginTop: "20px",
                  }}
                >
                  Tidak ada tugas yang sesuai.
                </p>
              ) : (
                filteredTasks.map((item) => {
                  const isSelesai = item.status === "Selesai";
                  const isGagal = item.status === "Tidak Dikerjakan";
                  const canCheck =
                    item.penerima?.id === currentUserId && !isGagal;

                  return (
                    <IonItem
                      button
                      onClick={() => openTaskDetail(item)}
                      key={item.id}
                      style={{
                        marginBottom: "10px",
                        borderRadius: "12px",
                        "--background": "#ffffff",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      }}
                    >
                      {isGagal ? (
                        <IonIcon
                          slot="start"
                          icon={alertCircleOutline}
                          color="danger"
                          style={{
                            fontSize: "1.8rem",
                            alignSelf: "flex-start",
                            marginTop: "12px",
                            marginRight: "15px",
                          }}
                        />
                      ) : (
                        <div
                          slot="start"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canCheck) toggleStatus(item);
                          }}
                          style={{
                            alignSelf: "flex-start",
                            marginTop: "12px",
                            marginRight: "15px",
                            zIndex: 10,
                          }}
                        >
                          <IonCheckbox
                            checked={isSelesai}
                            disabled={!canCheck}
                            color="success"
                            style={{ pointerEvents: "none" }}
                          />
                        </div>
                      )}
                      <IonLabel
                        className="ion-text-wrap"
                        style={{ margin: "10px 0" }}
                      >
                        <h2
                          style={{
                            fontWeight: "bold",
                            textDecoration:
                              isSelesai || isGagal ? "line-through" : "none",
                            color: isSelesai || isGagal ? "gray" : "#1f1f1f",
                            whiteSpace: "normal",
                          }}
                        >
                          {item.task?.judul_tugas}
                        </h2>
                        <p
                          style={{
                            color: "gray",
                            fontSize: "0.85rem",
                            margin: "4px 0",
                          }}
                        >
                          Tugas {item.task?.jenis_tugas} •{" "}
                          <IonText
                            color={
                              isSelesai
                                ? "success"
                                : isGagal
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {item.status}
                          </IonText>
                        </p>
                        <p
                          style={{
                            color: "gray",
                            fontSize: "0.75rem",
                            margin: "0 0 4px 0",
                          }}
                        >
                          Diberikan oleh:{" "}
                          <b>
                            {item.task?.pembuat?.nama_lengkap ||
                              "Sistem / Rutin"}
                          </b>
                        </p>
                        {isExecutive && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#3880ff",
                              marginTop: 0,
                            }}
                          >
                            Pekerja: <b>{item.penerima?.nama_lengkap}</b>
                          </p>
                        )}
                      </IonLabel>
                      {item.task?.jenis_tugas === "Mandiri" && (
                        <div slot="end">
                          <IonButton
                            fill="clear"
                            color="primary"
                            onClick={(e) => openEdit(e, item)}
                          >
                            <IonIcon icon={createOutline} />
                          </IonButton>
                        </div>
                      )}
                    </IonItem>
                  );
                })
              )}
            </IonList>
          </div>
        )}

        {/* PERBAIKAN: Tombol Tambah dibuka untuk SEMUA Karyawan termasuk HR Asisten */}
        <IonFab
          vertical="bottom"
          horizontal="end"
          slot="fixed"
          style={{ marginBottom: "10px", marginRight: "10px" }}
        >
          <IonFabButton color="primary" routerLink="/add-task">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Modal-modal disembunyikan untuk menghemat ruang, pertahankan logika modal Anda */}
        <IonModal
          isOpen={detailModal}
          onDidDismiss={() => setDetailModal(false)}
        >
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
              <IonTitle>Detail Pekerjaan</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setDetailModal(false)}>
                  <IonIcon icon={closeOutline} size="large" />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent
            className="ion-padding"
            style={{ backgroundColor: "#f4f5f8" }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                marginBottom: "20px",
              }}
            >
              <IonIcon
                icon={documentTextOutline}
                color="primary"
                style={{ fontSize: "3rem", marginBottom: "10px" }}
              />
              <h2
                style={{ fontWeight: "bold", color: "#1f1f1f", marginTop: 0 }}
              >
                {selectedTask?.task?.judul_tugas}
              </h2>
              <IonText
                color={
                  selectedTask?.status === "Selesai"
                    ? "success"
                    : selectedTask?.status === "Tidak Dikerjakan"
                      ? "danger"
                      : "warning"
                }
              >
                <p style={{ fontWeight: "bold", margin: "5px 0" }}>
                  Status Saat Ini: {selectedTask?.status}
                </p>
              </IonText>
              <p
                style={{ fontSize: "0.9rem", color: "gray", margin: "10px 0" }}
              >
                Pekerja:{" "}
                <b style={{ color: "#3880ff" }}>
                  {selectedTask?.penerima?.nama_lengkap}
                </b>
              </p>
              {selectedTask?.task?.tenggat_waktu && (
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "red",
                    margin: "0 0 10px 0",
                    fontWeight: "bold",
                  }}
                >
                  Batas Akhir:{" "}
                  {formatTanggalHanyaDate(selectedTask.task.tenggat_waktu)}
                </p>
              )}
              <p
                style={{
                  color: "gray",
                  fontSize: "0.9rem",
                  lineHeight: "1.5",
                  marginTop: "10px",
                  padding: "15px",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                }}
              >
                <b>Instruksi:</b>
                <br />
                {selectedTask?.task?.deskripsi ||
                  "Tidak ada deskripsi tambahan untuk tugas ini."}
              </p>
            </div>

            {selectedTask?.penerima?.id === currentUserId &&
              selectedTask?.status === "Pending" && (
                <>
                  <IonList
                    style={{
                      borderRadius: "12px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                    }}
                  >
                    <IonItem lines="full">
                      <IonLabel
                        position="stacked"
                        style={{ color: "gray", fontWeight: "bold" }}
                      >
                        Keterangan Laporan / Bukti
                      </IonLabel>
                      <IonTextarea
                        placeholder="Tuliskan keterangan laporan tugas di sini..."
                        value={laporanText}
                        onIonInput={(e) => setLaporanText(e.detail.value!)}
                        rows={3}
                      />
                    </IonItem>
                    <IonItem
                      lines="none"
                      button
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <IonIcon
                        icon={imageOutline}
                        slot="start"
                        color="primary"
                      />
                      <IonLabel>
                        {fotoBukti
                          ? "Ubah Bukti Gambar"
                          : "Unggah Bukti Gambar"}
                      </IonLabel>
                    </IonItem>
                  </IonList>
                  {fotoBukti && (
                    <div style={{ marginTop: "15px", textAlign: "center" }}>
                      <img
                        src={fotoBukti}
                        alt="Bukti"
                        style={{
                          maxWidth: "100%",
                          borderRadius: "8px",
                          maxHeight: "200px",
                          objectFit: "cover",
                          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                        }}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <IonButton
                    expand="block"
                    onClick={submitLaporanOnly}
                    disabled={isSaving}
                    style={{
                      marginTop: "15px",
                      "--border-radius": "10px",
                      height: "50px",
                    }}
                  >
                    {isSaving ? <IonSpinner name="dots" /> : "Simpan Laporan"}
                  </IonButton>
                  <div
                    style={{
                      textAlign: "center",
                      color: "gray",
                      fontSize: "0.85rem",
                      marginTop: "20px",
                    }}
                  >
                    Untuk menyatakan tugas benar-benar selesai, cukup centang
                    kotak di halaman daftar tugas.
                  </div>
                </>
              )}

            {(selectedTask?.penerima?.id !== currentUserId ||
              selectedTask?.status !== "Pending") &&
              (selectedTask?.laporan || selectedTask?.foto_bukti) && (
                <div
                  style={{
                    backgroundColor: "#e8f0fe",
                    padding: "20px",
                    borderRadius: "12px",
                    marginTop: "15px",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 10px 0",
                      color: "#3880ff",
                      fontWeight: "bold",
                      fontSize: "1rem",
                    }}
                  >
                    Laporan Terkirim:
                  </h4>
                  {selectedTask.laporan && (
                    <p
                      style={{
                        color: "#333",
                        margin: "0 0 15px 0",
                        lineHeight: "1.5",
                      }}
                    >
                      {selectedTask.laporan}
                    </p>
                  )}
                  {selectedTask.foto_bukti && (
                    <img
                      src={selectedTask.foto_bukti}
                      alt="Bukti Terkirim"
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                      }}
                    />
                  )}
                </div>
              )}
          </IonContent>
        </IonModal>

        <IonModal isOpen={showEdit} onDidDismiss={() => setShowEdit(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
              <IonTitle>Edit Tugas Mandiri</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEdit(false)}>
                  <IonIcon icon={closeOutline} size="large" />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent
            className="ion-padding"
            style={{ backgroundColor: "#f4f5f8" }}
          >
            <IonList
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <IonItem lines="full">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Judul Tugas *
                </IonLabel>
                <IonInput
                  value={editJudul}
                  onIonInput={(e) => setEditJudul(e.detail.value!)}
                />
              </IonItem>
              <IonItem lines="none">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Deskripsi
                </IonLabel>
                <IonTextarea
                  value={editDesc}
                  onIonInput={(e) => setEditDesc(e.detail.value!)}
                  rows={5}
                />
              </IonItem>
            </IonList>
            <IonButton
              expand="block"
              onClick={executeEdit}
              disabled={isSaving || !editJudul}
              style={{
                marginTop: "30px",
                "--border-radius": "10px",
                height: "50px",
              }}
            >
              {isSaving ? <IonSpinner name="dots" /> : "Simpan Perubahan"}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={2000}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};
export default TasksTab;
