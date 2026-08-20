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
  IonDatetime,
  IonModal,
  IonToggle,
  IonInput,
} from "@ionic/react";
import {
  lockClosedOutline,
  saveOutline,
  calendarOutline,
  serverOutline,
} from "ionicons/icons";
import { useIonViewWillEnter } from "@ionic/react";
import api from "../api";

interface SystemSettings {
  id: number;
  masa_sewa_habis: string | null;
}

const TenantManagement: React.FC = () => {
  const [masaSewa, setMasaSewa] = useState<string>("");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<SystemSettings>("/settings/sewa");
      if (res.data.masa_sewa_habis) {
        setMasaSewa(res.data.masa_sewa_habis);
        setIsUnlimited(false);
      } else {
        setIsUnlimited(true);
      }
    } catch (error) {
      console.error(error);
      setToastMsg("Akses Ditolak. Halaman ini khusus Manajemen.");
    } finally {
      setIsLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchData();
  });

  const formatTanggalLokal = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put("/settings/sewa", {
        masa_sewa_habis: isUnlimited ? null : masaSewa,
      });
      setToastMsg("Masa sewa berhasil diupdate!");
      fetchData();
    } catch (error) {
      console.error(error);
      setToastMsg("Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="dark">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            <b>Panel Manajemen Sewa</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <>
            <div
              style={{
                backgroundColor: "#1f1f1f",
                padding: "20px",
                borderRadius: "12px",
                textAlign: "center",
                marginBottom: "20px",
                color: "white",
              }}
            >
              <IonIcon
                icon={serverOutline}
                style={{ fontSize: "3rem", color: "#FFD700" }}
              />
              <h2 style={{ fontWeight: "bold", margin: "10px 0" }}>
                Kontrol Sistem Terpusat
              </h2>
              <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: 0 }}>
                Atur masa aktif aplikasi untuk penyewa. Jika masa sewa habis,
                seluruh karyawan penyewa akan otomatis terblokir.
              </p>
            </div>

            <IonList
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <IonItem lines="full">
                <IonIcon
                  icon={lockClosedOutline}
                  slot="start"
                  color="primary"
                />
                <IonLabel>Status Sewa (Tanpa Batas)</IonLabel>
                <IonToggle
                  slot="end"
                  checked={isUnlimited}
                  onIonChange={(e) => setIsUnlimited(e.detail.checked)}
                />
              </IonItem>

              {!isUnlimited && (
                <IonItem
                  lines="none"
                  button
                  onClick={() => setShowPicker(true)}
                >
                  <IonIcon icon={calendarOutline} slot="start" color="danger" />
                  <IonLabel
                    position="stacked"
                    style={{ color: "gray", fontWeight: "bold" }}
                  >
                    Tanggal Berakhirnya Sewa
                  </IonLabel>
                  <IonInput
                    value={formatTanggalLokal(masaSewa)}
                    readonly
                    placeholder="-- Pilih Tanggal Blokir --"
                    style={{ pointerEvents: "none" }}
                  />
                </IonItem>
              )}
            </IonList>

            <IonModal
              isOpen={showPicker}
              onDidDismiss={() => setShowPicker(false)}
              initialBreakpoint={0.65}
              breakpoints={[0, 0.65, 0.8]}
            >
              <IonContent className="ion-padding ion-text-center">
                <IonDatetime
                  presentation="date"
                  value={masaSewa}
                  onIonChange={(e) => setMasaSewa(e.detail.value as string)}
                  style={{
                    margin: "0 auto",
                    borderRadius: "12px",
                    width: "100%",
                  }}
                />
                <IonButton
                  expand="block"
                  color="dark"
                  onClick={() => setShowPicker(false)}
                  style={{
                    marginTop: "20px",
                    "--border-radius": "10px",
                    height: "50px",
                  }}
                >
                  <b>Selesai Pilih Tanggal</b>
                </IonButton>
              </IonContent>
            </IonModal>

            <IonButton
              expand="block"
              color="primary"
              onClick={handleSave}
              disabled={isSaving || (!isUnlimited && !masaSewa)}
              style={{
                marginTop: "30px",
                "--border-radius": "10px",
                height: "50px",
              }}
            >
              {isSaving ? (
                <IonSpinner name="dots" />
              ) : (
                <>
                  <IonIcon icon={saveOutline} slot="start" />{" "}
                  <b>Terapkan Aturan Sewa</b>
                </>
              )}
            </IonButton>
          </>
        )}
        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={2500}
          color="dark"
        />
      </IonContent>
    </IonPage>
  );
};
export default TenantManagement;
