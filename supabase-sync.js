(() => {
  const LOCAL_KEY = 'danielOS.v1';
  const config = window.DANIEL_OS_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabaseKey && window.supabase);
  let client = null;
  let user = null;
  let syncing = false;
  let timer = null;
  let localOnly = sessionStorage.getItem('danielOS.localOnly') === 'true';

  const $ = id => document.getElementById(id);
  const setMessage = message => { const el=$('authMessage'); if(el) el.textContent=message || ''; };
  const refreshStatus = () => {
    const status=$('storageStatus');
    if(status) status.textContent = user ? (syncing ? ' Syncing…' : ' Synced to Supabase') : ' Saved on this device';
    const userEl=$('cloudUser'), signOut=$('cloudSignOut');
    if(userEl){userEl.textContent=user?.email || '';userEl.classList.toggle('hidden',!user)}
    if(signOut)signOut.classList.toggle('hidden',!user);
  };
  const showAuth = show => $('authOverlay')?.classList.toggle('hidden', !show);

  async function pushState(nextState) {
    if (!client || !user) return;
    syncing = true; refreshStatus();
    const { error } = await client.from('user_state').upsert({
      user_id: user.id,
      state: nextState,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    syncing = false; refreshStatus();
    if (error) console.error('Daniel OS cloud save failed:', error);
  }

  async function hydrate() {
    const { data, error } = await client.from('user_state').select('state,updated_at').eq('user_id', user.id).maybeSingle();
    if (error) { setMessage(error.message); return; }
    const localRaw = localStorage.getItem(LOCAL_KEY);
    if (data?.state) {
      const cloudRaw = JSON.stringify(data.state);
      if (cloudRaw !== localRaw) {
        localStorage.setItem(LOCAL_KEY, cloudRaw);
        location.reload();
      }
    } else if (localRaw) {
      await pushState(JSON.parse(localRaw));
    }
  }

  async function init() {
    if (!configured) {
      showAuth(false);
      console.info('Daniel OS: Supabase is not configured. Add project values to config.js.');
      return;
    }
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
    const { data } = await client.auth.getSession();
    user = data.session?.user || null;
    refreshStatus();
    if (user) await hydrate();
    else if (!localOnly) showAuth(true);
    client.auth.onAuthStateChange(async (_event, session) => {
      const prior=user?.id; user=session?.user || null; refreshStatus();
      if (user && user.id !== prior) await hydrate();
    });
  }

  window.DanielCloud = {
    status: () => ({ configured, signedIn: Boolean(user), syncing }),
    scheduleSave(nextState) {
      if (!user) return;
      clearTimeout(timer);
      timer = setTimeout(() => pushState(nextState), 650);
    }
  };

  window.addEventListener('DOMContentLoaded', () => {
    $('authSignIn')?.addEventListener('click', async () => {
      setMessage('Signing in…');
      const { error } = await client.auth.signInWithPassword({email:$('authEmail').value.trim(),password:$('authPassword').value});
      if(error)setMessage(error.message);else{sessionStorage.removeItem('danielOS.localOnly');showAuth(false)}
    });
    $('authSignUp')?.addEventListener('click', async () => {
      setMessage('Creating account…');
      const { data, error } = await client.auth.signUp({email:$('authEmail').value.trim(),password:$('authPassword').value});
      if(error)setMessage(error.message);else if(!data.session)setMessage('Check your email to confirm the account, then sign in.');else{showAuth(false)}
    });
    $('authLocal')?.addEventListener('click', () => {localOnly=true;sessionStorage.setItem('danielOS.localOnly','true');showAuth(false)});
    $('cloudSignOut')?.addEventListener('click', async () => {await client?.auth.signOut();location.reload()});
    init().catch(err=>{console.error(err);setMessage('Cloud connection failed. Device storage is still available.')});
  });
})();
