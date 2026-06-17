import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    localDev(),
    vercelOidc(),
    // Public read-only demo surface. Tools with side effects must add their own approval/auth.
    none(),
  ],
});
