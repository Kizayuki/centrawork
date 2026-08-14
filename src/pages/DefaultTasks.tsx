import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonAlert,
  IonToast,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonBadge,
  useIonViewWillEnter,
  IonText,
  IonDatetime,
} from "@ionic/react";
import {
  add,
  createOutline,
  trashOutline,
  closeOutline,
  saveOutline,
  timeOutline,
} from "ionicons/icons";
import api from "../api";

interface Role {
  id: number;
  nama_role: string;
}
interface DefaultTask {
  id: string;
  judul_tugas: string;
  deskripsi: string | null;
  target_role_id: number;
  status_aktif: boolean;
  jam_tenggat: string | null;
  role: { nama_role: string } | null;
}

const DefaultTasks: React.FC = () => {
  const [tasks, setTasks] = useState<DefaultTask[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [editJudul, setEditJudul] = useState("");
  const [editDeskripsi, setEditDeskripsi] = useState("");
  const [editRoleId, setEditRoleId] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<boolean>(true);
  const [editJamTenggat, setEditJamTenggat] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resTasks, resRoles] = await Promise.all([
        api.get<DefaultTask[]>("/default-tasks"),
        api.get<Role[]>("/roles"),
      ]);
      setTasks(resTasks.data);
      setRoles(resRoles.data);
    } catch {
      console.error("Gagal menarik data.");
    } finally {
      setIsLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchData();
  });

  const openEdit = (task: DefaultTask) => {
    setEditId(task.id);
    setEditJudul(task.judul_tugas);
    setEditDeskripsi(task.deskripsi || "");
    setEditJamTenggat(task.jam_tenggat || "");
    setEditRoleId(task.target_role_id);
    setEditStatus(task.status_aktif);
    setShowEditModal(true);
  };

  const getFormattedTime = (val: string) => {
    if (!val) return "";
    if (val.includes("T")) {
      const d = new Date(val);
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }
    return val;
  };

  const handleEditSave = async () => {
    if (!editJudul) {
      setToastMsg("Judul tugas tidak boleh kosong!");
      return;
    }
    setIsSaving(true);
    try {
      await api.put(`/default-tasks/${editId}`, {
        judul_tugas: editJudul,
        deskripsi: editDeskripsi,
        target_role_id: Number(editRoleId),
        jam_tenggat: getFormattedTime(editJamTenggat) || null,
        status_aktif: editStatus,
      });
      setToastMsg("Tugas rutin berhasil diperbarui!");
      setShowEditModal(false);
      fetchData();
    } catch {
      setToastMsg("Gagal memperbarui tugas.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/default-tasks/${deleteId}`);
      setToastMsg("Tugas rutin berhasil dihapus.");
      fetchData();
    } catch {
      setToastMsg("Gagal menghapus tugas.");
    } finally {
      setShowDeleteAlert(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            <b>Tugas Default</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        <div style={{ marginBottom: "15px", marginTop: "10px" }}>
          <IonText color="dark">
            <h4 style={{ fontWeight: "bold", fontSize: "1.1rem", margin: 0 }}>
              Daftar Tugas Rutin
            </h4>
          </IonText>
        </div>

        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <IonList style={{ background: "transparent" }} lines="none">
            {tasks.length === 0 ? (
              <p
                style={{
                  color: "gray",
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                Belum ada tugas rutin yang dibuat.
              </p>
            ) : (
              tasks.map((task) => (
                <IonItem
                  key={task.id}
                  style={{
                    marginBottom: "15px",
                    borderRadius: "12px",
                    "--background": "#ffffff",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                  }}
                >
                  <IonLabel
                    className="ion-text-wrap"
                    style={{ margin: "15px 0" }}
                  >
                    <h2
                      style={{
                        fontWeight: "bold",
                        color: "#1f1f1f",
                        fontSize: "1.1rem",
                      }}
                    >
                      {task.judul_tugas}
                    </h2>
                    <p
                      style={{
                        color: "gray",
                        fontSize: "0.85rem",
                        margin: "5px 0 10px 0",
                      }}
                    >
                      {task.deskripsi || "Tidak ada deskripsi."}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <IonBadge color="tertiary" style={{ padding: "5px 8px" }}>
                        Target: {task.role?.nama_role}
                      </IonBadge>
                      {task.jam_tenggat && (
                        <IonBadge
                          color="danger"
                          style={{
                            padding: "5px 8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          <IonIcon icon={timeOutline} /> {task.jam_tenggat}
                        </IonBadge>
                      )}
                      <IonBadge
                        color={task.status_aktif ? "success" : "medium"}
                        style={{ padding: "5px 8px" }}
                      >
                        {task.status_aktif ? "Aktif" : "Nonaktif"}
                      </IonBadge>
                    </div>
                  </IonLabel>
                  <div
                    slot="end"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "5px",
                    }}
                  >
                    <IonButton fill="clear" onClick={() => openEdit(task)}>
                      <IonIcon icon={createOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => {
                        setDeleteId(task.id);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonButton>
                  </div>
                </IonItem>
              ))
            )}
          </IonList>
        )}

        <IonFab
          vertical="bottom"
          horizontal="end"
          slot="fixed"
          style={{ marginBottom: "10px", marginRight: "10px" }}
        >
          <IonFabButton color="primary" routerLink="/add-default-task">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal
          isOpen={showEditModal}
          onDidDismiss={() => setShowEditModal(false)}
        >
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
              <IonTitle>Edit Tugas Rutin</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>
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
                padding: "10px 0",
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
              <IonItem lines="full">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Deskripsi
                </IonLabel>
                <IonTextarea
                  value={editDeskripsi}
                  onIonInput={(e) => setEditDeskripsi(e.detail.value!)}
                  rows={3}
                />
              </IonItem>

              <IonItem
                lines="full"
                button
                onClick={() => setShowTimePicker(true)}
              >
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Jam Tenggat Harian
                </IonLabel>
                <IonInput
                  value={getFormattedTime(editJamTenggat)}
                  readonly
                  placeholder="-- Pilih Jam --"
                  style={{ pointerEvents: "none" }}
                />
              </IonItem>

              <IonModal
                isOpen={showTimePicker}
                onDidDismiss={() => setShowTimePicker(false)}
                initialBreakpoint={0.4}
                breakpoints={[0, 0.4, 0.8]}
              >
                <IonContent className="ion-padding ion-text-center">
                  <IonDatetime
                    presentation="time"
                    value={editJamTenggat}
                    onIonChange={(e) =>
                      setEditJamTenggat(e.detail.value as string)
                    }
                    style={{ margin: "0 auto", borderRadius: "12px" }}
                  />
                  <IonButton
                    expand="block"
                    onClick={() => setShowTimePicker(false)}
                    style={{
                      marginTop: "20px",
                      "--border-radius": "10px",
                      height: "50px",
                    }}
                  >
                    <b>Selesai Pilih Jam</b>
                  </IonButton>
                </IonContent>
              </IonModal>

              <IonItem lines="full">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Target Divisi
                </IonLabel>
                <IonSelect
                  value={editRoleId}
                  onIonChange={(e) => setEditRoleId(e.detail.value)}
                  interface="action-sheet"
                >
                  <IonSelectOption value={0}>
                    🌟 Seluruh Divisi 🌟
                  </IonSelectOption>
                  {roles.map((r) => (
                    <IonSelectOption key={r.id} value={r.id}>
                      {r.nama_role}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem lines="none">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Status Aktif
                </IonLabel>
                <IonSelect
                  value={editStatus}
                  onIonChange={(e) => setEditStatus(e.detail.value)}
                  interface="popover"
                >
                  <IonSelectOption value={true}>Aktif</IonSelectOption>
                  <IonSelectOption value={false}>Nonaktif</IonSelectOption>
                </IonSelect>
              </IonItem>
            </IonList>
            <IonButton
              expand="block"
              onClick={handleEditSave}
              disabled={isSaving}
              style={{
                marginTop: "30px",
                "--border-radius": "10px",
                height: "50px",
              }}
            >
              {isSaving ? (
                <IonSpinner name="dots" color="light" />
              ) : (
                <>
                  <IonIcon icon={saveOutline} slot="start" /> <b>SIMPAN</b>
                </>
              )}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Hapus Tugas Rutin?"
          message="Tugas rutin yang dihapus tidak akan diberikan secara otomatis."
          buttons={[
            { text: "Batal", role: "cancel" },
            {
              text: "Hapus",
              handler: handleDeleteConfirm,
              cssClass: "alert-button-danger",
            },
          ]}
        />
        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={2000}
          color={toastMsg.includes("berhasil") ? "success" : "danger"}
        />
      </IonContent>
    </IonPage>
  );
};
export default DefaultTasks;
