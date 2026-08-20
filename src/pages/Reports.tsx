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
  IonBadge,
  IonSpinner,
  IonText,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonToast,
} from "@ionic/react";
import {
  downloadOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from "ionicons/icons";
import { useIonViewWillEnter } from "@ionic/react";
import { saveAs } from "file-saver";
import api from "../api";

interface ReportItem {
  id: string;
  nama_lengkap: string;
  nama_role: string;
  total_tugas: number;
  tugas_selesai: number;
  tugas_pending: number;
  tugas_gagal: number;
  produktivitas: number;
  poin: number;
}
interface AuditItem {
  id: string;
  aktor: string;
  aksi: string;
  detail: string;
  waktu: string;
}

const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [tabMode, setTabMode] = useState("produktivitas");
  const [userRole, setUserRole] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resReports = await api.get<ReportItem[]>("/reports");

      const filteredReports = resReports.data.filter(
        (item) =>
          !["Super Admin", "Super HR", "Manajemen"].includes(item.nama_role),
      );

      setReports(filteredReports.sort((a, b) => b.poin - a.poin));

      const storedUser = localStorage.getItem("centrawork_user");
      if (storedUser) {
        const role = JSON.parse(storedUser).role;
        setUserRole(role);
        if (role === "Super Admin" || role === "Super HR") {
          const resAudit = await api.get<AuditItem[]>("/audit-logs");
          setAuditLogs(resAudit.data);
        }
      }
    } catch {
      console.error("Gagal menarik data.");
    } finally {
      setIsLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchData();
  });

  const downloadExcel = async () => {
    setToastMsg("Sedang membuat file Excel...");
    try {
      const response = await api.get("/reports/export", {
        responseType: "blob",
      });
      saveAs(response.data, "Laporan_Produktivitas_CentraWork.xlsx");
      setToastMsg("Excel berhasil diunduh!");
    } catch {
      setToastMsg("Gagal mengunduh Excel.");
    }
  };

  const isExecutive = userRole === "Super Admin" || userRole === "Super HR";

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>
            <b>{isExecutive ? "Laporan, Ranking & Log Sistem" : "Ranking"}</b>
          </IonTitle>
        </IonToolbar>

        {isExecutive && (
          <IonToolbar color="primary">
            <IonSegment
              value={tabMode}
              onIonChange={(e) => setTabMode(e.detail.value as string)}
              color="light"
            >
              <IonSegmentButton value="produktivitas">
                <IonLabel>Produktivitas</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="audit">
                <IonLabel>Log Aktivitas</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <>
            {tabMode === "produktivitas" && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <IonText color="dark">
                    <h4
                      style={{
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                        margin: 0,
                      }}
                    >
                      Ranking Karyawan
                    </h4>
                  </IonText>
                  {isExecutive && (
                    <IonButton
                      size="small"
                      color="success"
                      onClick={downloadExcel}
                    >
                      <IonIcon icon={downloadOutline} slot="start" /> Export
                      Excel
                    </IonButton>
                  )}
                </div>

                <IonList style={{ background: "transparent" }} lines="none">
                  {reports.length === 0 ? (
                    <p
                      style={{
                        textAlign: "center",
                        color: "gray",
                        marginTop: "20px",
                      }}
                    >
                      Belum ada data ranking karyawan.
                    </p>
                  ) : (
                    reports.map((item, index) => (
                      <IonItem
                        key={item.id}
                        style={{
                          marginBottom: "10px",
                          borderRadius: "12px",
                          "--background": "#ffffff",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div
                          slot="start"
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            color:
                              index === 0
                                ? "#FFD700"
                                : index === 1
                                  ? "#C0C0C0"
                                  : index === 2
                                    ? "#CD7F32"
                                    : "gray",
                            width: "30px",
                            textAlign: "center",
                          }}
                        >
                          #{index + 1}
                        </div>
                        <IonLabel>
                          <h2
                            style={{
                              fontWeight: "bold",
                              fontSize: "1.1rem",
                              color: "#1f1f1f",
                            }}
                          >
                            {item.nama_lengkap}
                          </h2>
                          <p style={{ color: "gray", fontSize: "0.85rem" }}>
                            {item.nama_role}
                          </p>
                          <div
                            style={{
                              marginTop: "8px",
                              display: "flex",
                              gap: "8px",
                            }}
                          >
                            <IonBadge
                              color={
                                item.produktivitas >= 80
                                  ? "success"
                                  : item.produktivitas >= 50
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              Prod: {item.produktivitas}%
                            </IonBadge>
                            <IonBadge color="primary">
                              Poin: {item.poin}
                            </IonBadge>
                          </div>
                        </IonLabel>
                        <div slot="end" style={{ textAlign: "right" }}>
                          <IonText color="dark">
                            <h3
                              style={{
                                margin: 0,
                                fontWeight: "bold",
                                fontSize: "1.2rem",
                              }}
                            >
                              {item.tugas_selesai} / {item.total_tugas}
                            </h3>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.75rem",
                                color: "gray",
                              }}
                            >
                              Selesai
                            </p>
                          </IonText>
                          <div
                            style={{
                              display: "flex",
                              gap: "5px",
                              marginTop: "5px",
                              justifyContent: "flex-end",
                            }}
                          >
                            <IonBadge
                              color="warning"
                              style={{ fontSize: "0.65rem" }}
                            >
                              {item.tugas_pending} P
                            </IonBadge>
                            <IonBadge
                              color="danger"
                              style={{ fontSize: "0.65rem" }}
                            >
                              {item.tugas_gagal} G
                            </IonBadge>
                          </div>
                        </div>
                      </IonItem>
                    ))
                  )}
                </IonList>
              </>
            )}

            {tabMode === "audit" && isExecutive && (
              <>
                <div style={{ marginBottom: "15px" }}>
                  <IonText color="dark">
                    <h4
                      style={{
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                        margin: 0,
                      }}
                    >
                      Jejak Audit Sistem (Live)
                    </h4>
                  </IonText>
                  <p
                    style={{
                      color: "gray",
                      fontSize: "0.85rem",
                      margin: "5px 0 0 0",
                    }}
                  >
                    Merekam seluruh aksi krusial.
                  </p>
                </div>
                <IonList style={{ background: "transparent" }} lines="none">
                  {auditLogs.map((log) => (
                    <IonItem
                      key={log.id}
                      style={{
                        marginBottom: "10px",
                        borderRadius: "12px",
                        "--background": "#ffffff",
                        borderLeft: "4px solid #3880ff",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                      }}
                    >
                      <IonLabel className="ion-text-wrap">
                        <h2
                          style={{
                            fontWeight: "bold",
                            color: "#1f1f1f",
                            fontSize: "1rem",
                          }}
                        >
                          {log.aksi}
                        </h2>
                        <p
                          style={{
                            color: "#444444",
                            fontSize: "0.9rem",
                            margin: "4px 0",
                          }}
                        >
                          {log.detail}
                        </p>
                        <p
                          style={{
                            color: "gray",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            marginTop: "6px",
                          }}
                        >
                          <IonIcon icon={shieldCheckmarkOutline} /> {log.aktor}{" "}
                          •{" "}
                          <IonIcon
                            icon={timeOutline}
                            style={{ marginLeft: "5px" }}
                          />{" "}
                          {new Date(log.waktu).toLocaleString("id-ID")}
                        </p>
                      </IonLabel>
                    </IonItem>
                  ))}
                  {auditLogs.length === 0 && (
                    <p
                      style={{
                        textAlign: "center",
                        color: "gray",
                        marginTop: "20px",
                      }}
                    >
                      Belum ada rekaman aktivitas.
                    </p>
                  )}
                </IonList>
              </>
            )}
          </>
        )}
        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={2500}
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};
export default Reports;
