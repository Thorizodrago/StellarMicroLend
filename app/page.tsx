"use client";
import React, { useEffect, useState } from "react";

// Freighter API mock for demo (replace with actual freighter import)
const freighterApi = {
  isConnected: async () => Math.random() > 0.5,
  isAllowed: async () => true,
  setAllowed: async () => new Promise(resolve => setTimeout(resolve, 1000)),
  getAddress: async () => ({ address: "GDQNY3PBOJOKYZSRMK2S7LHHGWZIUISD4QORETLMXEWXBI7KFZZMKTL3" }),
  getNetwork: async () => ({ network: "PUBLIC" })

};

interface UserProfile {
  creditScore: number;
  totalLent: number;
  totalBorrowed: number;
  activeLoans: number;
}

export default function StellarMicroLendWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [network, setNetwork] = useState<string>("UNKNOWN");

  useEffect(() => {
    const mockProfile: UserProfile = {
      creditScore: Math.floor(Math.random() * 300) + 500,
      totalLent: Math.floor(Math.random() * 10000),
      totalBorrowed: Math.floor(Math.random() * 5000),
      activeLoans: Math.floor(Math.random() * 5)
    };
    setUserProfile(mockProfile);
  }, []);

  const loadUserProfile = async (address: string) => {
    // const mockProfile: UserProfile = {
    //   creditScore: Math.floor(Math.random() * 300) + 500,
    //   totalLent: Math.floor(Math.random() * 10000),
    //   totalBorrowed: Math.floor(Math.random() * 5000),
    //   activeLoans: Math.floor(Math.random() * 5)
    // };
    // setUserProfile(mockProfile);
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await freighterApi.setAllowed();
      const { address } = await freighterApi.getAddress();
      const { network: networkName } = await freighterApi.getNetwork();

      setPublicKey(address);
      setNetwork(networkName);
      loadUserProfile(address);

    } catch (error) {
      console.error("Cüzdan bağlantı hatası:", error);
      setError("Cüzdan bağlanırken bir hata oluştu. Kullanıcı bağlantıyı reddetti veya bir sorun yaşandı.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setPublicKey(null);
    setUserProfile(null);
    setNetwork("UNKNOWN");
    setError(null);
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-8)}`;

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return "#10b981";
    if (score >= 650) return "#f59e0b";
    return "#ef4444";
  };

  const getCreditScoreLabel = (score: number) => {
    if (score >= 750) return "Mükemmel";
    if (score >= 650) return "İyi";
    return "Orta";
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '32px auto',
      padding: '24px',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      color: '#f9fafb',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '1px solid #374151',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logoBox: {
      padding: '8px',
      backgroundColor: '#2563eb',
      borderRadius: '8px',
      fontSize: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: 'white',
      margin: 0
    },
    subtitle: {
      fontSize: '14px',
      color: '#9ca3af',
      margin: 0
    },
    networkBadge: {
      padding: '4px 12px',
      backgroundColor: '#374151',
      borderRadius: '20px',
      fontSize: '12px'
    },
    errorBox: {
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: 'rgba(153, 27, 27, 0.5)',
      border: '1px solid #dc2626',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#fca5a5'
    },
    connectSection: {
      textAlign: 'center' as const,
      padding: '32px 0'
    },
    connectIcon: {
      fontSize: '64px',
      marginBottom: '16px'
    },
    connectTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '8px'
    },
    connectDescription: {
      color: '#9ca3af',
      marginBottom: '24px'
    },
    connectNote: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '24px'
    },
    connectButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      fontWeight: '600',
      padding: '12px 24px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      fontSize: '16px'
    },
    connectButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid white',
      borderTop: '2px solid transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    connectedSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px'
    },
    walletInfo: {
      backgroundColor: 'rgba(31, 41, 55, 0.5)',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid #374151',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    walletInfoLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    walletAddress: {
      fontFamily: 'monospace',
      fontSize: '18px'
    },
    disconnectButton: {
      padding: '8px 16px',
      backgroundColor: '#374151',
      borderRadius: '8px',
      fontSize: '14px',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px'
    },
    statCard: {
      backgroundColor: 'rgba(31, 41, 55, 0.5)',
      borderRadius: '8px',
      padding: '16px',
      border: '1px solid #374151'
    },
    statHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    statTitle: {
      fontWeight: '600'
    },
    statValue: {
      fontSize: '32px',
      fontWeight: 'bold'
    },
    statSmallTitle: {
      fontWeight: '600',
      fontSize: '14px',
      color: '#9ca3af',
      marginBottom: '4px'
    },
    statSmallValue: {
      fontSize: '20px',
      fontWeight: 'bold'
    },
    actionButtons: {
      display: 'flex',
      gap: '16px'
    },
    actionButton: {
      flex: 1,
      fontWeight: '600',
      padding: '12px 16px',
      borderRadius: '8px',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '16px',
      transition: 'all 0.2s'
    },
    lendButton: {
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
    },
    borrowButton: {
      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .hover-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        .disconnect-button:hover {
          background-color: #4b5563 !important;
        }
      `}</style>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoBox}>
              <span>📈</span>
            </div>
            <div>
              <h1 style={styles.title}>StellarMicroLend</h1>
              <p style={styles.subtitle}>P2P Mikro Kredi Platformu</p>
            </div>
          </div>

          {network !== "UNKNOWN" && (
            <div style={styles.networkBadge}>
              {network} Ağı
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.errorBox}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Wallet Connection Status */}
        {!publicKey ? (
          <div style={styles.connectSection}>
            <div style={styles.connectIcon}>💼</div>
            <h2 style={styles.connectTitle}>Cüzdan Bağlantısı</h2>
            <p style={styles.connectDescription}>
              Kredi işlemlerine başlamak için Freighter cüzdanınızı bağlayın
            </p>
            <p style={styles.connectNote}>
              Butona tıkladığınızda Freighter cüzdanı açılacak ve bağlantı izni isteyecektir.
            </p>

            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              style={{
                ...styles.connectButton,
                ...(isConnecting ? styles.connectButtonDisabled : {})
              }}
              className={!isConnecting ? "hover-button" : ""}
            >
              {isConnecting ? (
                <>
                  <div style={styles.spinner}></div>
                  <span>Bağlanıyor...</span>
                </>
              ) : (
                <>
                  <span>💼</span>
                  <span>Freighter Cüzdanını Bağla</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div style={styles.connectedSection}>
            {/* Connected Wallet Info */}
            <div style={styles.walletInfo}>
              <div style={styles.walletInfoLeft}>
                <span style={{ color: '#10b981', fontSize: '20px' }}>✅</span>
                <div>
                  <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Bağlı Cüzdan</p>
                  <p style={{ ...styles.walletAddress, margin: 0 }}>{truncateAddress(publicKey)}</p>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                style={styles.disconnectButton}
                className="disconnect-button"
              >
                Bağlantıyı Kes
              </button>
            </div>

            {/* User Profile Stats */}
            {userProfile && (
              <div style={styles.statsGrid}>
                {/* Credit Score Card */}
                <div style={styles.statCard}>
                  <div style={styles.statHeader}>
                    <span style={{ color: '#3b82f6', fontSize: '18px' }}>🛡️</span>
                    <h3 style={{ ...styles.statTitle, margin: 0 }}>Kredi Notu</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
                    <span style={{
                      ...styles.statValue,
                      color: getCreditScoreColor(userProfile.creditScore)
                    }}>
                      {userProfile.creditScore}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: getCreditScoreColor(userProfile.creditScore)
                    }}>
                      {getCreditScoreLabel(userProfile.creditScore)}
                    </span>
                  </div>
                </div>

                {/* Active Loans */}
                <div style={styles.statCard}>
                  <div style={styles.statHeader}>
                    <span style={{ color: '#10b981', fontSize: '18px' }}>👥</span>
                    <h3 style={{ ...styles.statTitle, margin: 0 }}>Aktif Krediler</h3>
                  </div>
                  <span style={{ ...styles.statValue, color: '#10b981' }}>
                    {userProfile.activeLoans}
                  </span>
                </div>

                {/* Total Lent */}
                <div style={styles.statCard}>
                  <h3 style={styles.statSmallTitle}>Toplam Verilen</h3>
                  <span style={{ ...styles.statSmallValue, color: '#3b82f6' }}>
                    {userProfile.totalLent.toLocaleString()} USDC
                  </span>
                </div>

                {/* Total Borrowed */}
                <div style={styles.statCard}>
                  <h3 style={styles.statSmallTitle}>Toplam Alınan</h3>
                  <span style={{ ...styles.statSmallValue, color: '#8b5cf6' }}>
                    {userProfile.totalBorrowed.toLocaleString()} USDC
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={styles.actionButtons}>
              <button
                style={{ ...styles.actionButton, ...styles.lendButton }}
                className="hover-button"
              >
                <span>💰</span>
                <span>Kredi Ver</span>
              </button>
              <button
                style={{ ...styles.actionButton, ...styles.borrowButton }}
                className="hover-button"
              >
                <span>🏦</span>
                <span>Kredi Al</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
