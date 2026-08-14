import React, { useState, useEffect } from "react";
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
} from "@ionic/react";
import {
  add,
  createOutline,
  closeOutline,
  checkmarkCircle,
  timeOutline,
  chevronForwardOutline,
  documentTextOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { io } from "socket.io-client";
import api from "../api";

interface TaskAssignment {
  id: string;
  status: string;
  laporan?: string;
  task: {
    id: string;
    judul_tugas: string;
    jenis_tugas: string;
    deskripsi?: string;
    tenggat_waktu?: string;
    pembuat?: { nama_lengkap: string } | null;
  } | null;
  penerima: { id: string; nama_lengkap: string } | null;
}

const TasksTab: React.FC = () => {
  const [filter, setFilter] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [tasksList, setTasksList] = useState<TaskAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [userRole, setUserRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [detailModal, setDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);
  const [laporanText, setLaporanText] = useState("");
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

  useEffect(() => {
    const storedUser = localStorage.getItem("centrawork_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserRole(parsed.role);
      setCurrentUserId(parsed.id);
    }
  }, []);

  const fetchTasks = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await api.get<TaskAssignment[]>("/tasks");
      setTasksList(response.data);
    } catch {
      console.error("Gagal menarik data tugas");
    } finally {
      setIsLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchTasks();
  });

  const formatTanggal = (iso?: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openTaskDetail = (item: TaskAssignment) => {
    setSelectedTask(item);
    setLaporanText(item.laporan || "");
    setDetailModal(true);
  };

  const submitLaporan = async () => {
    if (!selectedTask) return;
    setIsSaving(true);
    try {
      await api.patch(`/tasks/${selectedTask.id}/status`, {
        status: "Selesai",
        laporan: laporanText,
      });
      setToastMsg("Tugas diselesaikan dan laporan terkirim!");
      setDetailModal(false);
    } catch {
      setToastMsg("Gagal mengirim laporan.");
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

  const filteredTasks = tasksList.filter((item) => {
    const taskTitle = item.task?.judul_tugas?.toLowerCase() || "";
    const userName = item.penerima?.nama_lengkap?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    const matchesSearch = taskTitle.includes(query) || userName.includes(query);
    if (!matchesSearch) return false;

    if (filter === "semua") return true;
    if (filter === "rutin" && item.task?.jenis_tugas === "Rutin") return true;
    if (filter === "atasan" && item.task?.jenis_tugas === "Delegasi")
      return true;
    if (filter === "mandiri" && item.task?.jenis_tugas === "Mandiri")
      return true;
    return false;
  });

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
            onIonChange={(e) => setFilter(e.detail.value as string)}
            color="light"
            scrollable
          >
            <IonSegmentButton value="semua">
              <IonLabel>Semua</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="rutin">
              <IonLabel>Rutin</IonLabel>
            </IonSegmentButton>
            {userRole !== "Super Admin" && userRole !== "Super HR" && (
              <IonSegmentButton value="atasan">
                <IonLabel>Atasan</IonLabel>
              </IonSegmentButton>
            )}
            <IonSegmentButton value="mandiri">
              <IonLabel>Mandiri</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ backgroundColor: "#f4f5f8" }}>
        <div style={{ backgroundColor: "white", padding: "10px 0" }}>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value!)}
            placeholder="Cari tugas atau nama pekerja..."
            animated={true}
          />
        </div>

        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <div className="ion-padding-horizontal">
            <IonList style={{ background: "transparent" }} lines="none">
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
                      <IonIcon
                        slot="start"
                        icon={
                          isSelesai
                            ? checkmarkCircle
                            : isGagal
                              ? alertCircleOutline
                              : timeOutline
                        }
                        color={
                          isSelesai ? "success" : isGagal ? "danger" : "warning"
                        }
                        style={{
                          fontSize: "1.8rem",
                          alignSelf: "flex-start",
                          marginTop: "12px",
                        }}
                      />
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
                        {(userRole === "Super Admin" ||
                          userRole === "Super HR") && (
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
                      {item.task?.jenis_tugas !== "Mandiri" && (
                        <IonIcon
                          slot="end"
                          icon={chevronForwardOutline}
                          color="medium"
                        />
                      )}
                    </IonItem>
                  );
                })
              )}
            </IonList>
          </div>
        )}

        {userRole !== "HR Asisten" && (
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
        )}

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
                  Status: {selectedTask?.status}
                </p>
              </IonText>
              <p
                style={{ fontSize: "0.9rem", color: "gray", margin: "10px 0" }}
              >
                Diberikan oleh:{" "}
                <b style={{ color: "#3880ff" }}>
                  {selectedTask?.task?.pembuat?.nama_lengkap ||
                    "Sistem (Tugas Rutin)"}
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
                  Batas Akhir: {formatTanggal(selectedTask.task.tenggat_waktu)}
                </p>
              )}

              <p
                style={{
                  color: "gray",
                  fontSize: "0.9rem",
                  lineHeight: "1.5",
                  marginTop: "10px",
                }}
              >
                {selectedTask?.task?.deskripsi ||
                  "Tidak ada deskripsi tambahan untuk tugas ini."}
              </p>
            </div>

            {selectedTask?.status === "Pending" ? (
              selectedTask?.penerima?.id === currentUserId ? (
                <>
                  <IonList
                    style={{
                      borderRadius: "12px",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                    }}
                  >
                    <IonItem lines="none">
                      <IonLabel
                        position="stacked"
                        style={{ color: "gray", fontWeight: "bold" }}
                      >
                        Laporan Pekerjaan *
                      </IonLabel>
                      <IonTextarea
                        placeholder="Tuliskan bukti/laporan hasil kerja Anda di sini sebelum menyelesaikan tugas..."
                        value={laporanText}
                        onIonInput={(e) => setLaporanText(e.detail.value!)}
                        rows={5}
                      />
                    </IonItem>
                  </IonList>
                  <IonButton
                    expand="block"
                    onClick={submitLaporan}
                    disabled={isSaving || !laporanText}
                    style={{
                      marginTop: "25px",
                      "--border-radius": "10px",
                      height: "50px",
                    }}
                  >
                    {isSaving ? (
                      <IonSpinner name="dots" />
                    ) : (
                      "Kirim Laporan & Selesaikan"
                    )}
                  </IonButton>
                </>
              ) : (
                <div
                  style={{
                    backgroundColor: "#fff3cd",
                    padding: "20px",
                    borderRadius: "12px",
                    textAlign: "center",
                  }}
                >
                  <IonIcon
                    icon={timeOutline}
                    color="warning"
                    style={{ fontSize: "3rem" }}
                  />
                  <h4
                    style={{
                      margin: "10px 0",
                      color: "#664d03",
                      fontWeight: "bold",
                    }}
                  >
                    Menunggu Pekerja
                  </h4>
                  <p
                    style={{ color: "#664d03", margin: 0, fontSize: "0.9rem" }}
                  >
                    Tugas ini belum diselesaikan oleh{" "}
                    {selectedTask?.penerima?.nama_lengkap}.
                  </p>
                </div>
              )
            ) : selectedTask?.status === "Selesai" ? (
              <div
                style={{
                  backgroundColor: "#e8f0fe",
                  padding: "20px",
                  borderRadius: "12px",
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
                <p style={{ color: "#333", margin: 0, lineHeight: "1.5" }}>
                  {selectedTask?.laporan || "Tugas diselesaikan tanpa laporan."}
                </p>
                <IonButton
                  expand="block"
                  disabled
                  style={{ marginTop: "20px", "--border-radius": "10px" }}
                >
                  Tugas Telah Diselesaikan
                </IonButton>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "#f8d7da",
                  padding: "20px",
                  borderRadius: "12px",
                  textAlign: "center",
                }}
              >
                <IonIcon
                  icon={alertCircleOutline}
                  color="danger"
                  style={{ fontSize: "3rem" }}
                />
                <h4
                  style={{
                    margin: "10px 0",
                    color: "#842029",
                    fontWeight: "bold",
                  }}
                >
                  Waktu Habis
                </h4>
                <p style={{ color: "#842029", margin: 0, fontSize: "0.9rem" }}>
                  Tugas ini melewati tenggat waktu dan tidak dikerjakan.
                </p>
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
