export const CONSTANTS = {
  PACKAGE_ID:
    "0x9b142196cb158e66047eaedf47e796555da7d036b9ee2b08643d93d295597870",
  ROUTER_ID:
    "0x823cebe7f5f82a034be9031aab6a4dfa21952ca6bf90aca30583d1016640503f",
  FACTORY_ID:
    "0x19823e110c687a4cb03d49897fc9783b17c26d0ac9271143dab5b6cab283889c",
  ADMIN_CAP_ID:
    "0xc7e3d7c7f99baf87c591abe419b8ebe777d3a13fb471e699489c3c328daa6d3d",
  UPGRADE_CAP_ID:
    "0x78410a4e191c8c952c41d4722883efbd873575ca23bcbcfdf9e4da70b0096f79",
  MODULES: {
    FACTORY: "factory",
    PAIR: "pair",
    ROUTER: "router",
    LIBRARY: "library",
    FIXED_POINT_MATH: "fixed_point_math",
  },
  getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`,
};
