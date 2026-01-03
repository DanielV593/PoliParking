import React from 'react';
const Footer = () => {
return (
<footer class="footer">
            <div class="footer__container">        
                <div class="footer-row">            
                    <div class="footer__col">
                        <h3 class="footer__title">Navegación</h3>
                        <ul class="footer__list">
                            <li><a href="#">Preguntas Frecuentes</a></li>
                            <li><a href="#">Términos y Condiciones</a></li>
                            <li><a href="#">Reglamento de Uso</a></li>
                            <li><a href="#">Soporte Técnico</a></li>
                        </ul>
                    </div>
                    <div class="footer__col">
                        <h3 class="footer__title">Horarios de Atención</h3>
                        <ul class="footer__list">
                            <li><span class="label">Lunes - Viernes:</span> 07:00 - 21:00</li>
                            <li><span class="label">Sábados:</span> 08:00 - 13:00</li>
                            <li><span class="label">Domingos:</span> Cerrado</li>
                        </ul>
                    </div>
                    <div class="footer__col">
                        <h3 class="footer__title">Contáctanos</h3>
                        <ul class="footer__list contact-list">
                            <li>
                                <i class="fa-solid fa-phone"></i> 
                                (593) 22976300
                            </li>
                            <li>
                                <i class="fa-solid fa-envelope"></i> 
                                info@epn.edu.ec
                            </li>
                            <li>
                                <i class="fa-solid fa-location-dot"></i> 
                                Edificio Administrativo, Planta Baja
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="footer__bottom">
                <p>© 2025 PoliParking - Escuela Politécnica Nacional</p>
            </div>
        </footer>
    );
};

export default Footer;