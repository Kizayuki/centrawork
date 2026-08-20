import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  useIonToast,
} from "@ionic/react";
import { eyeOutline, eyeOffOutline, logInOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import api from "../api";

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appName, setAppName] = useState("Centra Work");
  const [present] = useIonToast();

  useEffect(() => {
    const updateName = () => {
      const storedName = localStorage.getItem("centrawork_app_name");
      if (storedName) {
        setAppName(storedName);
        document.title = storedName;
      }
    };
    updateName();
    window.addEventListener("app_name_changed", updateName);
    return () => window.removeEventListener("app_name_changed", updateName);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      present({
        message: "Email dan Password wajib diisi!",
        duration: 2500,
        color: "warning",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      localStorage.setItem("centrawork_token", response.data.token);
      localStorage.setItem(
        "centrawork_user",
        JSON.stringify(response.data.user),
      );

      const userLevel = response.data.user.level_akses;

      present({
        message: "Berhasil Login! Selamat datang.",
        duration: 2500,
        color: "success",
        position: "top",
      });

      if (userLevel === 0) {
        history.replace("/company-management");
      } else {
        history.replace("/tab/dashboard");
      }
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      present({
        message: err.response?.data?.error || "Gagal terhubung ke server.",
        duration: 2500,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            maxWidth: "400px",
            margin: "0 auto",
          }}
        >
          <div className="ion-text-center" style={{ marginBottom: "40px" }}>
            <h1
              style={{
                color: "#3880ff",
                fontWeight: "bold",
                fontSize: "2.8rem",
                margin: "0 0 10px 0",
              }}
            >
              {appName}
            </h1>
            <p style={{ color: "gray", fontSize: "1.1rem", margin: 0 }}>
              Sistem Manajemen Kinerja Tim
            </p>
          </div>

          <div
            style={{
              width: "100%",
              backgroundColor: "white",
              padding: "25px",
              borderRadius: "16px",
              boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                padding: "5px 15px",
                marginBottom: "15px",
              }}
            >
              <IonInput
                type="email"
                placeholder="Masukkan Email Anda"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value!)}
                label="Alamat Email"
                labelPlacement="stacked"
              />
            </div>

            <div
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "10px",
                padding: "5px 15px",
                marginBottom: "25px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <IonInput
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan Password Anda"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value!)}
                label="Kata Sandi"
                labelPlacement="stacked"
                style={{ flex: 1 }}
              />
              <IonIcon
                icon={showPassword ? eyeOffOutline : eyeOutline}
                style={{
                  fontSize: "1.5rem",
                  color: "gray",
                  cursor: "pointer",
                  padding: "10px",
                }}
                onClick={() => setShowPassword(!showPassword)}
              />
            </div>

            <IonButton
              expand="block"
              onClick={handleLogin}
              disabled={isLoading}
              style={{
                "--border-radius": "10px",
                height: "50px",
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}
            >
              {isLoading ? (
                <IonSpinner name="crescent" />
              ) : (
                <>
                  <IonIcon icon={logInOutline} slot="start" /> MASUK AKUN
                </>
              )}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};
export default Login;
