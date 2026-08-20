import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
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
  IonDatetime,
  IonModal,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import api from "../api";

interface UserData {
  id: string;
  nama_lengkap: string;
  role: { nama_role: string; level_akses: number } | null;
}

const AddTask: React.FC = () => {
  const history = useHistory();
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [jenisTugas, setJenisTugas] = useState("Mandiri");
  const [tenggatWaktu, setTenggatWaktu] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [penerimaId, setPenerimaId] = useState<string[]>([]);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [currentUserLevel, setCurrentUserLevel] = useState(10);
  const [currentUserId, setCurrentUserId] = useState("");
  const [canDelegate, setCanDelegate] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("centrawork_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUserId(user.id);
      if (user.level_akses !== undefined) {
        setCurrentUserLevel(user.level_akses);
        if (user.level_akses <= 3) setCanDelegate(true);
      }
    }
    const fetchUsers = async () => {
      try {
        const response = await api.get<UserData[]>("/users");
        setUsersList(response.data);
      } catch {
        console.error("Gagal memuat daftar pengguna");
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/tasks", {
        judul_tugas: judul,
        deskripsi,
        jenis_tugas: jenisTugas,
        penerima_id: penerimaId,
        tenggat_waktu: tenggatWaktu ? tenggatWaktu : null,
      });
      setToastMsg("Tugas berhasil ditambahkan!");
      setTimeout(() => history.goBack(), 1000);
    } catch {
      setToastMsg("Gagal menyimpan tugas.");
    } finally {
      setIsLoading(false);
    }
  };

  const delegasiUsers = usersList.filter((user) => {
    if (user.id === currentUserId) return false;
    if (user.role && user.role.level_akses !== undefined)
      return user.role.level_akses > currentUserLevel;
    return false;
  });

  const formatTanggalLokal = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab/tasks" />
          </IonButtons>
          <IonTitle>
            <b>Buat Tugas Baru</b>
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
                placeholder="Contoh: Membuat laporan bulanan"
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
                placeholder="Tuliskan detail pekerjaan di sini..."
                value={deskripsi}
                onIonInput={(e) => setDeskripsi(e.detail.value!)}
                rows={4}
              />
            </IonItem>

            <IonItem lines="full" button onClick={() => setShowPicker(true)}>
              <IonLabel
                position="stacked"
                style={{ color: "gray", fontWeight: "bold" }}
              >
                Tenggat Penyelesaian (Batas Akhir Hari)
              </IonLabel>
              <IonInput
                value={formatTanggalLokal(tenggatWaktu)}
                readonly
                placeholder="-- Pilih Tanggal --"
                style={{ pointerEvents: "none" }}
              />
            </IonItem>

            <IonModal
              isOpen={showPicker}
              onDidDismiss={() => setShowPicker(false)}
              initialBreakpoint={0.65}
              breakpoints={[0, 0.65, 0.8]}
            >
              <IonContent className="ion-padding ion-text-center">
                <IonDatetime
                  presentation="date"
                  value={tenggatWaktu}
                  onIonChange={(e) => setTenggatWaktu(e.detail.value as string)}
                  style={{
                    margin: "0 auto",
                    borderRadius: "12px",
                    width: "100%",
                  }}
                />

                <IonButton
                  expand="block"
                  onClick={() => setShowPicker(false)}
                  style={{
                    marginTop: "20px",
                    marginBottom: "40px",
                    "--border-radius": "10px",
                    height: "50px",
                  }}
                >
                  <b>Selesai Pilih Waktu</b>
                </IonButton>
              </IonContent>
            </IonModal>

            <IonItem lines="full">
              <IonLabel
                position="stacked"
                style={{ color: "gray", fontWeight: "bold" }}
              >
                Jenis Tugas *
              </IonLabel>
              <IonSelect
                value={jenisTugas}
                onIonChange={(e) => {
                  setJenisTugas(e.detail.value);
                  if (e.detail.value === "Mandiri") setPenerimaId([]);
                }}
                interface="action-sheet"
              >
                <IonSelectOption value="Mandiri">
                  Tugas Mandiri (Kerjakan Sendiri)
                </IonSelectOption>
                {canDelegate && (
                  <IonSelectOption value="Delegasi">
                    Delegasi (Tugaskan ke Bawah)
                  </IonSelectOption>
                )}
              </IonSelect>
            </IonItem>

            {jenisTugas === "Delegasi" && (
              <>
                <IonItem lines="none" style={{ backgroundColor: "#f0f8ff" }}>
                  <IonLabel
                    position="stacked"
                    style={{ color: "#3880ff", fontWeight: "bold" }}
                  >
                    Pilih Karyawan Penerima *
                  </IonLabel>
                  <IonSelect
                    multiple={true}
                    value={penerimaId}
                    onIonChange={(e) => setPenerimaId(e.detail.value)}
                    placeholder="-- Ketuk untuk memilih --"
                    interface="alert"
                    selectedText={
                      penerimaId.length > 0
                        ? `${penerimaId.length} Orang Terpilih`
                        : ""
                    }
                  >
                    {delegasiUsers.map((user) => (
                      <IonSelectOption key={user.id} value={user.id}>
                        {user.nama_lengkap} ({user.role?.nama_role})
                      </IonSelectOption>
                    ))}
                    {delegasiUsers.length === 0 && (
                      <IonSelectOption disabled>
                        -- Tidak ada bawahan yang tersedia --
                      </IonSelectOption>
                    )}
                  </IonSelect>
                </IonItem>

                {penerimaId.length > 0 && (
                  <div
                    style={{
                      backgroundColor: "#e8f0fe",
                      padding: "10px 15px",
                      borderTop: "1px solid #d4e3fc",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 8px 0",
                        fontSize: "0.85rem",
                        color: "#3880ff",
                        fontWeight: "bold",
                      }}
                    >
                      Karyawan Yang Ditugaskan:
                    </p>
                    {penerimaId.map((id) => {
                      const u = delegasiUsers.find((x) => x.id === id);
                      return u ? (
                        <div
                          key={id}
                          style={{
                            fontSize: "0.95rem",
                            color: "#1f1f1f",
                            padding: "4px 0",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "6px",
                              height: "6px",
                              backgroundColor: "#3880ff",
                              borderRadius: "50%",
                              marginRight: "8px",
                            }}
                          ></div>
                          {u.nama_lengkap}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </>
            )}
          </IonList>

          <IonButton
            expand="block"
            type="submit"
            disabled={
              isLoading ||
              (jenisTugas === "Delegasi" && penerimaId.length === 0)
            }
            style={{
              marginTop: "30px",
              "--border-radius": "8px",
              height: "50px",
            }}
          >
            {isLoading ? (
              <IonSpinner name="dots" color="light" />
            ) : (
              <b>Simpan & Tugaskan</b>
            )}
          </IonButton>
        </form>
        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={2500}
          color={toastMsg.includes("berhasil") ? "success" : "danger"}
        />
      </IonContent>
    </IonPage>
  );
};
export default AddTask;
