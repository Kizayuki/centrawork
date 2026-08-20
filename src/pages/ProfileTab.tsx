import React, { useState, useEffect, useRef } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonAvatar,
  IonButtons,
  IonMenuButton,
  IonText,
  useIonActionSheet,
  IonToast,
  IonSpinner,
  useIonToast,
  IonAlert,
} from "@ionic/react";
import {
  logOutOutline,
  cameraOutline,
  lockClosedOutline,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import api from "../api";

interface UserData {
  id: string;
  nama_lengkap: string;
  email: string;
  role: string;
  foto_profil?: string;
}

const ProfileTab: React.FC = () => {
  const history = useHistory();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(
    "https://ionicframework.com/docs/img/demos/avatar.svg",
  );
  const [isLoadingPic, setIsLoadingPic] = useState(false);
  const [presentActionSheet] = useIonActionSheet();
  const [toastMsg, setToastMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [presentGlobalToast] = useIonToast();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = localStorage.getItem("centrawork_user");
        if (storedUser) setUserData(JSON.parse(storedUser));
      } catch {
        console.warn("Memori lokal rusak.");
      }

      try {
        const response = await api.get("/dashboard");
        if (response.data && response.data.profile) {
          const freshProfile = response.data.profile;

          const roleName =
            typeof freshProfile.role === "object" && freshProfile.role !== null
              ? freshProfile.role.nama_role
              : freshProfile.role;

          const normalizedProfile: UserData = {
            id: freshProfile.id,
            nama_lengkap: freshProfile.nama_lengkap,
            email: freshProfile.email,
            role: roleName,
            foto_profil: freshProfile.foto_profil,
          };

          setUserData(normalizedProfile);
          if (normalizedProfile.foto_profil) {
            setAvatarUrl(normalizedProfile.foto_profil);
          }
        }
      } catch {
        console.error("Gagal menarik profil terbaru.");
      }
    };

    loadUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("centrawork_token");
    localStorage.removeItem("centrawork_user");

    presentGlobalToast({
      message: "Berhasil keluar dari akun.",
      duration: 2500,
      color: "medium",
      position: "top",
    });

    history.replace("/login");
  };

  const openPhotoOptions = () => {
    presentActionSheet({
      header: "Ubah Foto Profil",
      buttons: [
        {
          text: "Pilih dari Galeri / Kamera",
          handler: () => fileInputRef.current?.click(),
        },
        { text: "Batal", role: "cancel" },
      ],
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData) return;

    setIsLoadingPic(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 400;
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

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setAvatarUrl(compressedBase64);

        try {
          await api.put(`/users/${userData.id}/photo`, {
            foto_profil: compressedBase64,
          });

          const storedUser = localStorage.getItem("centrawork_user");
          if (storedUser) {
            try {
              const updatedUser = {
                ...JSON.parse(storedUser),
                foto_profil: compressedBase64,
              };
              localStorage.setItem(
                "centrawork_user",
                JSON.stringify(updatedUser),
              );
            } catch {
              /* Abaikan eror */
            }
          }

          setToastMsg("Foto profil berhasil disimpan ke sistem!");
        } catch {
          setToastMsg("Gagal mengunggah foto ke database.");
        } finally {
          setIsLoadingPic(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            <b>Profil Saya</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <div className="ion-text-center" style={{ margin: "30px 0 40px 0" }}>
          <div
            style={{
              position: "relative",
              width: "120px",
              height: "120px",
              margin: "0 auto",
            }}
          >
            <IonAvatar
              style={{
                width: "100%",
                height: "100%",
                border: "4px solid white",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }}
            >
              {isLoadingPic ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#e0e0e0",
                  }}
                >
                  <IonSpinner name="crescent" color="primary" />
                </div>
              ) : (
                <img
                  alt="Foto Profil"
                  src={avatarUrl}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              )}
            </IonAvatar>

            <div
              onClick={openPhotoOptions}
              style={{
                position: "absolute",
                bottom: "0",
                right: "0",
                backgroundColor: "#3880ff",
                borderRadius: "50%",
                padding: "10px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <IonIcon
                icon={cameraOutline}
                style={{ color: "white", fontSize: "1.4rem" }}
              />
            </div>
          </div>

          <h2
            style={{
              fontWeight: "bold",
              marginTop: "20px",
              color: "#1f1f1f",
              fontSize: "1.5rem",
            }}
          >
            {userData?.nama_lengkap || "Memuat..."}
          </h2>
          <IonText color="medium">
            <p style={{ margin: "5px 0" }}>{userData?.email}</p>
          </IonText>
          <IonText color="primary">
            <p style={{ margin: 0, fontWeight: "bold" }}>{userData?.role}</p>
          </IonText>
        </div>

        <IonButton
          expand="block"
          color="light"
          routerLink="/change-password"
          style={{
            marginBottom: "15px",
            "--border-radius": "10px",
            height: "50px",
          }}
        >
          <IonIcon slot="start" icon={lockClosedOutline} color="warning" />
          <b>Ganti Password</b>
        </IonButton>

        <IonButton
          expand="block"
          color="danger"
          fill="outline"
          onClick={() => setShowLogoutAlert(true)}
          style={{
            "--border-radius": "10px",
            borderWidth: "2px",
            height: "50px",
          }}
        >
          <IonIcon slot="start" icon={logOutOutline} />
          <b>Keluar Akun</b>
        </IonButton>

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Konfirmasi Keluar"
          message="Apakah Anda yakin ingin keluar dari akun ini?"
          buttons={[
            {
              text: "Batal",
              role: "cancel",
            },
            {
              text: "Ya, Keluar",
              role: "destructive",
              handler: handleLogout,
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

export default ProfileTab;
