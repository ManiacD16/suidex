export const CONSTANTS = {
  PACKAGE_ID:
    "0x6563e674a282c0357f909522adb579951a6e831619c7dc5512693da863901329",
  ROUTER_ID:
    "0xf5f2baf93beac52d12eb556c6c90b8030d7b792f0df2e4d127a8f096711a2d38",
  FACTORY_ID:
    "0x3d9319381c6d6ca9c81f779cc2f74f4420ebbf7fe22459dd4953174016ad920d",
  ADMIN_CAP_ID:
    "0x59496ac109d1a94493fb450dd6ef4d57fadb48aeffb39c78ea75524f63845e49",
  UPGRADE_CAP_ID:
    "0x20d5ad24fb19fe661d2896daef25921013e6f65e6d4d065478fd3edec5994fa9",
  MODULES: {
    FACTORY: "factory",
    PAIR: "pair",
    ROUTER: "router",
    LIBRARY: "library",
    FIXED_POINT_MATH: "fixed_point_math",
  },
  getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
};
