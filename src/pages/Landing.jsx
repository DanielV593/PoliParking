import React from 'react';
import Header from '../components/header/Header';
import Hero from '../sections/hero/hero';
import About from '../sections/about/about'
import App from '../sections/app/app';
import Servives from '../sections/services/services'
import Gallery from '../sections/gallery/gallery';
import Contact from '../sections/contact/contact';
import Find from '../sections/find_us/find';
import Footer from '../components/footer/Footer';


const Landing = () => {
return (
    <>
    <Header />
    <Hero/>
    <About/>
    <Servives/>
    <App/>
    <Gallery/>
    <Contact/>
    <Find/>
    <Footer />
    </>
    );
};

export default Landing;