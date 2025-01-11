export const CONSTANTS = {
  PACKAGE_ID:
    "0x38ddade24ce343b9a1ebe8973f4ac9dca9a4b769ce3d4e76f7f5d075c92bbe1a",
  ROUTER_ID:
    "0xb972f89ceb8f0a3b91728f76a3fa6a96c0b01e12f5285b285193dce3b5e55272",
  FACTORY_ID:
    "0x9fea2939c634be54954ea887b1b0f625f6bf5e385ef972957b84312028334578",
  ADMIN_CAP_ID:
    "0xc2e4eea112a50faa878a2587cddec0e8b79dbe0b09f4ffc5520cbca55e4d80c7",
  UPGRADE_CAP_ID:
    "0x3b09b1a41815884f4d55d5ec525cf2120da7b8226f448d275b7471b81e91bcee",
  MODULES: {
    FACTORY: "factory",
    PAIR: "pair",
    ROUTER: "router",
    LIBRARY: "library",
    MATH_U256: "math_u256",
  },
  // Add these based on token selections
  getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
};
