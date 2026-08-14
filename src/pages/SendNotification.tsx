import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonToast,
  IonSpinner,
  IonList,
  IonText,
  useIonViewWillEnter,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import api from "../api";

interface RoleItem {
  id: number;
  nama_role: string;
}

const SendNotification: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [judul, setJudul] = useState("");
  const [pesan, setPesan] = useState("");
  const [targetPenerima, setTargetPenerima] = useState<string>("semua");
  const [roles, setRoles] = useState<RoleItem[]>([]);

  useIonViewWillEnter(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get<RoleItem[]>("/roles");
        setRoles(response.data);
      } catch {
        console.error("Gagal menarik divisi");
      }
    };
    fetchRoles();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/notifications/broadcast", {
        judul,
        pesan,
        targetPenerima,
      });

      setToastMsg(response.data.message || "Berhasil dikirim!");
      setJudul("");
      setPesan("");
      setTimeout(() => history.push("/tab/dashboard"), 1500);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setToastMsg(
        error.response?.data?.error || "Gagal menyiarkan pengumuman.",
      );
    } finally {
      setIsLoading(false);
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
            <b>Kirim Pengumuman</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        <div style={{ marginBottom: "20px" }}>
          <IonText color="dark">
            <h4 style={{ fontWeight: "bold", fontSize: "1.1rem", margin: 0 }}>
              Siaran Notifikasi
            </h4>
            <p
              style={{ color: "gray", fontSize: "0.9rem", margin: "5px 0 0 0" }}
            >
              Kirim pesan popup langsung ke layar tim
            </p>
          </IonText>
        </div>

        <form onSubmit={handleSubmit}>
          <IonList
            style={{
              borderRadius: "12px",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            }}
          >
            <IonItem lines="full">
              <IonLabel position="stacked" style={{ color: "gray" }}>
                Judul Pengumuman *
              </IonLabel>
              <IonInput
                placeholder="Contoh: Rapat Dadakan"
                value={judul}
                onIonInput={(e) => setJudul(e.detail.value!)}
                required
              />
            </IonItem>
            <IonItem lines="full">
              <IonLabel position="stacked" style={{ color: "gray" }}>
                Isi Pesan *
              </IonLabel>
              <IonTextarea
                placeholder="Tuliskan isi pengumuman..."
                value={pesan}
                onIonInput={(e) => setPesan(e.detail.value!)}
                rows={4}
                required
              />
            </IonItem>
            <IonItem lines="none">
              <IonLabel position="stacked" style={{ color: "gray" }}>
                Target Penerima *
              </IonLabel>
              <IonSelect
                value={targetPenerima}
                onIonChange={(e) => setTargetPenerima(e.detail.value)}
                interface="action-sheet"
              >
                <IonSelectOption value="semua">Semua Karyawan</IonSelectOption>
                {roles.map((role) => (
                  <IonSelectOption key={role.id} value={role.id.toString()}>
                    Hanya Divisi {role.nama_role}
                  </IonSelectOption>
                ))}
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
            {isLoading ? (
              <IonSpinner name="dots" color="light" />
            ) : (
              <b>Kirim Sekarang</b>
            )}
          </IonButton>
        </form>

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={3000}
          color={
            toastMsg.includes("Berhasil") || toastMsg.includes("Terkirim")
              ? "success"
              : "danger"
          }
        />
      </IonContent>
    </IonPage>
  );
};
export default SendNotification;
