import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonToast,
  IonSpinner,
  IonList,
  IonIcon,
} from "@ionic/react";
import { eyeOutline, eyeOffOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import api from "../api";

interface RoleItem {
  id: number;
  nama_role: string;
}

const AddUser: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleId, setRoleId] = useState<number>(6);
  const [statusAktif, setStatusAktif] = useState(true);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get<RoleItem[]>("/roles");
        setRoles(response.data);
      } catch {
        console.error("Gagal menarik daftar divisi");
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setToastMsg("Password dan konfirmasi tidak cocok!");
      return;
    }

    if (password.length < 6) {
      setToastMsg("Password minimal 6 karakter!");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        nama_lengkap: nama,
        email: email.trim(),
        password: password,
        role_id: roleId,
        status_aktif: statusAktif,
      });
      setToastMsg("Pengguna berhasil ditambahkan!");
      setTimeout(() => history.goBack(), 1500);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setToastMsg(error.response?.data?.error || "Gagal menambahkan pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/user-management" />
          </IonButtons>
          <IonTitle>
            <b>Tambah Pengguna</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        <form onSubmit={handleSubmit}>
          <IonList
            style={{
              borderRadius: "12px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            }}
          >
            <IonItem lines="full">
              <IonLabel position="stacked" style={{ color: "gray" }}>
                Nama Lengkap *
              </IonLabel>
              <IonInput
                value={nama}
                onIonInput={(e) => setNama(e.detail.value!)}
                required
              />
            </IonItem>

            <IonItem lines="full">
              <IonLabel position="stacked" style={{ color: "gray" }}>
                Email (Untuk Login) *
              </IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value!)}
                required
              />
            </IonItem>

            <IonItem lines="full">
              <IonLabel position="stacked" style={{ color: "gray" }}>
                Password (Min. 6 Karakter) *
              </IonLabel>
              <IonInput
                type={showPwd ? "text" : "password"}
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
                required
              />
              <IonButton
                fill="clear"
                slot="end"
                onClick={() => setShowPwd(!showPwd)}
                style={{ marginTop: "auto" }}
              >
                <IonIcon
                  icon={showPwd ? eyeOffOutline : eyeOutline}
                  slot="icon-only"
                  color="medium"
                />
              </IonButton>
            </IonItem>

            <IonItem lines="full">
              <IonLabel position="stacked" style={{ color: "gray" }}>
                Konfirmasi Password *
              </IonLabel>
              <IonInput
                type={showConfirmPwd ? "text" : "password"}
                value={confirmPassword}
                onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                required
              />
              <IonButton
                fill="clear"
                slot="end"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                style={{ marginTop: "auto" }}
              >
                <IonIcon
                  icon={showConfirmPwd ? eyeOffOutline : eyeOutline}
                  slot="icon-only"
                  color="medium"
                />
              </IonButton>
            </IonItem>

            <IonItem lines="full">
              <IonLabel position="stacked" style={{ color: "gray" }}>
                Role / Divisi *
              </IonLabel>
              <IonSelect
                value={roleId}
                onIonChange={(e) => setRoleId(e.detail.value)}
                interface="popover"
              >
                {roles.map((role) => (
                  <IonSelectOption key={role.id} value={role.id}>
                    {role.nama_role}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonItem lines="none">
              <IonLabel position="stacked" style={{ color: "gray" }}>
                Status Akun *
              </IonLabel>
              <IonSelect
                value={statusAktif}
                onIonChange={(e) => setStatusAktif(e.detail.value)}
                interface="popover"
              >
                <IonSelectOption value={true}>Aktif</IonSelectOption>
                <IonSelectOption value={false}>Nonaktif</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>

          <IonButton
            expand="block"
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: "30px",
              "--border-radius": "8px",
              height: "50px",
            }}
          >
            {isLoading ? <IonSpinner name="dots" /> : <b>Simpan Pengguna</b>}
          </IonButton>
        </form>
        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={3000}
          color={toastMsg.includes("berhasil") ? "success" : "danger"}
        />
      </IonContent>
    </IonPage>
  );
};
export default AddUser;
