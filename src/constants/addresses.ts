export const CONSTANTS = {
  PACKAGE_ID:
    "0xff2e446576f77498db5332be092721d5479fc89269107cc9d6801ca0da61f0fd",
  ROUTER_ID:
    "0x4eee9cd9bc16d609eea3ca75eb4cbc9d1c4fe8e3fbf397c5603715f0a56d62ff",
  FACTORY_ID:
    "0x2fe964456a62f1c94bebde7aa40069607676167ff088b5eab410d44bb4434006",
  ADMIN_CAP_ID:
    "0xfb22b9a7bc2979a78b1eef180f987c34f424594762ec8c7c6493e665f92f0c17",
  UPGRADE_CAP_ID:
    "0xa64ed25769491fa1b825f5390efb96a57139ca883b2b5e5d48c01da8b4fd88bd",
  MODULES: {
    FACTORY: "factory",
    PAIR: "pair",
    ROUTER: "router",
    LIBRARY: "library",
    FIXED_POINT_MATH: "fixed_point_math",
  },
  getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
};
