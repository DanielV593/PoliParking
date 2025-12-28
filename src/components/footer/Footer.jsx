import React from 'react';
const Footer = () => {
return (
    <footer className="footer">
        <div className="footer__container">        
            <div className="footer-row">            
                <div className="footer__col">
                    <h3 className="footer__title">Navegación</h3>
                    <ul className="footer__list">
                        <li><a href="#">Preguntas Frecuentes</a></li>
                        <li><a href="#">Términos y Condiciones</a></li>
                    </ul>
                </div>
                {/* ... (Copia aquí el resto de columnas del footer igual que en tu html) ... */}
                <div className="footer__col">
                    <h3 className="footer__title">Contáctanos</h3>
                    <p>(593) 22976300</p>
                </div>
            </div>
        </div>
        <div className="footer__bottom">
            <p>© 2025 PoliParking - Escuela Politécnica Nacional</p>
        </div>
    </footer>
    );
};

export default Footer;