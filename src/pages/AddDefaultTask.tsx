import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonToast,
  IonSpinner,
  IonDatetime,
  IonModal,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import api from "../api";

interface Role {
  id: number;
  nama_role: string;
}

const AddDefaultTask: React.FC = () => {
  const history = useHistory();
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");
  const [jamTenggat, setJamTenggat] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get<Role[]>("/roles");
        setRoles(res.data);
      } catch {
        console.error("Gagal menarik divisi");
      }
    };
    fetchRoles();
  }, []);

  const getFormattedTime = (val: string) => {
    if (!val) return "";
    if (val.includes("T")) {
      const d = new Date(val);
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    }
    return val;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/default-tasks", {
        judul_tugas: judul,
        deskripsi,
        target_role_id: Number(roleId),
        jam_tenggat: getFormattedTime(jamTenggat) || null,
        status_aktif: true,
      });
      setToastMsg("Tugas rutin berhasil disimpan!");
      setTimeout(() => history.goBack(), 1000);
    } catch {
      setToastMsg("Gagal menyimpan tugas rutin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/default-tasks" />
          </IonButtons>
          <IonTitle>
            <b>Tambah Tugas Rutin</b>
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
              padding: "10px 0",
            }}
          >
            <IonItem lines="full">
              <IonLabel
                position="stacked"
                style={{ color: "gray", fontWeight: "bold" }}
              >
                Judul Tugas *
              </IonLabel>
              <IonInput
                value={judul}
                onIonInput={(e) => setJudul(e.detail.value!)}
                required
              />
            </IonItem>
            <IonItem lines="full">
              <IonLabel
                position="stacked"
                style={{ color: "gray", fontWeight: "bold" }}
              >
                Deskripsi / Instruksi
              </IonLabel>
              <IonTextarea
                value={deskripsi}
                onIonInput={(e) => setDeskripsi(e.detail.value!)}
                rows={4}
              />
            </IonItem>

            <IonItem
              lines="full"
              button
              onClick={() => setShowTimePicker(true)}
            >
              <IonLabel
                position="stacked"
                style={{ color: "gray", fontWeight: "bold" }}
              >
                Jam Tenggat Harian (Opsional)
              </IonLabel>
              <IonInput
                value={getFormattedTime(jamTenggat)}
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
                  value={jamTenggat}
                  onIonChange={(e) => setJamTenggat(e.detail.value as string)}
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

            <IonItem lines="none" style={{ backgroundColor: "#f0f8ff" }}>
              <IonLabel
                position="stacked"
                style={{ color: "#3880ff", fontWeight: "bold" }}
              >
                Target Divisi *
              </IonLabel>
              <IonSelect
                value={roleId}
                onIonChange={(e) => setRoleId(e.detail.value)}
                placeholder="-- Pilih Divisi --"
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
          </IonList>

          <IonButton
            expand="block"
            type="submit"
            disabled={isLoading || roleId === ""}
            style={{
              marginTop: "30px",
              "--border-radius": "8px",
              height: "50px",
            }}
          >
            {isLoading ? (
              <IonSpinner name="dots" color="light" />
            ) : (
              <b>Simpan Tugas Rutin</b>
            )}
          </IonButton>
        </form>
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
export default AddDefaultTask;
