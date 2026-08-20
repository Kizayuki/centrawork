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
  IonSpinner,
  IonToast,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonAlert,
  IonBadge,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import {
  add,
  createOutline,
  trashOutline,
  closeOutline,
  briefcaseOutline,
  shieldCheckmarkOutline,
  listOutline,
} from "ionicons/icons";
import { useIonViewWillEnter } from "@ionic/react";
import api from "../api";

interface RoleItem {
  id: number;
  nama_role: string;
  level_akses: number;
}

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);

  const [roleName, setRoleName] = useState("");
  const [roleLevel, setRoleLevel] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<RoleItem[]>("/roles");
      setRoles(response.data);
    } catch {
      setToastMsg("Gagal menarik data divisi.");
    } finally {
      setIsLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchRoles();
  });

  const openAddModal = () => {
    setRoleName("");
    setRoleLevel(3); // Default level 3 Staff
    setIsEditMode(false);
    setCurrentRoleId(null);
    setShowModal(true);
  };

  const openEditModal = (role: RoleItem) => {
    setRoleName(role.nama_role);
    setRoleLevel(role.level_akses);
    setCurrentRoleId(role.id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      setToastMsg("Nama divisi wajib diisi!");
      return;
    }
    setIsSaving(true);
    try {
      if (isEditMode && currentRoleId) {
        await api.put(`/roles/${currentRoleId}`, {
          nama_role: roleName,
          level_akses: roleLevel,
        });
        setToastMsg("Divisi berhasil diperbarui!");
      } else {
        await api.post("/roles", {
          nama_role: roleName,
          level_akses: roleLevel,
        });
        setToastMsg("Divisi baru berhasil ditambahkan!");
      }
      setShowModal(false);
      fetchRoles();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setToastMsg(
        err.response?.data?.error || "Terjadi kesalahan saat menyimpan divisi.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/roles/${deleteId}`);
      setToastMsg("Divisi berhasil dihapus.");
      fetchRoles();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setToastMsg(err.response?.data?.error || "Gagal menghapus divisi.");
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
            <b>Manajemen Divisi</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        <p style={{ color: "gray", fontSize: "0.9rem", marginTop: 0 }}>
          Kelola divisi dan tingkat akses karyawan di perusahaan Anda.
        </p>

        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <IonList
            style={{ background: "transparent", marginTop: "10px" }}
            lines="none"
          >
            {roles.map((role) => {
              const isCoreRole = role.level_akses < 3;
              return (
                <IonItem
                  key={role.id}
                  style={{
                    marginBottom: "15px",
                    borderRadius: "16px",
                    "--background": "#ffffff",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div
                    slot="start"
                    style={{
                      backgroundColor: isCoreRole
                        ? "#f4f5f8"
                        : "rgba(56, 128, 255, 0.1)",
                      padding: "12px",
                      borderRadius: "12px",
                      alignSelf: "flex-start",
                      marginTop: "10px",
                    }}
                  >
                    <IonIcon
                      icon={briefcaseOutline}
                      style={{
                        fontSize: "1.5rem",
                        color: isCoreRole ? "gray" : "#3880ff",
                      }}
                    />
                  </div>

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
                      {role.nama_role}
                    </h2>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "gray",
                        margin: "4px 0",
                      }}
                    >
                      Akses Level: {role.level_akses}
                    </p>
                    {isCoreRole ? (
                      <IonBadge
                        color="medium"
                        style={{
                          marginTop: "5px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        Divisi Inti (Terkunci)
                      </IonBadge>
                    ) : (
                      <IonBadge
                        color="primary"
                        style={{
                          marginTop: "5px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        Divisi Kustom
                      </IonBadge>
                    )}
                  </IonLabel>

                  {!isCoreRole && (
                    <div
                      slot="end"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                      }}
                    >
                      <IonButton
                        fill="clear"
                        color="primary"
                        onClick={() => openEditModal(role)}
                      >
                        <IonIcon icon={createOutline} slot="icon-only" />
                      </IonButton>
                      <IonButton
                        fill="clear"
                        color="danger"
                        onClick={() => {
                          setDeleteId(role.id);
                          setShowDeleteAlert(true);
                        }}
                      >
                        <IonIcon icon={trashOutline} slot="icon-only" />
                      </IonButton>
                    </div>
                  )}
                </IonItem>
              );
            })}
          </IonList>
        )}

        <IonFab
          vertical="bottom"
          horizontal="end"
          slot="fixed"
          style={{ marginBottom: "10px", marginRight: "10px" }}
        >
          <IonFabButton color="primary" onClick={openAddModal}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* MODAL FULL PAGE AGAR TIDAK TERPOTONG ATAU BERANTAKAN */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
              <IonTitle>
                {isEditMode ? "Edit Divisi" : "Tambah Divisi"}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowModal(false)}>
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
                borderRadius: "16px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px 0",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#3880ff",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IonIcon
                  icon={briefcaseOutline}
                  style={{ marginRight: "8px" }}
                />{" "}
                Detail Divisi Baru
              </h3>

              <IonItem
                lines="none"
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  marginBottom: "15px",
                }}
              >
                <IonInput
                  label="Nama Divisi *"
                  labelPlacement="stacked"
                  value={roleName}
                  onIonInput={(e) => setRoleName(e.detail.value!)}
                  placeholder="Misal: Tim Marketing / Staff Biasa"
                />
              </IonItem>

              <IonItem
                lines="none"
                style={{ border: "1px solid #e0e0e0", borderRadius: "10px" }}
              >
                <IonIcon
                  icon={listOutline}
                  slot="start"
                  color="medium"
                  style={{ marginTop: "30px" }}
                />
                <IonSelect
                  label="Pilih Tingkat Akses Karyawan *"
                  labelPlacement="stacked"
                  value={roleLevel}
                  onIonChange={(e) => setRoleLevel(parseInt(e.detail.value))}
                  interface="action-sheet"
                  disabled={isEditMode}
                >
                  <IonSelectOption value={3}>
                    Level 3 (Staff / Akses Standar)
                  </IonSelectOption>
                  <IonSelectOption value={4}>
                    Level 4 (Asisten / Akses Terbatas)
                  </IonSelectOption>
                </IonSelect>
              </IonItem>
            </div>

            <div
              style={{
                backgroundColor: "#e8f0fe",
                padding: "15px",
                borderRadius: "12px",
                border: "1px solid #c9dfff",
              }}
            >
              <p
                style={{
                  margin: "0 0 5px 0",
                  fontSize: "0.85rem",
                  color: "#1f1f1f",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IonIcon
                  icon={shieldCheckmarkOutline}
                  style={{ color: "#3880ff", marginRight: "5px" }}
                />
                Panduan Level Akses:
              </p>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "20px",
                  fontSize: "0.8rem",
                  color: "gray",
                  lineHeight: "1.5",
                }}
              >
                <li>
                  <b>Level 3:</b> Cocok untuk karyawan/staff biasa (pekerja
                  tetap).
                </li>
                <li>
                  <b>Level 4:</b> Akses terbatas. Fiturnya lebih dibatasi dari
                  level 3. Cocok untuk anak magang atau karyawan tidak tetap
                </li>
              </ul>
            </div>

            <IonButton
              expand="block"
              onClick={handleSave}
              disabled={isSaving || !roleName}
              style={{
                marginTop: "30px",
                "--border-radius": "12px",
                height: "55px",
                fontWeight: "bold",
                fontSize: "1.05rem",
              }}
            >
              {isSaving ? (
                <IonSpinner name="dots" />
              ) : (
                "Simpan Divisi ke Database"
              )}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Hapus Divisi?"
          message="Anda tidak bisa menghapus divisi jika masih ada karyawan yang tergabung. Lanjutkan?"
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
          duration={2500}
          color={
            toastMsg.includes("berhasil") || toastMsg.includes("diperbarui")
              ? "success"
              : "danger"
          }
        />
      </IonContent>
    </IonPage>
  );
};
export default RoleManagement;
