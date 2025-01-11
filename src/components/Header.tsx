import BackgroundEffects from "./BackgroundEffects";
import { ConnectButton } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Wallet } from "lucide-react"; // Wallet icon from lucide-react
import { useState } from "react"; // To handle the dropdown state

const getShortAddress = (address: string | undefined) => {
  if (!address) return "";
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
};

export default function Header() {
  const [dropdownVisible, setDropdownVisible] = useState(false); // State for dropdown visibility
  const currentAccount = useCurrentAccount();

  // Toggle dropdown visibility when the wallet icon is clicked
  const handleWalletClick = () => {
    setDropdownVisible(!dropdownVisible);
  };

  return (
    <>
      <BackgroundEffects />

      {/* Header */}
      <header className="flex px-4 items-center justify-between py-2 sm:py-2 border-b border-[#2a4b8a]">
        <div className="flex items-center space-x-4 sm:space-x-8 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-bold text-cyan-500/90">
              SuiDe
            </span>
            <span className="text-xl sm:text-2xl font-bold text-green-500/90">
              X
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* Show ConnectButton on large screens */}
          <div className="hidden sm:block">
            <ConnectButton
              className="sui-connect-button !text-black hover:!bg-[#16a34a] rounded-xl transition-all duration-300"
              style={{
                backgroundColor: "#22c55e !important",
                color: "white !important",
                borderRadius: "1rem",
              }}
              connectText="Connect Wallet"
            >
              {currentAccount ? (
                <div className="flex items-center space-x-1">
                  <span className="hidden sm:inline-block">
                    {getShortAddress(currentAccount?.address)}
                  </span>
                  <span className="inline-block sm:hidden text-ellipsis overflow-hidden max-w-[80px]">
                    {getShortAddress(currentAccount?.address)}
                  </span>
                </div>
              ) : (
                "Connect"
              )}
            </ConnectButton>
          </div>

          {/* Show Wallet icon on small screens */}
          <div className="sm:hidden">
            <button
              className="text-white p-2 rounded-full bg-[#22c55e]"
              onClick={handleWalletClick} // Toggle dropdown visibility on click
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet size={20} color="white" />
            </button>

            {/* Dropdown with ConnectButton */}
            {dropdownVisible && (
              <div
                className="absolute right-4 mt-2 w-[200px] bg-white border border-[#2a4b8a] hover:!bg-[#16a34a] rounded-lg px-2 shadow-lg z-50"
                onClick={(e) => e.stopPropagation()} // Prevent click from closing the dropdown
              >
                <ConnectButton
                  className="sui-connect-button !text-black hover:!bg-[#16a34a] rounded-xl transition-all duration-300"
                  style={{
                    backgroundColor: "#22c55e !important",
                    color: "white !important",
                    borderRadius: "1rem",
                  }}
                  connectText="Connect Wallet"
                >
                  {currentAccount ? (
                    <div className="flex items-center space-x-1">
                      <span className="hidden sm:inline-block">
                        {getShortAddress(currentAccount?.address)}
                      </span>
                      <span className="inline-block sm:hidden text-ellipsis overflow-hidden max-w-[80px]">
                        {getShortAddress(currentAccount?.address)}
                      </span>
                    </div>
                  ) : (
                    "Connect"
                  )}
                </ConnectButton>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
