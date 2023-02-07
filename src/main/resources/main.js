const context = require("/lib/azure-ad-id-provider/context");
const clusterLib = require("/lib/xp/cluster");
const initLib = require("/lib/configFile/initIDProvider");

if (clusterLib.isMaster()) {
    context.runAsAdmin(initLib.initUserStores)
}
