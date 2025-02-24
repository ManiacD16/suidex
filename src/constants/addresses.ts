export const CONSTANTS = {
  PACKAGE_ID:
    "0x09c07c5f189225cbcd3ba5c09e4520069550bf8c4d2b6e8b9834804f8636ae77",
  ROUTER_ID:
    "0xec4b6b2084ada8f121b1483f5988f4616b8fb9f698c8ce7d1295dd46a8af4ecb",
  FACTORY_ID:
    "0x32923249bb5d8b0c217b4c8d463355927d00f9ffa0988daf4b0acb8f346f0713",
  ADMIN_CAP_ID:
    "0x311b1c3e2ba6642e0d761fcb0547c60b68518ee2ee3786106d14641c610a5f73",
  UPGRADE_CAP_ID:
    "0x620a313c9d155f7e417fee8164052bf0fbb132c0a033a8c238b716f68f920c58",
  MODULES: {
    FACTORY: "factory",
    PAIR: "pair",
    ROUTER: "router",
    LIBRARY: "library",
    FIXED_POINT_MATH: "fixed_point_math",
  },
  getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
};
