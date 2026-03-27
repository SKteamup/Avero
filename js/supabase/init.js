/* ============================================================
   js/supabase/init.js
   Laster alle Supabase-moduler og legger dem på window.Supa
   slik at vanlige script-filer kan bruke dem uten import.

   Lastes som <script type="module" src="js/supabase/init.js">
   Module-scripts kjøres FØR DOMContentLoaded, så window.Supa
   er alltid klar når sok.js / objekt.js / admin.js starter.
   ============================================================ */

import * as authMod      from './auth.js';
import * as objekterMod  from './objekter.js';
import * as favMod       from './favoritter.js';
import * as sokMod       from './lagrede-sok.js';
import * as adminMod     from './admin.js';
import * as realtimeMod  from './realtime.js';

window.Supa = {
  auth:       authMod,
  objekter:   objekterMod,
  favoritter: favMod,
  lagredeSok: sokMod,
  admin:      adminMod,
  realtime:   realtimeMod,
};