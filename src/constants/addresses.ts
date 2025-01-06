export const CONSTANTS = {
    PACKAGE_ID: "0x8e3baa9498e077dc10245bce4e6fe1db0fac961fe24828b38681872fea9e0589",
    ROUTER_ID: "0xc25ae5ef8b4c06b823accfab84e58cde664c1be12a26bdabde95e1b5bafdecbc",
    FACTORY_ID: "0x2939889fcb84256eee4caa3f8dab1cf5d20a0ac39b6d8d24a0906636a7fd69c2",
    ADMIN_CAP_ID: "0x660f7a1e7767d9236e366db302363e616a2dca9246fa91d617ea72d2f9353e21",
    UPGRADE_CAP_ID: "0xc821212b9e214556b9f9ab6ce19352501e922b80c30ebd2273a47a53b98abe9e",
    MODULES: {
        FACTORY: "factory",
        PAIR: "pair",
        ROUTER: "router",
        LIBRARY: "library",
        MATH_U256: "math_u256"
    },
    // Add these based on token selections
    getPairID: (token0: string, token1: string) => `${token0}_${token1}_pair`
};