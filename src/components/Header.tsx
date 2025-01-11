import BackgroundEffects from "./BackgroundEffects";
import { ConnectButton } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";

const getShortAddress = (address: string | undefined) => {
  if (!address) return "";
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
};

export default function Header() {
  const currentAccount = useCurrentAccount();

  return (
    <>
      <BackgroundEffects />

      {/* Header */}
      <header className="flex px-2 items-center justify-between p-2 sm:p-2 border-b border-[#2a4b8a]">
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
          <div className="relative">
            <ConnectButton
              className="sui-connect-button !text-black hover:!bg-[#16a34a] rounded-xl transition-all duration-300"
              style={{
                backgroundColor: "#22c55e !important",
                color: "white !important",
                // padding: "0.1rem 1rem",
                borderRadius: "1rem",
              }}
              connectText="Connect Wallet"
            >
              {currentAccount ? (
                <div className="flex items-center space-x-1">
                  <span className="hidden sm:inline-block">
                    {getShortAddress(currentAccount.address)}
                  </span>
                  <span className="inline-block sm:hidden text-ellipsis overflow-hidden max-w-[80px]">
                    {getShortAddress(currentAccount.address)}
                  </span>
                </div>
              ) : (
                "Connect"
              )}
            </ConnectButton>
          </div>
        </div>
      </header>
    </>
  );
}
