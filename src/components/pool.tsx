import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, ChevronDown } from "lucide-react";

interface Pool {
  pair: string;
  chain: string;
  version: string;
  feeTier: string;
  apr: {
    current: string;
    previous: string;
  };
  tvl: string;
  volume24h: string;
  poolType: string;
  tokens: string[];
}

const PoolsInterface: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all-pools");

  const allPools: Pool[] = [
    {
      pair: "USDT / WBNB",
      chain: "BNB SMART CHAIN",
      version: "V3",
      feeTier: "0.01%",
      apr: {
        current: "107.58%",
        previous: "98.42%",
      },
      tvl: "$ 5,808,463.8",
      volume24h: "$ 141M",
      poolType: "v3",
      tokens: ["USDT", "WBNB"],
    },
    {
      pair: "USDC / WBNB",
      chain: "BNB SMART CHAIN",
      version: "V3",
      feeTier: "0.05%",
      apr: {
        current: "11.56%",
        previous: "10.62%",
      },
      tvl: "$ 52,280,865",
      volume24h: "$ 27,707,066",
      poolType: "v3",
      tokens: ["USDC", "WBNB"],
    },
    {
      pair: "ETH / WBNB",
      chain: "BNB SMART CHAIN",
      version: "V3",
      feeTier: "0.05%",
      apr: {
        current: "76.15%",
        previous: "71.12%",
      },
      tvl: "$ 5,005,882.5",
      volume24h: "$ 18,113,972",
      poolType: "v3",
      tokens: ["ETH", "WBNB"],
    },
  ];

  const myPositions: Pool[] = [
    {
      pair: "USDT / WBNB",
      chain: "BNB SMART CHAIN",
      version: "V3",
      feeTier: "0.01%",
      apr: {
        current: "107.58%",
        previous: "98.42%",
      },
      tvl: "$ 5,808,463.8",
      volume24h: "$ 141M",
      poolType: "v3",
      tokens: ["USDT", "WBNB"],
    },
  ];

  const history: Pool[] = [
    {
      pair: "ETH / WBNB",
      chain: "BNB SMART CHAIN",
      version: "V3",
      feeTier: "0.05%",
      apr: {
        current: "76.15%",
        previous: "71.12%",
      },
      tvl: "$ 5,005,882.5",
      volume24h: "$ 18,113,972",
      poolType: "v3",
      tokens: ["ETH", "WBNB"],
    },
  ];

  const getActivePools = () => {
    switch (activeTab) {
      case "all-pools":
        return allPools;
      case "my-positions":
        return myPositions;
      case "history":
        return history;
      default:
        return allPools;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        // backgroundColor: "#1a1b23",
        color: "#fff",
        padding: "1rem",
      }}
    >
      <div
        style={{
          boxShadow: "0px 0px 10px #8b7bef, 0px 0px 10px #8b7bef inset",
        }}
        className="max-w-[1200px] mx-0 my-auto bg-[#1f2028]/40 backdrop:blur-2xl rounded-2xl p-[1.5rem] border border-[#8b7bef]/50"
      >
        {/* Navigation Tabs */}
        <div
          style={{
            boxShadow: "0px 0px 10px #8b7bef, 0px 0px 10px #8b7bef inset",
          }}
          className="flex justify-center lg:w-1/3 md:w-2/4 mb-[1.5rem] p-[0.25rem] border border-[#8b7bef] rounded-2xl"
        >
          {["all-pools", "my-positions", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                backgroundColor: activeTab === tab ? "#8b7bef" : "transparent",
              }}
              className="flex-1 p-[0.5rem] text-[#fff] cursor-pointer rounded-xl text-center"
            >
              {tab.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex items-stretch gap-[1rem] mb-[1.5rem] w-full">
          {/* <select
            style={{
              width: "200px",
              backgroundColor: "#2c2d3a",
              color: "#fff",
              border: "none",
              padding: "0.5rem",
              borderRadius: "0.25rem",
            }}
          >
            <option value="all">All networks</option>
            <option value="bsc">BSC</option>
            <option value="ethereum">Ethereum</option>
          </select> */}

          <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
            <input
              type="text"
              placeholder="All tokens"
              style={{
                width: "100%",
                backgroundColor: "#2c2d3a",
                color: "#fff",
                border: "none",
                padding: "0.5rem 0.5rem 0.5rem 2rem",
                borderRadius: "0.25rem",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              🔍
            </span>
          </div>

          <div className="flex-grow"></div>
          <button
            style={{
              boxShadow: "0px 0px 10px #8b7bef, 0px 0px 10px #8b7bef inset",
            }}
            onClick={() => navigate("/addliquidity")}
            className="bg-[#8b7bef] text-[#fff] py-[0.5rem] px-[1rem] rounded-xl cursor-pointer"
          >
            Add Liquidity
          </button>

          {/* <div style={{ display: "flex", gap: "0.5rem" }}>
            {["All", "V3", "V2", "StableSwap"].map((btn) => (
              <button
                key={btn}
                style={{
                  backgroundColor: btn === "All" ? "#8b7bef" : "#2c2d3a",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                }}
              >
                {btn}
              </button>
            ))}
          </div> */}
        </div>

        {/* Pools Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  textAlign: "left",
                  fontSize: "0.875rem",
                  color: "#b794f4",
                }}
              >
                <th style={{ padding: "1rem" }}>ALL POOLS</th>
                <th style={{ padding: "1rem" }}>FEE TIER</th>
                <th style={{ padding: "1rem" }}>
                  APR{" "}
                  <ChevronDown
                    style={{ display: "inline", width: "1rem", height: "1rem" }}
                  />
                </th>
                <th style={{ padding: "1rem" }}>
                  TVL{" "}
                  <ChevronDown
                    style={{ display: "inline", width: "1rem", height: "1rem" }}
                  />
                </th>
                <th style={{ padding: "1rem" }}>
                  VOLUME 24H{" "}
                  <ChevronDown
                    style={{ display: "inline", width: "1rem", height: "1rem" }}
                  />
                </th>
                <th style={{ padding: "1rem" }}>POOL TYPE</th>
                <th style={{ padding: "1rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {getActivePools().map((pool, index) => (
                <tr
                  key={index}
                  style={{
                    borderTop: "1px solid #4a5568",
                    transition: "background-color 0.2s",
                  }}
                >
                  <td style={{ padding: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <div style={{ display: "flex", marginRight: "-0.5rem" }}>
                        {pool.tokens.map((token, i) => (
                          <div
                            key={i}
                            style={{
                              width: "2rem",
                              height: "2rem",
                              borderRadius: "9999px",
                              backgroundColor: "#4a5568",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "2px solid #1a1b23",
                              marginLeft: i > 0 ? "-0.5rem" : "0",
                            }}
                          >
                            {token[0]}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontWeight: "500" }}>{pool.pair}</div>
                        <div style={{ fontSize: "0.875rem", color: "#a0aec0" }}>
                          {pool.chain}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          padding: "0.25rem 0.5rem",
                          borderRadius: "0.25rem",
                          backgroundColor: "#2c2d3a",
                        }}
                      >
                        {pool.version}
                      </span>
                      <span>{pool.feeTier}</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ color: "#48bb78" }}>
                      Up to {pool.apr.current}
                      <div
                        style={{
                          fontSize: "0.875rem",
                          color: "#a0aec0",
                          textDecoration: "line-through",
                        }}
                      >
                        {pool.apr.previous}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>{pool.tvl}</td>
                  <td style={{ padding: "1rem" }}>{pool.volume24h}</td>
                  <td style={{ padding: "1rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          borderRadius: "0.25rem",
                          backgroundColor: "#8b7bef",
                        }}
                      ></span>
                      {pool.poolType}
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#fff",
                      }}
                    >
                      <MoreHorizontal
                        style={{ width: "1rem", height: "1rem" }}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PoolsInterface;
