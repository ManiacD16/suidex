export const CONSTANTS = {
  PACKAGE_ID:
    "0x5ec48e0a4b669dbb2ec9159566db1532e78dc0af50c9ff206f0ca48c92235fd9",
  ROUTER_ID:
    "0x7f06ad54bc675660ce42f2e5f8eb1660e3b8ff87af81ff7c19778b5f63d8ab7b",
  FACTORY_ID:
    "0xc69c98858453523e400813d6f32db02ff5ad09b62f74e32ae50a0fd121e42d4c",
  ADMIN_CAP_ID:
    "0x10a48b0862c7e3735d63d8f6e6131134a15caed23f6e859bfd4c976ab5e43a0f",
  UPGRADE_CAP_ID:
    "0x363386f4bb5923abb74e114d36fe62510100adf69fd98a4b208dd2217708f0b6",
  MODULES: {
    FACTORY: "factory",
    PAIR: "pair",
    ROUTER: "router",
    LIBRARY: "library",
    FIXED_POINT_MATH: "fixed_point_math", // Note: this was math_u256 in original
  },
  getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
};
