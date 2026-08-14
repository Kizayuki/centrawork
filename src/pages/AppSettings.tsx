import React, { useState, useEffect } from "react";
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
  IonIcon,
  IonToggle,
  IonText,
  IonInput,
  IonButton,
  IonToast,
} from "@ionic/react";
import {
  logoWhatsapp,
  colorPaletteOutline,
  informationCircleOutline,
  openOutline,
  desktopOutline,
  saveOutline,
} from "ionicons/icons";
import { useIonViewWillEnter } from "@ionic/react";

const AppSettings: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [appName, setAppName] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [userRole, setUserRole] = useState("");

  useIonViewWillEnter(() => {
    const storedUser = localStorage.getItem("centrawork_user");
    if (storedUser) setUserRole(JSON.parse(storedUser).role);
  });

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("dark_mode") === "true";
    setIsDark(savedDarkMode);

    const savedAppName =
      localStorage.getItem("centrawork_app_name") || "Centra Work";
    setAppName(savedAppName);
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setIsDark(checked);
    localStorage.setItem("dark_mode", checked.toString());
    document.body.classList.toggle("dark", checked);
    document.documentElement.classList.toggle("ion-palette-dark", checked);
  };

  const handleSaveAppInfo = () => {
    localStorage.setItem("centrawork_app_name", appName);
    document.title = appName;
    window.dispatchEvent(new Event("app_name_changed"));

    setToastMsg("Nama Aplikasi berhasil disimpan!");
  };

  const openWhatsApp = () => {
    window.open(
      `https://wa.me/6281234567890?text=Halo%20Admin%20Saya%20Butuh%20Bantuan`,
      "_blank",
    );
  };

  const isExecutive = userRole === "Super Admin" || userRole === "Super HR";
  const isSuperAdmin = userRole === "Super Admin";

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            <b>Pengaturan Aplikasi</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        {isExecutive ? (
          <>
            <div style={{ marginBottom: "15px", marginTop: "10px" }}>
              <IonText color="dark">
                <h4
                  style={{ fontWeight: "bold", fontSize: "1.1rem", margin: 0 }}
                >
                  Pengaturan Umum
                </h4>
              </IonText>
            </div>
            <IonList
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                marginBottom: "30px",
              }}
            >
              <IonItem lines="full">
                <IonIcon icon={desktopOutline} slot="start" color="primary" />
                <IonLabel position="stacked" style={{ color: "gray" }}>
                  Nama Aplikasi / Website
                </IonLabel>
                <IonInput
                  value={appName}
                  onIonInput={(e) => setAppName(e.detail.value!)}
                  placeholder="Masukkan nama aplikasi..."
                />
                <IonButton
                  fill="solid"
                  slot="end"
                  onClick={handleSaveAppInfo}
                  style={{ marginTop: "auto" }}
                >
                  <IonIcon icon={saveOutline} />
                </IonButton>
              </IonItem>
              <IonItem lines="none">
                <IonIcon
                  icon={colorPaletteOutline}
                  slot="start"
                  color="primary"
                />
                <IonLabel>Mode Gelap (Dark Mode)</IonLabel>
                <IonToggle
                  slot="end"
                  checked={isDark}
                  onIonChange={(e) => toggleDarkMode(e.detail.checked)}
                />
              </IonItem>
            </IonList>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "15px", marginTop: "10px" }}>
              <IonText color="dark">
                <h4
                  style={{ fontWeight: "bold", fontSize: "1.1rem", margin: 0 }}
                >
                  Preferensi Antarmuka
                </h4>
              </IonText>
            </div>
            <IonList
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                marginBottom: "30px",
              }}
            >
              <IonItem lines="none">
                <IonIcon
                  icon={colorPaletteOutline}
                  slot="start"
                  color="primary"
                />
                <IonLabel>Mode Gelap (Dark Mode)</IonLabel>
                <IonToggle
                  slot="end"
                  checked={isDark}
                  onIonChange={(e) => toggleDarkMode(e.detail.checked)}
                />
              </IonItem>
            </IonList>
          </>
        )}

        {!isSuperAdmin && (
          <>
            <div style={{ marginBottom: "15px" }}>
              <IonText color="dark">
                <h4
                  style={{ fontWeight: "bold", fontSize: "1.1rem", margin: 0 }}
                >
                  Pusat Bantuan
                </h4>
              </IonText>
            </div>
            <IonList
              style={{
                borderRadius: "12px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                marginBottom: "30px",
              }}
            >
              <IonItem button onClick={openWhatsApp} lines="none">
                <IonIcon
                  icon={logoWhatsapp}
                  slot="start"
                  style={{ color: "#25D366" }}
                />
                <IonLabel>
                  <h2>Hubungi Admin</h2>
                  <p>Dapatkan bantuan langsung via chat</p>
                </IonLabel>
                <IonIcon
                  icon={openOutline}
                  slot="end"
                  color="medium"
                  size="small"
                />
              </IonItem>
            </IonList>
          </>
        )}

        <div
          className="ion-text-center"
          style={{ marginTop: "50px", color: "gray" }}
        >
          <IonIcon
            icon={informationCircleOutline}
            style={{ fontSize: "3rem", opacity: 0.5 }}
          />
          <h3 style={{ fontWeight: "bold", margin: "10px 0 5px 0" }}>
            {appName}
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            Versi 1.0.0 (Node.js & MySQL Edition)
          </p>
          <p style={{ margin: "5px 0 0 0", fontSize: "0.8rem", opacity: 0.7 }}>
            &copy; 2026 All Right Reserved
          </p>
        </div>

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
export default AppSettings;
