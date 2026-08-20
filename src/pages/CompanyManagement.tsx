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
  IonButton,
  IonIcon,
  IonSpinner,
  IonToast,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonBadge,
  IonDatetime,
  IonCard,
  IonToggle,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import {
  add,
  closeOutline,
  businessOutline,
  logoWhatsapp,
  timeOutline,
  createOutline,
  shieldCheckmarkOutline,
  mailOutline,
  keyOutline,
  callOutline,
  personOutline,
} from "ionicons/icons";
import { useIonViewWillEnter } from "@ionic/react";
import api from "../api";

interface SuperAdmin {
  id: string;
  nama_lengkap: string;
  email: string;
}

interface Company {
  id: string;
  nama_perusahaan: string;
  jenis_klien: string;
  kontak_wa: string | null;
  masa_sewa_habis: string | null;
  status_aktif: boolean;
  users: SuperAdmin[];
}

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(false);

  const [formData, setFormData] = useState({
    nama_perusahaan: "",
    jenis_klien: "Perusahaan",
    kontak_wa: "",
    masa_sewa_habis: "",
    status_aktif: true,
    email_admin: "",
    password_admin: "",
  });

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<Company[]>("/companies");
      setCompanies(response.data);
    } catch {
      setToastMsg("Gagal menarik data klien.");
    } finally {
      setIsLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    fetchCompanies();
  });

  const formatTanggalLokal = (isoString?: string | null) => {
    if (!isoString) return "Tidak Terbatas";
    return new Date(isoString).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const openWhatsApp = (phone: string | null) => {
    if (!phone) {
      setToastMsg("Nomor kontak tidak tersedia.");
      return;
    }
    let waNumber = phone.replace(/[^0-9]/g, "");
    if (waNumber.startsWith("0")) waNumber = "62" + waNumber.substring(1);
    const message = encodeURIComponent(
      `Halo Bapak/Ibu dari ${selectedCompany?.nama_perusahaan}, kami dari layanan Centra Work menginformasikan mengenai masa sewa sistem Anda...`,
    );
    window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank");
  };

  const handleOpenDetail = (company: Company) => {
    setSelectedCompany(company);
    setShowDetailModal(true);
  };

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setIsUnlimited(false);
    setFormData({
      nama_perusahaan: "",
      jenis_klien: "Perusahaan",
      kontak_wa: "",
      masa_sewa_habis: new Date().toISOString(),
      status_aktif: true,
      email_admin: "",
      password_admin: "",
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = () => {
    if (!selectedCompany) return;
    setIsEditMode(true);
    const hasNoDeadline = !selectedCompany.masa_sewa_habis;
    setIsUnlimited(hasNoDeadline);

    setFormData({
      nama_perusahaan: selectedCompany.nama_perusahaan,
      jenis_klien: selectedCompany.jenis_klien || "Perusahaan",
      kontak_wa: selectedCompany.kontak_wa || "",
      masa_sewa_habis:
        selectedCompany.masa_sewa_habis || new Date().toISOString(),
      status_aktif: selectedCompany.status_aktif,
      email_admin: "",
      password_admin: "",
    });
    setShowDetailModal(false);
    setTimeout(() => setShowFormModal(true), 300);
  };

  const handleSaveForm = async () => {
    if (!formData.nama_perusahaan) {
      setToastMsg("Nama Klien wajib diisi.");
      return;
    }
    setIsSaving(true);

    const finalDeadline = isUnlimited ? null : formData.masa_sewa_habis;

    try {
      if (isEditMode && selectedCompany) {
        await api.put(`/companies/${selectedCompany.id}`, {
          nama_perusahaan: formData.nama_perusahaan,
          jenis_klien: formData.jenis_klien,
          kontak_wa: formData.kontak_wa,
          masa_sewa_habis: finalDeadline,
          status_aktif: formData.status_aktif,
        });
        setToastMsg("Data klien berhasil diperbarui.");
      } else {
        if (!formData.email_admin || !formData.password_admin) {
          setToastMsg("Email dan Password Admin wajib diisi!");
          setIsSaving(false);
          return;
        }
        await api.post("/companies", {
          nama_perusahaan: formData.nama_perusahaan,
          jenis_klien: formData.jenis_klien,
          kontak_wa: formData.kontak_wa,
          masa_sewa_habis: finalDeadline,
          email_admin: formData.email_admin,
          password_admin: formData.password_admin,
        });
        setToastMsg("Klien dan Akun Admin berhasil dibuat!");
      }
      setShowFormModal(false);
      fetchCompanies();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      setToastMsg(err.response?.data?.error || "Terjadi kesalahan sistem.");
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
            <b>Dashboard Master SaaS</b>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        className="ion-padding"
        style={{ backgroundColor: "#f4f5f8" }}
      >
        <div
          style={{
            backgroundColor: "#1f1f1f",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "20px",
            color: "white",
          }}
        >
          <h2
            style={{
              fontWeight: "bold",
              margin: "0 0 5px 0",
              fontSize: "1.3rem",
            }}
          >
            Data Klien
          </h2>
          <p style={{ margin: 0, opacity: 0.8, fontSize: "0.9rem" }}>
            Pantau dan kelola seluruh klien penyewa sistem Anda di sini.
          </p>
        </div>

        {isLoading ? (
          <div className="ion-text-center" style={{ marginTop: "50px" }}>
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <div style={{ paddingBottom: "80px" }}>
            {companies.length === 0 ? (
              <div
                className="ion-text-center"
                style={{ marginTop: "60px", color: "gray" }}
              >
                <IonIcon
                  icon={businessOutline}
                  style={{ fontSize: "5rem", opacity: 0.3 }}
                />
                <h3 style={{ fontWeight: "bold", marginTop: "10px" }}>
                  Belum ada klien
                </h3>
                <p>Klik tombol + untuk mendaftarkan klien baru.</p>
              </div>
            ) : (
              companies.map((company) => {
                const isExpired =
                  company.masa_sewa_habis &&
                  new Date() > new Date(company.masa_sewa_habis);
                const isActive = company.status_aktif && !isExpired;
                const isCompany = company.jenis_klien === "Perusahaan";

                return (
                  <IonCard
                    key={company.id}
                    button
                    onClick={() => handleOpenDetail(company)}
                    style={{
                      margin: "0 0 15px 0",
                      borderRadius: "16px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: isActive
                            ? "rgba(40, 167, 69, 0.1)"
                            : "rgba(220, 53, 69, 0.1)",
                          padding: "12px",
                          borderRadius: "12px",
                          marginRight: "16px",
                        }}
                      >
                        <IonIcon
                          icon={isCompany ? businessOutline : personOutline}
                          style={{
                            fontSize: "2rem",
                            color: isActive ? "#28a745" : "#dc3545",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h2
                          style={{
                            fontWeight: "bold",
                            color: "#1f1f1f",
                            margin: "0 0 6px 0",
                            fontSize: "1.1rem",
                          }}
                        >
                          {company.nama_perusahaan}
                        </h2>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          {isActive ? (
                            <IonBadge
                              color="success"
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              Aktif
                            </IonBadge>
                          ) : (
                            <IonBadge
                              color="danger"
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              Mati
                            </IonBadge>
                          )}
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "gray",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <IonIcon
                              icon={timeOutline}
                              style={{ marginRight: "4px" }}
                            />
                            {company.masa_sewa_habis
                              ? new Date(
                                  company.masa_sewa_habis,
                                ).toLocaleDateString("id-ID")
                              : "Tanpa Batas"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </IonCard>
                );
              })
            )}
          </div>
        )}

        <IonFab
          vertical="bottom"
          horizontal="end"
          slot="fixed"
          style={{ marginBottom: "15px", marginRight: "15px" }}
        >
          <IonFabButton color="primary" onClick={handleOpenAdd}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal
          isOpen={showDetailModal}
          onDidDismiss={() => setShowDetailModal(false)}
        >
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
              <IonTitle>Informasi Klien</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDetailModal(false)}>
                  <IonIcon icon={closeOutline} size="large" />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent
            className="ion-padding"
            style={{ backgroundColor: "#f4f5f8" }}
          >
            {selectedCompany && (
              <>
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "25px",
                    marginTop: "10px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#e8f0fe",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 15px auto",
                      border: "4px solid white",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    }}
                  >
                    <IonIcon
                      icon={
                        selectedCompany.jenis_klien === "Perusahaan"
                          ? businessOutline
                          : personOutline
                      }
                      style={{ color: "#3880ff", fontSize: "2.5rem" }}
                    />
                  </div>
                  <h2
                    style={{
                      fontWeight: "bold",
                      margin: "0 0 5px 0",
                      fontSize: "1.5rem",
                    }}
                  >
                    {selectedCompany.nama_perusahaan}
                  </h2>
                  <p
                    style={{
                      color: "gray",
                      fontSize: "0.9rem",
                      margin: "0 0 15px 0",
                    }}
                  >
                    Kategori: {selectedCompany.jenis_klien}
                  </p>

                  {!selectedCompany.status_aktif ? (
                    <IonBadge
                      color="danger"
                      style={{ fontSize: "0.9rem", padding: "6px 12px" }}
                    >
                      Akses Dinonaktifkan
                    </IonBadge>
                  ) : selectedCompany.masa_sewa_habis &&
                    new Date() > new Date(selectedCompany.masa_sewa_habis) ? (
                    <IonBadge
                      color="danger"
                      style={{ fontSize: "0.9rem", padding: "6px 12px" }}
                    >
                      Masa Sewa Habis
                    </IonBadge>
                  ) : (
                    <IonBadge
                      color="success"
                      style={{ fontSize: "0.9rem", padding: "6px 12px" }}
                    >
                      Status Sewa Aman
                    </IonBadge>
                  )}
                </div>

                <div
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "20px",
                    marginBottom: "25px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "15px",
                    }}
                  >
                    <IonIcon
                      icon={logoWhatsapp}
                      style={{
                        color: "#25D366",
                        fontSize: "1.5rem",
                        marginRight: "15px",
                      }}
                    />
                    <div>
                      <p
                        style={{ margin: 0, fontSize: "0.8rem", color: "gray" }}
                      >
                        Kontak WhatsApp
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0 0",
                          fontWeight: "bold",
                          color: "#1f1f1f",
                        }}
                      >
                        {selectedCompany.kontak_wa || "Belum ada kontak"}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "15px",
                    }}
                  >
                    <IonIcon
                      icon={shieldCheckmarkOutline}
                      style={{
                        color: "#ffc409",
                        fontSize: "1.5rem",
                        marginRight: "15px",
                      }}
                    />
                    <div>
                      <p
                        style={{ margin: 0, fontSize: "0.8rem", color: "gray" }}
                      >
                        Akun Super Admin
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0 0",
                          fontWeight: "bold",
                          color: "#1f1f1f",
                        }}
                      >
                        {selectedCompany.users &&
                        selectedCompany.users.length > 0
                          ? selectedCompany.users[0].email
                          : "Belum diatur"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <IonIcon
                      icon={timeOutline}
                      style={{
                        color: "#eb445a",
                        fontSize: "1.5rem",
                        marginRight: "15px",
                      }}
                    />
                    <div>
                      <p
                        style={{ margin: 0, fontSize: "0.8rem", color: "gray" }}
                      >
                        Batas Akhir Sewa
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0 0",
                          fontWeight: "bold",
                          color: "#1f1f1f",
                        }}
                      >
                        {formatTanggalLokal(selectedCompany.masa_sewa_habis)}
                      </p>
                    </div>
                  </div>
                </div>

                <IonButton
                  expand="block"
                  color="success"
                  onClick={() => openWhatsApp(selectedCompany.kontak_wa)}
                  style={{
                    height: "55px",
                    fontWeight: "bold",
                    fontSize: "1.05rem",
                    "--border-radius": "12px",
                    marginBottom: "15px",
                  }}
                >
                  <IonIcon icon={logoWhatsapp} slot="start" /> Hubungi via
                  WhatsApp
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  color="primary"
                  onClick={handleOpenEdit}
                  style={{
                    height: "55px",
                    fontWeight: "bold",
                    "--border-radius": "12px",
                  }}
                >
                  <IonIcon icon={createOutline} slot="start" /> Edit /
                  Perpanjang Sewa
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>

        <IonModal
          isOpen={showFormModal}
          onDidDismiss={() => setShowFormModal(false)}
        >
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
              <IonTitle>
                {isEditMode ? "Edit Data Klien" : "Tambah Klien Baru"}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowFormModal(false)}>
                  <IonIcon icon={closeOutline} size="large" />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent
            className="ion-padding"
            style={{ backgroundColor: "#f4f5f8" }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 15px 0",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#3880ff",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IonIcon
                  icon={businessOutline}
                  style={{ marginRight: "8px" }}
                />{" "}
                Profil Klien
              </h3>

              <IonSegment
                value={formData.jenis_klien}
                onIonChange={(e) =>
                  setFormData({
                    ...formData,
                    jenis_klien: e.detail.value as string,
                  })
                }
                style={{ marginBottom: "15px" }}
              >
                <IonSegmentButton value="Perusahaan">
                  <IonLabel>Perusahaan</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="Perorangan">
                  <IonLabel>Perorangan</IonLabel>
                </IonSegmentButton>
              </IonSegment>

              <IonItem
                lines="none"
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "10px",
                  marginBottom: "15px",
                }}
              >
                <IonIcon
                  icon={
                    formData.jenis_klien === "Perusahaan"
                      ? businessOutline
                      : personOutline
                  }
                  slot="start"
                  color="medium"
                />
                <IonInput
                  label="Nama Klien / Perusahaan *"
                  labelPlacement="stacked"
                  value={formData.nama_perusahaan}
                  onIonInput={(e) =>
                    setFormData({
                      ...formData,
                      nama_perusahaan: e.detail.value!,
                    })
                  }
                  placeholder="Misal: PT Mencari Cinta Sejati"
                />
              </IonItem>

              <IonItem
                lines="none"
                style={{ border: "1px solid #e0e0e0", borderRadius: "10px" }}
              >
                <IonIcon icon={callOutline} slot="start" color="medium" />
                <IonInput
                  type="tel"
                  label="Nomor WhatsApp"
                  labelPlacement="stacked"
                  value={formData.kontak_wa}
                  onIonInput={(e) =>
                    setFormData({ ...formData, kontak_wa: e.detail.value! })
                  }
                  placeholder="Misal: 08123456789"
                />
              </IonItem>
            </div>

            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "20px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#eb445a",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IonIcon icon={timeOutline} style={{ marginRight: "8px" }} />{" "}
                Batas Waktu Sewa
              </h3>

              <IonItem
                lines="none"
                style={{ padding: 0, marginBottom: "10px" }}
              >
                <IonLabel style={{ fontWeight: "bold" }}>
                  Sewa Tanpa Batas
                </IonLabel>
                <IonToggle
                  checked={isUnlimited}
                  onIonChange={(e) => setIsUnlimited(e.detail.checked)}
                  slot="end"
                  color="success"
                />
              </IonItem>

              {!isUnlimited && (
                <div
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <IonDatetime
                    presentation="date"
                    max="2099-12-31"
                    value={formData.masa_sewa_habis}
                    onIonChange={(e) =>
                      setFormData({
                        ...formData,
                        masa_sewa_habis: e.detail.value as string,
                      })
                    }
                  />
                </div>
              )}
            </div>

            {isEditMode && (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "16px",
                  padding: "10px 20px",
                  marginBottom: "20px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <IonItem lines="none" style={{ padding: 0 }}>
                  <IonLabel
                    style={{
                      fontWeight: "bold",
                      color: formData.status_aktif ? "#1f1f1f" : "#dc3545",
                    }}
                  >
                    Akses Sistem (Aktif)
                  </IonLabel>
                  <IonToggle
                    checked={formData.status_aktif}
                    onIonChange={(e) =>
                      setFormData({
                        ...formData,
                        status_aktif: e.detail.checked,
                      })
                    }
                    slot="end"
                    color="success"
                  />
                </IonItem>
              </div>
            )}

            {!isEditMode && (
              <div
                style={{
                  backgroundColor: "white",
                  borderRadius: "16px",
                  padding: "20px",
                  marginBottom: "30px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 15px 0",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    color: "#ffc409",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <IonIcon
                    icon={shieldCheckmarkOutline}
                    style={{ marginRight: "8px" }}
                  />{" "}
                  Akun Super Admin
                </h3>

                <IonItem
                  lines="none"
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <IonIcon icon={mailOutline} slot="start" color="medium" />
                  <IonInput
                    type="email"
                    label="Email Login *"
                    labelPlacement="stacked"
                    value={formData.email_admin}
                    onIonInput={(e) =>
                      setFormData({ ...formData, email_admin: e.detail.value! })
                    }
                    placeholder="admin@perusahaan.com"
                  />
                </IonItem>

                <IonItem
                  lines="none"
                  style={{ border: "1px solid #e0e0e0", borderRadius: "10px" }}
                >
                  <IonIcon icon={keyOutline} slot="start" color="medium" />
                  <IonInput
                    type="text"
                    label="Password Sementara *"
                    labelPlacement="stacked"
                    value={formData.password_admin}
                    onIonInput={(e) =>
                      setFormData({
                        ...formData,
                        password_admin: e.detail.value!,
                      })
                    }
                    placeholder="Minimal 6 Karakter"
                  />
                </IonItem>
              </div>
            )}

            <IonButton
              expand="block"
              color="primary"
              onClick={handleSaveForm}
              disabled={isSaving}
              style={{
                height: "55px",
                "--border-radius": "12px",
                fontWeight: "bold",
                fontSize: "1.05rem",
                marginBottom: "30px",
              }}
            >
              {isSaving ? (
                <IonSpinner name="dots" />
              ) : isEditMode ? (
                "Simpan Perubahan"
              ) : (
                "Buat Sistem Klien"
              )}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={!!toastMsg}
          message={toastMsg}
          onDidDismiss={() => setToastMsg("")}
          duration={2500}
          color={
            toastMsg.includes("berhasil") || toastMsg.includes("dibuat")
              ? "success"
              : "danger"
          }
        />
      </IonContent>
    </IonPage>
  );
};
export default CompanyManagement;
