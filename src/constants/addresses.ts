export const CONSTANTS = {
  PACKAGE_ID:
    "0x8fea71c9b58f0d851610d55a2adbe1f2fd4a2bea69bdc99a0078c045cd18425e",
  ROUTER_ID:
    "0x2f0252fcca3c0416e0d3b8a626274129a3964775f84969aa697c94503a8c0693",
  FACTORY_ID:
    "0x0cebb0cb99a73001fb1d15004487c27f8da6ebeee5dbd5796e5d29a2ae74b021",
  ADMIN_CAP_ID:
    "0x288ea537cdaa6166a6b7d3e4c6c6056f03ad36b6d6b0667bdf1078bbf485587a",
  UPGRADE_CAP_ID:
    "0xdb314779177c4861b8f0e58774eb6b2876328487e76b10e6a7fe96bf52616753",
  MODULES: {
    FACTORY: "factory",
    PAIR: "pair",
    ROUTER: "router",
    LIBRARY: "library",
    FIXED_POINT_MATH: "fixed_point_math",
  },
  getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
};
