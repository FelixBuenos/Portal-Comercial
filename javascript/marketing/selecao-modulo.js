// javascript/selecao-modulo.js

document.addEventListener('DOMContentLoaded', () => {
    const cardComercial = document.getElementById('card-comercial');
    const cardMarketing = document.getElementById('card-marketing');

    // Comportamento do Módulo Comercial
    if (cardComercial) {
        cardComercial.addEventListener('click', () => {
            window.location.href = 'hub.html';
        });
    }

    // Comportamento do Módulo Marketing
    if (cardMarketing) {
        cardMarketing.addEventListener('click', () => {
            window.location.href = 'marketing.html';
        });
    }
});