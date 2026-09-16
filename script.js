const toggle = document.querySelector('.mobile-toggle');
const nav = document.querySelector('.nav-links');
if(toggle && nav){toggle.addEventListener('click',()=>nav.classList.toggle('open'));}
