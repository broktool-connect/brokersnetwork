/* Submenús del encabezado: abren con clic (y con el mouse en escritorio), cierran con Esc o al dar clic fuera. */
(function(){
  var dds=[].slice.call(document.querySelectorAll('.dd'));
  function cerrar(excepto){dds.forEach(function(d){if(d!==excepto){d.classList.remove('open');d.querySelector('.ddb').setAttribute('aria-expanded','false');}});}
  dds.forEach(function(d){
    var b=d.querySelector('.ddb');
    b.addEventListener('click',function(e){e.stopPropagation();var o=!d.classList.contains('open');cerrar(d);d.classList.toggle('open',o);b.setAttribute('aria-expanded',o?'true':'false');});
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
