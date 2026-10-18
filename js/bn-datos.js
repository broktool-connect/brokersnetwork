/* Brokers Network · conexión de los trackers del panel admin con la hoja de Google (Apps Script).
   La contraseña la valida el script de Google, no esta página.
   Expone window.BN y un window.claude.use() compatible con los trackers. */
(function(){
  // URL de la aplicación web de Apps Script (termina en /exec). Vacía = aún no conectada.
  var API = 'https://script.google.com/macros/s/AKfycbxZgTlOlBulK-4Z0cWUcX-38NIsYUJSJ18IR7FKk6y595MRh_4bXSGoPYKRDMYjntrV4w/exec';
  var HOJA = 'https://docs.google.com/spreadsheets/d/1fkHmoiRiV0x1CRMUkWUh8JM4epFmZn41Gy8dpQticGE/edit';
  var K = 'bn-admin-cred';

  function cred(){ try{ return JSON.parse(sessionStorage.getItem(K) || 'null'); }catch(e){ return null; } }
  function guardarCred(c){ try{ if(c) sessionStorage.setItem(K, JSON.stringify(c)); else sessionStorage.removeItem(K); }catch(e){} }
  function err(code, msg){ var e = new Error(msg || code); e.code = code; return e; }

  function llamar(body, c){
    if(!API) return Promise.reject(err('sin_conexion', 'Falta conectar la hoja de Google.'));
    c = c || cred() || {};
    body.u = c.u; body.p = c.p;
    return fetch(API, { method:'POST', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function(r){ return r.json(); }, function(){ throw err('red', 'Sin conexión. Revisa tu internet.'); })
      .then(function(j){
        if(!j.ok){
          if(j.error === 'no_autorizado' && !c.prueba){ guardarCred(null); if(BN.alSalir) BN.alSalir(); }
          throw err(j.error, j.error === 'no_autorizado' ? 'Usuario o contraseña incorrectos.' : 'Error de la hoja de Google (' + j.error + ').');
        }
        return j;
      });
  }

  function nuevoId(){ var s = '', a = 'abcdefghijklmnopqrstuvwxyz0123456789'; for(var i=0;i<20;i++) s += a[Math.floor(Math.random()*a.length)]; return s; }

  // Colección con la misma forma que la base de datos de los artifacts de Claude.
  var cols = {}, HOJA_DE = { prospectos:'afiliaciones', registros:'operaciones' };
  function coleccion(nombre){
    nombre = HOJA_DE[nombre] || nombre;
    if(cols[nombre]) return cols[nombre];
    var docs = [], subs = [], timer = null, cargado = false;
    function snap(sub){
      var l = docs.slice();
      if(sub.campo){ l.sort(function(a,b){ var x = String(a[sub.campo]||''), y = String(b[sub.campo]||''); return sub.dir === 'desc' ? y.localeCompare(x) : x.localeCompare(y); }); }
      return { docs: l.map(function(d){ var o = Object.assign({}, d); delete o.id; return { id: d.id, data: function(){ return Object.assign({}, o); } }; }), size: l.length, empty: !l.length };
    }
    function avisar(){ subs.forEach(function(s){ try{ s.cb(snap(s)); }catch(e){ console.error(e); } }); }
    function refrescar(){
      return llamar({ op:'list', col:nombre }).then(function(j){ docs = j.docs || []; cargado = true; avisar(); })
        .catch(function(e){ subs.forEach(function(s){ if(s.err) s.err(e); }); });
    }
    function sondeo(){ if(timer) return; timer = setInterval(function(){ if(!document.hidden) refrescar(); }, 20000);
      document.addEventListener('visibilitychange', function(){ if(!document.hidden) refrescar(); }); }
    function local(id, data, mezclar, borrar){
      var i = docs.findIndex(function(d){ return d.id === id; });
      if(borrar){ if(i >= 0) docs.splice(i,1); }
      else if(i >= 0){ docs[i] = mezclar ? Object.assign({}, docs[i], data, { id:id }) : Object.assign({ creado: docs[i].creado }, data, { id:id }); }
      else docs.push(Object.assign({ creado: new Date().toISOString() }, data, { id:id }));
      avisar();
    }
    function escribir(op, id, data){
      var antes = docs.slice();
      local(id, data, op === 'update', op === 'delete');
      return llamar({ op:op, col:nombre, id:id, data:data }).then(function(){ refrescar(); return { id:id }; },
        function(e){ docs = antes; avisar(); throw e; });
    }
    var api = {
      doc: function(id){ id = id || nuevoId(); return { id:id,
        onSnapshot: function(cb, er){ return api.orderBy(null).onSnapshot(function(s){ var d = s.docs.find(function(x){ return x.id === id; }); cb({ id:id, exists: !!d, data: function(){ return d ? d.data() : undefined; } }); }, er); },
        set: function(d){ return escribir('set', id, d); },
        update: function(d){ return escribir('update', id, d); },
        delete: function(){ return escribir('delete', id, {}); } }; },
      add: function(d){ return escribir('set', nuevoId(), d); },
      orderBy: function(campo, dir){ return { onSnapshot: function(cb, er){ var s = { cb:cb, err:er, campo:campo, dir:dir }; subs.push(s); if(cargado) cb(snap(s)); else refrescar(); sondeo(); return function(){ subs.splice(subs.indexOf(s),1); }; } }; },
      onSnapshot: function(cb, er){ return api.orderBy(null).onSnapshot(cb, er); }
    };
    cols[nombre] = api;
    return api;
  }

  var descargas = { save: function(o){ var url = URL.createObjectURL(o.data); var a = document.createElement('a'); a.href = url; a.download = o.filename || 'archivo'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 4000); return Promise.resolve({ status:'saved' }); } };

  var BN = window.BN = {
    conectado: function(){ return !!API; },
    hoja: HOJA,
    sesion: function(){ return !!cred(); },
    entrar: function(u, p){ var c = { u:u, p:p, prueba:true }; return llamar({ op:'ping' }, c).then(function(){ guardarCred({ u:u, p:p }); }); },
    salir: function(){ guardarCred(null); },
    db: { collection: coleccion, doc: function(ruta){ var p = String(ruta).split('/'); return coleccion(p[0]).doc(p[1]); } },
    alSalir: null
  };
  window.claude = { use: function(n){ return Promise.resolve(n === 'db' ? (cred() ? BN.db : null) : n === 'downloads' ? descargas : null); } };
})();
