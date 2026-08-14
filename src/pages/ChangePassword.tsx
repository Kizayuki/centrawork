import React, { useState } from "react";
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
  IonButton,
  IonIcon,
  IonToast,
  IonSpinner,
} from "@ionic/react";
import { saveOutline, eyeOutline, eyeOffOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import api from "../api";

const ChangePassword: React.FC = () => {
  const history = useHistory();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleSave = async () => {
    if (newPassword !== confirmPassword) {
      setToastMsg("Password baru dan konfirmasi tidak cocok!");
      return;
    }
    setIsLoading(true);
    try {
      await api.put("/auth/password", { currentPassword, newPassword });
      setToastMsg("Berhasil! Password telah diganti.");
      setTimeout(() => history.goBack(), 1500);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setToastMsg(err.response?.data?.error || "Gagal mengubah password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab/profile" />
          </IonButtons>
          <IonTitle>
            <b>Ganti Password</b>
          </IonTitle>
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
            marginTop: "20px",
          }}
        >
          <IonItem lines="full">
            <IonLabel position="stacked" style={{ color: "gray" }}>
              Password Saat Ini
            </IonLabel>
            <IonInput
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onIonInput={(e) => setCurrentPassword(e.detail.value!)}
            />
            <IonButton
              fill="clear"
              slot="end"
              onClick={() => setShowCurrent(!showCurrent)}
              style={{ marginTop: "auto" }}
            >
              <IonIcon
                icon={showCurrent ? eyeOffOutline : eyeOutline}
                slot="icon-only"
                color="medium"
              />
            </IonButton>
          </IonItem>

          <IonItem lines="full">
            <IonLabel position="stacked" style={{ color: "gray" }}>
              Password Baru
            </IonLabel>
            <IonInput
              type={showNew ? "text" : "password"}
              value={newPassword}
              onIonInput={(e) => setNewPassword(e.detail.value!)}
            />
            <IonButton
              fill="clear"
              slot="end"
              onClick={() => setShowNew(!showNew)}
              style={{ marginTop: "auto" }}
            >
              <IonIcon
                icon={showNew ? eyeOffOutline : eyeOutline}
                slot="icon-only"
                color="medium"
              />
            </IonButton>
          </IonItem>

          <IonItem lines="none">
            <IonLabel position="stacked" style={{ color: "gray" }}>
              Konfirmasi Password Baru
            </IonLabel>
            <IonInput
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onIonInput={(e) => setConfirmPassword(e.detail.value!)}
            />
            <IonButton
              fill="clear"
              slot="end"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{ marginTop: "auto" }}
            >
              <IonIcon
                icon={showConfirm ? eyeOffOutline : eyeOutline}
                slot="icon-only"
                color="medium"
              />
            </IonButton>
          </IonItem>
        </IonList>
        <IonButton
          expand="block"
          color="primary"
          onClick={handleSave}
          disabled={isLoading || !currentPassword || !newPassword}
          style={{
            marginTop: "30px",
            "--border-radius": "8px",
            height: "50px",
          }}
        >
          {isLoading ? (
            <IonSpinner name="dots" />
          ) : (
            <>
              <IonIcon icon={saveOutline} slot="start" /> Simpan Password
            </>
          )}
        </IonButton>
        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={2500}
          color={toastMsg.includes("Berhasil") ? "success" : "danger"}
        />
      </IonContent>
    </IonPage>
  );
};
export default ChangePassword;
