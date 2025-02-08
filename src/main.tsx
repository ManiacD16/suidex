// // // src/main.tsx
import React from "react";
import * as ReactDOM from "react-dom/client";
// import { WalletProvider } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getFullnodeUrl } from "@mysten/sui.js/client";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();
const networks = {
  devnet: { url: getFullnodeUrl("devnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="devnet">
        <WalletProvider>
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

// import React from "react";
// import * as ReactDOM from "react-dom/client";
// import { WalletProvider } from "@suiet/wallet-kit";
// import { SuiClientProvider } from "@mysten/dapp-kit";
// import "@suiet/wallet-kit/style.css";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { getFullnodeUrl } from "@mysten/sui.js/client";
// import App from "./App";
// import "./index.css";

// const queryClient = new QueryClient();
// const networks = {
//   devnet: { url: getFullnodeUrl("devnet") },
//   mainnet: { url: getFullnodeUrl("mainnet") },
// };

// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <QueryClientProvider client={queryClient}>
//       <SuiClientProvider networks={networks} defaultNetwork="devnet">
//         <WalletProvider>
//           <App />
//         </WalletProvider>
//       </SuiClientProvider>
//     </QueryClientProvider>
//   </React.StrictMode>
// );
