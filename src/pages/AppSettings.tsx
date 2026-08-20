import React, { useState, useEffect, useRef } from "react";
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
  IonSpinner,
} from "@ionic/react";
import {
  logoWhatsapp,
  colorPaletteOutline,
  informationCircleOutline,
  openOutline,
  desktopOutline,
  saveOutline,
  imageOutline,
} from "ionicons/icons";
import { useIonViewWillEnter } from "@ionic/react";
import api from "../api";

const AppSettings: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [appName, setAppName] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncFavicon = () => {
    const icon = localStorage.getItem("centrawork_app_icon");
    if (icon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = icon;
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const res = await api.get("/company/settings");
      if (res.data.app_name) {
        setAppName(res.data.app_name);
        localStorage.setItem("centrawork_app_name", res.data.app_name);
        document.title = res.data.app_name;
      }
      if (res.data.app_icon) {
        localStorage.setItem("centrawork_app_icon", res.data.app_icon);
        syncFavicon();
      }
    } catch (error) {
      console.error("Gagal menarik pengaturan kustom", error);
    }
  };

  useIonViewWillEnter(() => {
    const storedUser = localStorage.getItem("centrawork_user");
    if (storedUser) setUserRole(JSON.parse(storedUser).role);
    syncFavicon();
    fetchCompanySettings(); // PERBAIKAN: Selalu tarik data terbaru dari database
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

  const handleSaveAppInfo = async () => {
    setIsSaving(true);
    try {
      // PERBAIKAN: Menyimpan nama aplikasi ke Database Perusahaan
      await api.put("/company/settings", { app_name: appName });

      localStorage.setItem("centrawork_app_name", appName);
      document.title = appName;
      window.dispatchEvent(new Event("app_name_changed"));
      setToastMsg("Nama Aplikasi berhasil disimpan ke Sistem!");
    } catch {
      setToastMsg("Gagal menyimpan ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 128;
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

        const base64 = canvas.toDataURL("image/png", 0.8);

        try {
          // PERBAIKAN: Menyimpan ikon ke Database Perusahaan
          await api.put("/company/settings", { app_icon: base64 });
          localStorage.setItem("centrawork_app_icon", base64);
          syncFavicon();
          setToastMsg("Ikon Aplikasi berhasil diubah di Sistem!");
        } catch {
          setToastMsg("Gagal menyimpan ikon ke database.");
        } finally {
          setIsSaving(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleIconChange}
          style={{ display: "none" }}
        />

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
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <IonSpinner name="dots" color="light" />
                  ) : (
                    <IonIcon icon={saveOutline} />
                  )}
                </IonButton>
              </IonItem>

              <IonItem
                lines="full"
                button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                <IonIcon icon={imageOutline} slot="start" color="primary" />
                <IonLabel>Ubah Ikon Aplikasi (Favicon)</IonLabel>
                <IonIcon
                  icon={openOutline}
                  slot="end"
                  color="medium"
                  size="small"
                />
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
            Versi 1.0.0 (SaaS Multi-Tenant Edition)
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
