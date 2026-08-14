import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonText,
  IonSpinner,
  IonToast,
  IonAlert,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import {
  add,
  createOutline,
  trashOutline,
  keyOutline,
  closeOutline,
  saveOutline,
  eyeOutline,
  eyeOffOutline,
} from "ionicons/icons";
import { useIonViewWillEnter } from "@ionic/react";
import api from "../api";

interface UserItem {
  id: string;
  nama_lengkap: string;
  email: string;
  status_aktif: boolean;
  role: { nama_role: string } | null;
  role_id?: number;
}
interface RoleItem {
  id: number;
  nama_role: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [deleteData, setDeleteData] = useState({ id: "", nama: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRoleId, setEditRoleId] = useState<number>(4);
  const [editStatus, setEditStatus] = useState(true);
  const [showEditPwd, setShowEditPwd] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetId, setResetId] = useState("");
  const [resetName, setResetName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useIonViewWillEnter(() => {
    const userStr = localStorage.getItem("centrawork_user");
    if (userStr) setCurrentUserRole(JSON.parse(userStr).role);
    fetchData();
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get<UserItem[]>("/users"),
        api.get<RoleItem[]>("/roles"),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch {
      setToastMsg("Gagal mengambil data.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/users/${deleteData.id}`);
      setToastMsg(`Akun ${deleteData.nama} dihapus.`);
      setUsers((prev) => prev.filter((user) => user.id !== deleteData.id));
    } catch {
      setToastMsg("Akses hapus ditolak atau terjadi kesalahan.");
    }
  };

  const openEditModal = (user: UserItem) => {
    setEditData(user);
    setEditName(user.nama_lengkap);
    setEditEmail(user.email);
    setEditPassword("");
    setShowEditPwd(false);
    const roleMatch = roles.find((r) => r.nama_role === user.role?.nama_role);
    setEditRoleId(roleMatch ? roleMatch.id : 6);
    setEditStatus(user.status_aktif);
    setShowEditModal(true);
  };

  const executeEdit = async () => {
    if (!editData) return;

    if (editPassword && editPassword.trim() !== "" && editPassword.length < 6) {
      setToastMsg("Password baru minimal 6 karakter!");
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/users/${editData.id}`, {
        nama_lengkap: editName,
        email: editEmail,
        password: editPassword,
        role_id: editRoleId,
        status_aktif: editStatus,
      });
      setToastMsg("Data pengguna diperbarui!");
      setShowEditModal(false);
      fetchData();
    } catch {
      setToastMsg("Gagal memperbarui pengguna.");
    } finally {
      setIsSaving(false);
    }
  };

  const openResetModal = (id: string, nama: string) => {
    setResetId(id);
    setResetName(nama);
    setNewPassword("");
    setShowResetPwd(false);
    setShowResetModal(true);
  };

  const executeResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setToastMsg("Password baru minimal 6 karakter!");
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/users/${resetId}/password`, { newPassword });
      setToastMsg(`Password ${resetName} direset!`);
      setShowResetModal(false);
    } catch {
      setToastMsg("Gagal mereset password.");
    } finally {
      setIsSaving(false);
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
            <b>Manajemen Pengguna</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        <div style={{ marginBottom: "15px" }}>
          <IonText color="dark">
            <h4 style={{ fontWeight: "bold", fontSize: "1.1rem", margin: 0 }}>
              Daftar Karyawan
            </h4>
          </IonText>
        </div>

        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <IonList style={{ background: "transparent" }} lines="none">
            {users.map((user) => (
              <IonItem
                key={user.id}
                style={{
                  marginBottom: "10px",
                  borderRadius: "12px",
                  "--background": "#ffffff",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                }}
              >
                <IonLabel>
                  <h2
                    style={{
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      color: user.status_aktif ? "black" : "gray",
                    }}
                  >
                    {user.nama_lengkap}
                  </h2>
                  <p style={{ color: "gray", fontSize: "0.85rem" }}>
                    {user.email}
                  </p>
                  <p style={{ marginTop: "5px" }}>
                    <IonBadge color="tertiary" style={{ marginRight: "5px" }}>
                      {user.role?.nama_role}
                    </IonBadge>
                    <IonBadge color={user.status_aktif ? "success" : "medium"}>
                      {user.status_aktif ? "Aktif" : "Nonaktif"}
                    </IonBadge>
                  </p>
                </IonLabel>
                <div slot="end" style={{ display: "flex", gap: "2px" }}>
                  <IonButton
                    fill="clear"
                    size="small"
                    color="primary"
                    onClick={() => openEditModal(user)}
                  >
                    <IonIcon icon={createOutline} />
                  </IonButton>
                  <IonButton
                    fill="clear"
                    size="small"
                    color="warning"
                    onClick={() => openResetModal(user.id, user.nama_lengkap)}
                  >
                    <IonIcon icon={keyOutline} />
                  </IonButton>
                  {currentUserRole !== "Super HR" && (
                    <IonButton
                      fill="clear"
                      size="small"
                      color="danger"
                      onClick={() => {
                        setDeleteData({ id: user.id, nama: user.nama_lengkap });
                        setShowAlert(true);
                      }}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  )}
                </div>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonFab
          vertical="bottom"
          horizontal="end"
          slot="fixed"
          style={{ marginBottom: "10px", marginRight: "10px" }}
        >
          <IonFabButton color="primary" routerLink="/add-user">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Konfirmasi Hapus"
          message={`Apakah Anda yakin ingin menghapus akun "${deleteData.nama}" secara permanen?`}
          buttons={[
            { text: "Batal", role: "cancel" },
            { text: "Hapus", handler: executeDelete },
          ]}
        />

        <IonModal
          isOpen={showEditModal}
          onDidDismiss={() => setShowEditModal(false)}
        >
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
              <IonTitle>Edit Pengguna</IonTitle>
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
              }}
            >
              <IonItem lines="full">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Nama Lengkap
                </IonLabel>
                <IonInput
                  value={editName}
                  onIonInput={(e) => setEditName(e.detail.value!)}
                />
              </IonItem>
              <IonItem lines="full">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Alamat Email
                </IonLabel>
                <IonInput
                  type="email"
                  value={editEmail}
                  onIonInput={(e) => setEditEmail(e.detail.value!)}
                />
              </IonItem>
              <IonItem lines="full">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Ubah Password (Min. 6 Karakter)
                </IonLabel>
                <IonInput
                  type={showEditPwd ? "text" : "password"}
                  value={editPassword}
                  onIonInput={(e) => setEditPassword(e.detail.value!)}
                  placeholder="Kosongkan jika tidak diubah"
                />
                <IonButton
                  fill="clear"
                  slot="end"
                  onClick={() => setShowEditPwd(!showEditPwd)}
                  style={{ marginTop: "auto" }}
                >
                  <IonIcon
                    icon={showEditPwd ? eyeOffOutline : eyeOutline}
                    slot="icon-only"
                    color="medium"
                  />
                </IonButton>
              </IonItem>
              <IonItem lines="full">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Divisi / Role
                </IonLabel>
                <IonSelect
                  value={editRoleId}
                  onIonChange={(e) => setEditRoleId(e.detail.value)}
                  interface="popover"
                >
                  {roles.map((r) => (
                    <IonSelectOption key={r.id} value={r.id}>
                      {r.nama_role}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem lines="none">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Status Akun
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
              onClick={executeEdit}
              disabled={isSaving || !editName || !editEmail}
              style={{
                marginTop: "20px",
                "--border-radius": "10px",
                height: "50px",
              }}
            >
              {isSaving ? (
                <IonSpinner name="dots" color="light" />
              ) : (
                <>
                  <IonIcon icon={saveOutline} slot="start" /> Simpan Perubahan
                </>
              )}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonModal
          isOpen={showResetModal}
          onDidDismiss={() => setShowResetModal(false)}
        >
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
              <IonTitle>Reset Password</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowResetModal(false)}>
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
                marginBottom: "20px",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              <IonIcon
                icon={keyOutline}
                color="warning"
                style={{ fontSize: "4rem" }}
              />
              <h3 style={{ fontWeight: "bold" }}>{resetName}</h3>
            </div>
            <IonList
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <IonItem lines="none">
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Password Baru (Min. 6 Karakter)
                </IonLabel>
                <IonInput
                  type={showResetPwd ? "text" : "password"}
                  value={newPassword}
                  onIonInput={(e) => setNewPassword(e.detail.value!)}
                />
                <IonButton
                  fill="clear"
                  slot="end"
                  onClick={() => setShowResetPwd(!showResetPwd)}
                  style={{ marginTop: "auto" }}
                >
                  <IonIcon
                    icon={showResetPwd ? eyeOffOutline : eyeOutline}
                    slot="icon-only"
                    color="medium"
                  />
                </IonButton>
              </IonItem>
            </IonList>
            <IonButton
              expand="block"
              color="warning"
              onClick={executeResetPassword}
              disabled={isSaving || !newPassword}
              style={{
                marginTop: "20px",
                "--border-radius": "10px",
                height: "50px",
              }}
            >
              {isSaving ? <IonSpinner name="dots" /> : "Paksa Ganti Password"}
            </IonButton>
          </IonContent>
        </IonModal>
        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={2500}
        />
      </IonContent>
    </IonPage>
  );
};
export default UserManagement;
