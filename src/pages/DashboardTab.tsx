import { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  useIonViewWillEnter,
  IonButtons,
  IonMenuButton,
} from "@ionic/react";
import {
  checkmarkCircle,
  timeOutline,
  closeCircle,
  documentText,
} from "ionicons/icons";
import api from "../api";

interface TaskItem {
  status: string;
  task: {
    judul_tugas: string;
    jenis_tugas: string;
  } | null;
}

interface ProfileData {
  nama_lengkap: string;
  role: {
    nama_role: string;
  } | null;
}

interface DashboardResponse {
  profile: ProfileData | null;
  tasks: TaskItem[];
}

const DashboardTab: React.FC = () => {
  const [nama, setNama] = useState("Memuat...");
  const [namaRole, setNamaRole] = useState("Memuat...");
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    selesai: 0,
    pending: 0,
    terlewat: 0,
  });

  const [tugasTerbaru, setTugasTerbaru] = useState<TaskItem[]>([]);

  useIonViewWillEnter(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<DashboardResponse>("/dashboard");
        const { profile, tasks } = response.data;

        if (profile) {
          setNama(profile.nama_lengkap);
          setNamaRole(profile.role?.nama_role || "Divisi Tidak Diketahui");
        }

        if (tasks) {
          const selesaiCount = tasks.filter(
            (t) => t.status === "Selesai",
          ).length;
          const pendingCount = tasks.filter(
            (t) => t.status === "Pending",
          ).length;
          const terlewatCount = tasks.filter(
            (t) => t.status === "Tidak Dikerjakan",
          ).length;

          setStats({
            total: tasks.length,
            selesai: selesaiCount,
            pending: pendingCount,
            terlewat: terlewatCount,
          });

          setTugasTerbaru(tasks.slice(0, 5));
        }
      } catch (error) {
        console.error("Gagal menarik data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  });

  const getBadgeColor = (status: string) => {
    if (status === "Selesai") return "success";
    if (status === "Pending") return "warning";
    return "danger";
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            <b>Dashboard</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
            <p>Memuat data Anda...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
              <IonText color="dark">
                <h2 style={{ margin: 0, fontWeight: "bold" }}>
                  Halo, {nama}! 👋
                </h2>
                <p style={{ margin: "5px 0 0 0", color: "gray" }}>{namaRole}</p>
              </IonText>
            </div>

            <IonText color="dark">
              <h4
                style={{
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  marginBottom: "10px",
                }}
              >
                Statistik Tugas
              </h4>
            </IonText>

            <IonGrid className="ion-no-padding">
              <IonRow>
                <IonCol size="6">
                  <IonCard
                    style={{ margin: "0 5px 10px 0", borderRadius: "12px" }}
                  >
                    <IonCardContent className="ion-text-center">
                      <IonIcon
                        icon={checkmarkCircle}
                        color="success"
                        style={{ fontSize: "2rem" }}
                      />
                      <h2
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          margin: "5px 0",
                          color: "black",
                        }}
                      >
                        {stats.selesai}
                      </h2>
                      <p style={{ margin: 0, fontSize: "0.8rem" }}>Selesai</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard
                    style={{ margin: "0 0 10px 5px", borderRadius: "12px" }}
                  >
                    <IonCardContent className="ion-text-center">
                      <IonIcon
                        icon={timeOutline}
                        color="warning"
                        style={{ fontSize: "2rem" }}
                      />
                      <h2
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          margin: "5px 0",
                          color: "black",
                        }}
                      >
                        {stats.pending}
                      </h2>
                      <p style={{ margin: 0, fontSize: "0.8rem" }}>Pending</p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard
                    style={{ margin: "0 5px 0 0", borderRadius: "12px" }}
                  >
                    <IonCardContent className="ion-text-center">
                      <IonIcon
                        icon={documentText}
                        color="primary"
                        style={{ fontSize: "2rem" }}
                      />
                      <h2
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          margin: "5px 0",
                          color: "black",
                        }}
                      >
                        {stats.total}
                      </h2>
                      <p style={{ margin: 0, fontSize: "0.8rem" }}>
                        Total Tugas
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard
                    style={{ margin: "0 0 0 5px", borderRadius: "12px" }}
                  >
                    <IonCardContent className="ion-text-center">
                      <IonIcon
                        icon={closeCircle}
                        color="danger"
                        style={{ fontSize: "2rem" }}
                      />
                      <h2
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          margin: "5px 0",
                          color: "black",
                        }}
                      >
                        {stats.terlewat}
                      </h2>
                      <p style={{ margin: 0, fontSize: "0.8rem" }}>
                        Tidak Dikerjakan
                      </p>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>

            <div style={{ marginTop: "2rem" }}>
              <IonText color="dark">
                <h4
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    marginBottom: "10px",
                  }}
                >
                  Tugas Terbaru Anda
                </h4>
              </IonText>

              <IonList
                style={{ borderRadius: "12px", background: "transparent" }}
                lines="none"
              >
                {tugasTerbaru.length === 0 ? (
                  <p
                    style={{
                      color: "gray",
                      textAlign: "center",
                      marginTop: "20px",
                    }}
                  >
                    Belum ada tugas untuk saat ini.
                  </p>
                ) : (
                  tugasTerbaru.map((item, index) => (
                    <IonItem
                      key={index}
                      style={{
                        marginBottom: "10px",
                        borderRadius: "10px",
                        "--background": "#ffffff",
                      }}
                    >
                      <IonLabel>
                        <h3 style={{ fontWeight: "bold" }}>
                          {item.task?.judul_tugas}
                        </h3>
                        <p>Sumber: {item.task?.jenis_tugas}</p>
                      </IonLabel>
                      <IonBadge color={getBadgeColor(item.status)}>
                        {item.status}
                      </IonBadge>
                    </IonItem>
                  ))
                )}
              </IonList>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DashboardTab;
