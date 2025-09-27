import { isMaster } from "/lib/xp/cluster";
import { runAsAdmin } from "/lib/azure-ad-id-provider/context";
import { initUserStores } from "/lib/configFile/initIDProvider";

if (isMaster()) {
  runAsAdmin(initUserStores);
}
