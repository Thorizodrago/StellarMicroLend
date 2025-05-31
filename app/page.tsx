"use client";

import React, { useEffect, useState } from "react";

import freighterApi, {
  isConnected,
  isAllowed,
  getAddress,
  getNetwork,
  requestAccess,
} from "@stellar/freighter-api";

interface UserProfile {
  creditScore: number;
  totalLent: number;
  totalBorrowed: number;
  activeLoans: number;
  walletAddress: string;
  network: string;
}

export default function StellarMicroLendWallet() {
  const [mounted, setMounted] = useState(false);
  const [isFreighterAvailable, setIsFreighterAvailable] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Render until mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check frigher is downloaded and check permission
  useEffect(() => {
    if (!mounted) return;

    const checkFreighter = async () => {
      try {
        // Call isConnected()
        const connRes = await isConnected();
        if (connRes.isConnected) {
          setIsFreighterAvailable(true);
          const allowedRes = await isAllowed();
          if (allowedRes.isAllowed) {
            await loadWallet();
          }
        } else {
          setIsFreighterAvailable(false);
        }
      } catch (err) {
        console.error("Freighter check error:", err);
        setIsFreighterAvailable(false);
      }
    };

    // Delay for extension load
    const timeoutId = setTimeout(checkFreighter, 500);
    return () => clearTimeout(timeoutId);
  }, [mounted]);

  // Load Wallet info: publicKey & network
  const loadWallet = async () => {
    try {
      // Get publicKey
      const pkRes = await getAddress();
      if (!pkRes?.address) {
        throw new Error("Cannot get public key.");
      }
      const netRes = await getNetwork();
      if (!netRes?.network) {
        throw new Error("Cannot get network informations.");
      }
      await loadUserProfile(pkRes.address, netRes.network);
    } catch (err) {
      console.error("Wallet load error:", err);
      setError("Cannot get wallet info");
      setUserProfile(null);
    }
  };

  // Mock and data produce 
  const loadUserProfile = async (walletAddress: string, network: string) => {
    const hash = walletAddress.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const mockProfile: UserProfile = {
      creditScore: 500 + Math.abs(hash % 300),
      totalLent: Math.abs(hash % 10000),
      totalBorrowed: Math.abs(hash % 5000),
      activeLoans: Math.abs(hash % 5),
      walletAddress,
      network,
    };
    setUserProfile(mockProfile);
  };

  // Connect button function
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // If there is no wallet, throw error.
      const connRes = await isConnected();
      if (!connRes.isConnected) {
        throw new Error("Freighter wallet not detected in current browser");
      }

      // If no permission, ask for permission
      const allowedRes = await isAllowed();
      if (!allowedRes.isAllowed) {
        // requestAccess, routes user to Frighter
        const accessRes = await requestAccess();
        if (accessRes.error) {
          throw new Error(accessRes.error);
        }
      }

      // If permission accepted get publicKey & network and load profile
      const pkRes = await getAddress();
      const netRes = await getNetwork();
      if (!pkRes?.address || !netRes?.network) {
        throw new Error("Cannot get wallet info");
      }
      await loadUserProfile(pkRes.address, netRes.network);
    } catch (err) {
      console.error("Connection error:", err);
      setError(err instanceof Error ? err.message : "Connection error");
    } finally {
      setIsConnecting(false);
    }
  };

  // Cut the connection: set userProfile null
  const handleDisconnect = () => {
    setUserProfile(null);
    setError(null);
  };

  // Cut the adress for better look
  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-8)}`;

  // Credit score color
  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return "#10b981";
    if (score >= 650) return "#f59e0b";
    return "#ef4444";
  };

  // Show credit score in labels
  const getCreditScoreLabel = (score: number) => {
    if (score >= 750) return "Highly Good";
    if (score >= 650) return "Good";
    return "Medium";
  };

  // Show loading screen if client part is not loaded
  if (!mounted) {
    return (
      <div
        style={{
          maxWidth: "800px",
          margin: "32px auto",
          padding: "24px",
          background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
          color: "#f9fafb",
          borderRadius: "12px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #374151",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                padding: "8px",
                backgroundColor: "#2563eb",
                borderRadius: "8px",
                fontSize: "20px",
              }}
            >
              <span>📈</span>
            </div>
            <div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "white",
                  margin: 0,
                }}
              >
                Stellar Micro Lend
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                P2P Micro Credit Platform
              </p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>⏳</div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "8px",
            }}
          >
            Loading...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "32px auto",
        padding: "24px",
        background: "linear-gradient(135deg, #1f2937 0%, #111827 100%)",
        color: "#f9fafb",
        borderRadius: "12px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        border: "1px solid #374151",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              padding: "8px",
              backgroundColor: "#2563eb",
              borderRadius: "8px",
              fontSize: "20px",
            }}
          >
            <span>📈</span>
          </div>
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
              }}
            >
              Stellar MicroLend
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#9ca3af",
                margin: 0,
              }}
            >
              P2P Micro Credit Platform
            </p>
          </div>
        </div>

        {/* connected network */}
        {userProfile?.network && (
          <div
            style={{
              padding: "4px 12px",
              backgroundColor: "#374151",
              borderRadius: "20px",
              fontSize: "12px",
            }}
          >
            {userProfile.network.toUpperCase()} Ağı
          </div>
        )}
      </div>

      {/* error message */}
      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            backgroundColor: "rgba(153, 27, 27, 0.5)",
            border: "1px solid #dc2626",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#fca5a5",
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Connection screen for wallet */}
      {!userProfile ? (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>
            {isFreighterAvailable ? "💼" : "❌"}
          </div>
          <h2
            style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}
          >
            {isFreighterAvailable ? "Wallet Connection" : "Cannot detect freighter"}
          </h2>
          <p style={{ color: "#9ca3af", marginBottom: "24px" }}>
            {isFreighterAvailable
              ? "Please connect your wallet to start credit process."
              : "Please install Freighter and reload page."}
          </p>

          {isFreighterAvailable && (
            <>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginBottom: "24px",
                }}
              >
                When you click the button, the Freighter wallet will open and ask for connection permission.
              </p>

              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  fontWeight: "600",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: isConnecting ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "16px",
                  opacity: isConnecting ? 0.5 : 1,
                }}
              >
                {isConnecting ? (
                  <>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        border: "2px solid white",
                        borderTop: "2px solid transparent",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    ></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>💼</span>
                    <span>Connect Freighter Wallet</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      ) : (
        // If wallet connected, action cards
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* connected wallet info */}
          <div
            style={{
              backgroundColor: "rgba(31, 41, 55, 0.5)",
              borderRadius: "8px",
              padding: "16px",
              border: "1px solid #374151",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#10b981", fontSize: "20px" }}>✅</span>
              <div>
                <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>
                  Connected Wallet
                </p>
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "18px",
                    margin: 0,
                  }}
                >
                  {truncateAddress(userProfile.walletAddress)}
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              style={{
                padding: "8px 16px",
                backgroundColor: "#374151",
                borderRadius: "8px",
                fontSize: "14px",
                border: "none",
                color: "white",
                cursor: "pointer",
              }}

            >
              Disconnect Wallet
            </button>
          </div>

          {/* Profile stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            {/* credit note card */}
            <div
              style={{
                backgroundColor: "rgba(31, 41, 55, 0.5)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#3b82f6", fontSize: "18px" }}>🛡️</span>
                <h3 style={{ fontWeight: "600", margin: 0 }}>Credit Grade</h3>
              </div>
              <div style={{ display: "flex", alignItems: "end", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    color: getCreditScoreColor(userProfile.creditScore),
                  }}
                >
                  {userProfile.creditScore}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: getCreditScoreColor(userProfile.creditScore),
                  }}
                >
                  {getCreditScoreLabel(userProfile.creditScore)}
                </span>
              </div>
            </div>

            {/* active credits card */}
            <div
              style={{
                backgroundColor: "rgba(31, 41, 55, 0.5)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #374151",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <span style={{ color: "#10b981", fontSize: "18px" }}>👥</span>
                <h3 style={{ fontWeight: "600", margin: 0 }}>Active Credits</h3>
              </div>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#10b981",
                }}
              >
                {userProfile.activeLoans}
              </span>
            </div>

            {/* Total given card */}
            <div
              style={{
                backgroundColor: "rgba(31, 41, 55, 0.5)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #374151",
              }}
            >
              <h3
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#9ca3af",
                  margin: "0 0 4px 0",
                }}
              >
                Total Given
              </h3>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#3b82f6",
                }}
              >
                {userProfile.totalLent.toLocaleString()} XLM
              </span>
            </div>

            {/* total get card */}
            <div
              style={{
                backgroundColor: "rgba(31, 41, 55, 0.5)",
                borderRadius: "8px",
                padding: "16px",
                border: "1px solid #374151",
              }}
            >
              <h3
                style={{
                  fontWeight: "600",
                  fontSize: "14px",
                  color: "#9ca3af",
                  margin: "0 0 4px 0",
                }}
              >
                Total Get
              </h3>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#8b5cf6",
                }}
              >
                {userProfile.totalBorrowed.toLocaleString()} XLM
              </span>
            </div>
          </div>

          {/* action buttons */}
          <div style={{ display: "flex", gap: "16px" }}>
            <button
              style={{
                flex: 1,
                fontWeight: "600",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "none",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "16px",
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              }}
            >
              <span>💰</span>
              <span>Give Credit</span>
            </button>
            <button
              style={{
                flex: 1,
                fontWeight: "600",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "none",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "16px",
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
              }}
            >
              <span>🏦</span>
              <span>Get Credit</span>
            </button>
          </div>
        </div>
      )}

      {/* CSS Animation definiton */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );

}
