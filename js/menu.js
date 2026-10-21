/* Botón Menú (celular y tableta): abre y cierra el menú; se cierra al elegir una opción. */
(function(){
  var b=document.getElementById('mmenu'),n=document.getElementById('menu');
  if(!b||!n)return;
  function set(o){n.classList.toggle('abierto',o);b.setAttribute('aria-expanded',o?'true':'false');}
  b.addEventListener('click',function(e){e.stopPropagation();set(!n.classList.contains('abierto'));});
  n.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){set(false);});});
})();
/* Submenús del encabezado: abren con clic (y con el mouse en escritorio), cierran con Esc o al dar clic fuera. */
(function(){
  var dds=[].slice.call(document.querySelectorAll('.dd'));
  function cerrar(excepto){dds.forEach(function(d){if(d!==excepto){d.classList.remove('open');d.querySelector('.ddb').setAttribute('aria-expanded','false');}});}
  // En computadora el submenú se abre al pasar el mouse y espera un momento antes de cerrarse,
  // para que dé tiempo de bajar a las opciones. El clic en el título lo deja abierto.
  var escritorio=window.matchMedia('(hover:hover) and (min-width:1181px)');
  function abrir(d){cerrar(d);d.classList.add('open');d.querySelector('.ddb').setAttribute('aria-expanded','true');}
  dds.forEach(function(d){
    var b=d.querySelector('.ddb'),t=null;
    b.addEventListener('click',function(e){e.stopPropagation();
      if(escritorio.matches){abrir(d);return;}
      var o=!d.classList.contains('open');cerrar(d);d.classList.toggle('open',o);b.setAttribute('aria-expanded',o?'true':'false');});
    d.addEventListener('mouseenter',function(){if(!escritorio.matches)return;clearTimeout(t);abrir(d);});
    d.addEventListener('mouseleave',function(){if(!escritorio.matches)return;clearTimeout(t);t=setTimeout(function(){d.classList.remove('open');b.setAttribute('aria-expanded','false');},450);});
  });
  document.addEventListener('click',function(e){if(!e.target.closest('.dd'))cerrar();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')cerrar();});
})();
/* Inicio y logo: en la página de inicio suben al principio; en las demás, regresan al inicio. Enlaces a secciones del inicio hacen scroll suave. */
(function(){
  var enInicio=!!document.querySelector('.hero');
  function cerrarMovil(){var n=document.getElementById('menu'),b=document.getElementById('mmenu');if(n&&n.classList.contains('abierto')){n.classList.remove('abierto');b&&b.setAttribute('aria-expanded','false');}}
  document.querySelectorAll('a[data-inicio]').forEach(function(a){
    a.addEventListener('click',function(e){if(!enInicio)return;e.preventDefault();cerrarMovil();window.scrollTo({top:0,behavior:'smooth'});});
  });
  if(enInicio){
    document.querySelectorAll('a[href^="index.html#"]').forEach(function(a){
      a.addEventListener('click',function(e){var id=a.getAttribute('href').split('#')[1],el=document.getElementById(id);if(!el)return;e.preventDefault();cerrarMovil();el.scrollIntoView({behavior:'smooth',block:'start'});});
    });
  }
})();
